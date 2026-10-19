"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ApplicationStage, JobSource } from "@/generated/prisma";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function withInstructions(basePrompt: string, instructions?: string) {
  if (!instructions?.trim()) return basePrompt;
  return `${basePrompt}\n\nThe user also gave these instructions for this run — follow them, but don't invent facts to satisfy them: "${instructions.trim()}"`;
}

export async function createJob(formData: FormData) {
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const companyName = String(formData.get("companyName") || "").trim();
  const source = String(formData.get("source") || "OTHER") as JobSource;
  const location = String(formData.get("location") || "").trim() || null;
  const remote = formData.get("remote") === "on";
  const description = String(formData.get("description") || "").trim() || null;
  const salaryMinRaw = String(formData.get("salaryMin") || "").trim();
  const salaryMaxRaw = String(formData.get("salaryMax") || "").trim();

  if (!url || !title || !companyName) {
    throw new Error("URL, title, and company are required.");
  }

  const company = await db.company.upsert({
    where: { name: companyName },
    update: {},
    create: { name: companyName },
  });

  const job = await db.job.create({
    data: {
      url,
      title,
      source,
      location,
      remote,
      description,
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      companyId: company.id,
      application: { create: { stage: ApplicationStage.SAVED } },
    },
  });

  revalidatePath("/");
  revalidatePath("/tracker");
  return job.id;
}

function decodeEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export async function fetchJobDetails(url: string) {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Couldn't reach that URL — paste the details in manually.");
  }

  if (!res.ok) {
    throw new Error(
      `That site returned an error (${res.status}) — paste the details in manually.`
    );
  }

  const html = await res.text();
  const pick = (re: RegExp) => html.match(re)?.[1]?.trim();

  const title = decodeEntities(
    pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<title[^>]*>([^<]+)<\/title>/i) ??
      ""
  );
  const description = decodeEntities(
    pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
      ""
  );
  const companySuggestion = decodeEntities(
    pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ?? ""
  );

  const looksBlocked =
    (!title && !description) ||
    /sign in|log ?in|verify you.?re human|captcha|authwall|just a moment|access denied/i.test(
      title
    );

  if (looksBlocked) {
    throw new Error(
      "That site blocked the automated fetch (common for LinkedIn, which requires a login) — paste the details in manually."
    );
  }

  return { title, description, companySuggestion };
}

export async function deleteJob(jobId: string) {
  await db.job.delete({ where: { id: jobId } });
  revalidatePath("/");
  revalidatePath("/tracker");
}

export async function updateApplicationStage(
  applicationId: string,
  stage: ApplicationStage
) {
  await db.application.update({
    where: { id: applicationId },
    data: {
      stage,
      appliedAt:
        stage === ApplicationStage.APPLIED ? new Date() : undefined,
    },
  });
  revalidatePath("/tracker");
  revalidatePath("/");
}

export async function updateApplicationNotes(
  applicationId: string,
  notes: string
) {
  await db.application.update({
    where: { id: applicationId },
    data: { notes },
  });
  revalidatePath("/tracker");
}

export async function updateInterviewPrep(
  applicationId: string,
  interviewPrep: string
) {
  await db.application.update({
    where: { id: applicationId },
    data: { interviewPrep },
  });
  revalidatePath(`/jobs`);
}

export async function updateCompanyResearch(
  companyId: string,
  research: string
) {
  await db.company.update({
    where: { id: companyId },
    data: { research },
  });
  revalidatePath("/companies");
  revalidatePath("/");
}

export async function researchCompany(companyId: string, instructions?: string) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error(
      "No ANTHROPIC_API_KEY set in .env — add your API key to enable company research."
    );
  }

  const [company, profile] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: companyId } }),
    db.profile.findFirst(),
  ]);
  const candidate = `${profile?.headline || "job seeker"}${
    profile?.location ? ` based in ${profile.location}` : ""
  }`;

  const prompt = withInstructions(
    `Research the company "${company.name}"${
      company.website ? ` (${company.website})` : ""
    } for a ${candidate} who is considering applying there. Today's date is ${new Date().toDateString()}.

Search the web and write a concise briefing covering:
- **What they do** — product, market, stage
- **Funding & stage** — most recent round, valuation, investors if notable
- **Size** — rough headcount, growth trajectory
- **Culture & sentiment** — Glassdoor/Blind-style employee sentiment, anything notable about design team or WLB
- **Recent news** — layoffs, leadership changes, launches, anything from the last 12 months
- **Watch-outs** — red flags a candidate should know before interviewing, if any

Keep it tight (a few sentences per section, not exhaustive), cite sources inline in parentheses (e.g. "(TechCrunch, Mar 2026)"), and say plainly when you can't find reliable information rather than guessing. If the company name is ambiguous or you're not confident you found the right company, say so at the top.`,
    instructions
  );

  const message = await anthropic.messages.create({
    // Sonnet: research quality matters and this is a light, on-demand,
    // per-company action — not something that runs automatically.
    model: "claude-sonnet-5",
    // Web search + synthesis needs real room: cutting this too low means
    // the model runs out of budget mid-brief (verified against the live
    // API before settling on this number).
    max_tokens: 3500,
    tools: [
      {
        // Pinned to this tool version deliberately: the newer web-search
        // tool versions let the model route search through a code-execution
        // sandbox, which for this prompt ballooned cost ~3x and sometimes
        // burned the whole token budget on tool orchestration before ever
        // writing the answer. allowed_callers forces direct tool calls only,
        // as a second guard against that.
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
        allowed_callers: ["direct"],
      },
    ],
    messages: [{ role: "user", content: prompt }],
  }, { timeout: 120_000 }); // fail fast instead of the SDK's 10-minute default

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!text.trim()) {
    throw new Error("Claude didn't return any research — try again.");
  }

  await db.company.update({
    where: { id: companyId },
    data: { research: text, researchUpdatedAt: new Date() },
  });

  revalidatePath("/companies");
  revalidatePath("/");
}

export async function updateProfile(formData: FormData) {
  const id = String(formData.get("id"));
  const salaryMinRaw = String(formData.get("salaryMin") || "").trim();
  const salaryMaxRaw = String(formData.get("salaryMax") || "").trim();

  await db.profile.update({
    where: { id },
    data: {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      location: String(formData.get("location") || "") || null,
      headline: String(formData.get("headline") || "") || null,
      summary: String(formData.get("summary") || "") || null,
      skills: String(formData.get("skills") || "") || null,
      experience: String(formData.get("experience") || "") || null,
      mustHaves: String(formData.get("mustHaves") || "") || null,
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
    },
  });

  revalidatePath("/profile");
}

export async function scoreJobMatch(jobId: string, instructions?: string) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error(
      "No ANTHROPIC_API_KEY set in .env — add your API key to enable match scoring."
    );
  }

  const [job, profile] = await Promise.all([
    db.job.findUniqueOrThrow({ where: { id: jobId }, include: { company: true } }),
    db.profile.findFirstOrThrow(),
  ]);

  const prompt = withInstructions(
    `You are helping a job seeker evaluate how well a job posting fits their profile.

CANDIDATE PROFILE
Headline: ${profile.headline}
Summary: ${profile.summary}
Skills: ${profile.skills}
Experience: ${profile.experience}
Must-haves: ${profile.mustHaves}
Target salary range: £${profile.salaryMin ?? "?"}-${profile.salaryMax ?? "?"}

JOB POSTING
Title: ${job.title}
Company: ${job.company?.name ?? "Unknown"}
Location: ${job.location ?? "Unknown"}${job.remote ? " (remote)" : ""}
Salary: ${job.salaryMin ?? "?"}-${job.salaryMax ?? "?"}
Description: ${job.description ?? "No description provided."}

Score this job's fit for the candidate from 0-100 and give a brief rationale (2-4 sentences, direct, specific — call out both strong matches and real gaps or dealbreakers). Respond ONLY as JSON: {"score": number, "rationale": string}`,
    instructions
  );

  const message = await anthropic.messages.create({
    // Haiku: this is a short classification + rationale task, no need to
    // pay Sonnet prices for it. Keeps per-score cost a fraction of a cent.
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse match score response.");
  const parsed = JSON.parse(jsonMatch[0]) as { score: number; rationale: string };

  await db.job.update({
    where: { id: jobId },
    data: { matchScore: parsed.score, matchRationale: parsed.rationale },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}

export async function generateCvDraft(applicationId: string, instructions?: string) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error(
      "No ANTHROPIC_API_KEY set in .env — add your API key to enable CV generation."
    );
  }

  const [application, profile] = await Promise.all([
    db.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { job: { include: { company: true } } },
    }),
    db.profile.findFirstOrThrow(),
  ]);

  const prompt = withInstructions(
    `You are helping a senior product designer tailor their CV for a specific job application. Write a tailored CV in clean markdown, reordering and rephrasing (never fabricating) their existing experience to foreground what's most relevant to this role.

CANDIDATE
Name: ${profile.name}
Email: ${profile.email}
Location: ${profile.location}
Headline: ${profile.headline}
Summary: ${profile.summary}
Skills: ${profile.skills}
Experience:
${profile.experience}

TARGET ROLE
Title: ${application.job.title}
Company: ${application.job.company?.name ?? "Unknown"}
Description: ${application.job.description ?? "No description provided."}

Output a complete, ready-to-use CV in markdown: header, a 2-3 sentence summary tailored to this role, then experience with the most relevant bullets emphasized first. Keep every fact truthful to the source material.`,
    instructions
  );

  const message = await anthropic.messages.create({
    // Sonnet: CV copy is the actual work product, worth the better writing.
    // Called once per application (on demand), not automatically, so
    // total spend stays low even at Sonnet rates.
    model: "claude-sonnet-5",
    // Thinking tokens count against this budget, so leave plenty of room
    // for a full CV after the model reasons.
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim()
    .replace(/^```(?:markdown|md)?\s*\n/, "")
    .replace(/\n```$/, "")
    .trim();

  if (message.stop_reason === "max_tokens") {
    throw new Error("The CV was cut off before it finished — try again.");
  }
  if (!text) {
    throw new Error("Claude didn't return anything — try again.");
  }

  const cvVersion = await db.cvVersion.create({
    data: {
      applicationId,
      label: `Draft ${new Date().toLocaleDateString("en-GB")}`,
      content: text,
    },
  });

  revalidatePath(`/jobs`);
  return cvVersion.id;
}

export async function updateCvVersion(cvVersionId: string, content: string) {
  await db.cvVersion.update({
    where: { id: cvVersionId },
    data: { content },
  });
  revalidatePath(`/jobs`);
}

export async function deleteCvVersion(cvVersionId: string) {
  await db.cvVersion.delete({ where: { id: cvVersionId } });
  revalidatePath(`/jobs`);
}

export async function generateInterviewPrep(applicationId: string, instructions?: string) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error(
      "No ANTHROPIC_API_KEY set in .env — add your API key to enable interview prep generation."
    );
  }

  const [application, profile] = await Promise.all([
    db.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { job: { include: { company: true } } },
    }),
    db.profile.findFirstOrThrow(),
  ]);

  const prompt = withInstructions(
    `You are helping a senior product designer prepare for an interview. Use their real experience and the job/company details below to draft interview prep they can build on.

CANDIDATE
Headline: ${profile.headline}
Summary: ${profile.summary}
Skills: ${profile.skills}
Experience:
${profile.experience}

ROLE
Title: ${application.job.title}
Company: ${application.job.company?.name ?? "Unknown"}
Job description: ${application.job.description ?? "No description provided."}

Company research notes (if any): ${application.job.company?.research ?? "None yet."}

Write, in markdown:
1. **Likely interview questions** — 6-10 questions this role/company would plausibly ask, grouped by type (background, role-specific/portfolio, behavioral, company-fit)
2. **Talking points** — for the meatiest questions, specific stories or achievements from the candidate's actual experience above they could use to answer well (reference real projects/numbers, don't invent any)
3. **Questions to ask them** — 3-5 sharp questions the candidate could ask the interviewer, tailored to this specific role/company rather than generic

Keep it as a working draft, not a script — concise bullet points they can riff on, not full prose answers.`,
    instructions
  );

  const message = await anthropic.messages.create({
    // Sonnet: this needs to reason well about mapping real experience to
    // likely questions. Called once per application, on demand.
    model: "claude-sonnet-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!text.trim()) {
    throw new Error("Claude didn't return anything — try again.");
  }

  await db.application.update({
    where: { id: applicationId },
    data: { interviewPrep: text },
  });

  revalidatePath(`/jobs`);
}

export async function checkAtsCompatibility(cvVersionId: string, instructions?: string) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error(
      "No ANTHROPIC_API_KEY set in .env — add your API key to enable ATS checks."
    );
  }

  const cvVersion = await db.cvVersion.findUniqueOrThrow({
    where: { id: cvVersionId },
    include: { application: { include: { job: true } } },
  });

  if (!cvVersion.content.trim()) {
    throw new Error("This CV draft is empty — generate a new one first.");
  }

  const prompt = withInstructions(
    `You are an ATS (Applicant Tracking System) compatibility checker for a CV/resume, similar to tools like Jobscan. Analyze the CV below against the target job description and score how well it would survive automated resume-screening software and keyword matching.

TARGET JOB
Title: ${cvVersion.application.job.title}
Description: ${cvVersion.application.job.description ?? "No description provided."}

CV/RESUME (markdown)
${cvVersion.content}

Assess:
- **Keyword match** — important skills/terms from the job description that are missing or only weakly represented in the CV
- **Formatting risks** — anything that could break ATS parsing (tables, columns, icons/emoji used as content, unusual headers, images, non-standard section names)
- **Structure** — standard section headers ATS engines expect (e.g. "Experience", "Education", "Skills") present and machine-readable
- **Quick wins** — 3-5 concrete, specific edits that would most improve the ATS match score

Respond ONLY as JSON: {"score": number (0-100, overall ATS compatibility), "missingKeywords": string[], "formattingRisks": string[], "quickWins": string[]}`,
    instructions
  );

  const message = await anthropic.messages.create({
    // Haiku: structured analysis against a fixed rubric, not creative
    // writing — same reasoning as match scoring, keeps this cheap.
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse ATS check response.");
  const parsed = JSON.parse(jsonMatch[0]) as {
    score: number;
    missingKeywords: string[];
    formattingRisks: string[];
    quickWins: string[];
  };

  const section = (title: string, items: string[], emptyText: string) =>
    `**${title}**\n${
      items.length ? items.map((item) => `- ${item}`).join("\n") : emptyText
    }`;

  const report = [
    section("Missing keywords", parsed.missingKeywords, "None found — good keyword coverage."),
    section("Formatting risks", parsed.formattingRisks, "None found."),
    section("Quick wins", parsed.quickWins, "Nothing further to suggest."),
  ].join("\n\n");

  await db.cvVersion.update({
    where: { id: cvVersionId },
    data: { atsScore: parsed.score, atsReport: report },
  });

  revalidatePath(`/jobs`);
}
