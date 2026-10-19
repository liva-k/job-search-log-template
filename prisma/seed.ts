import fs from "node:fs";
import path from "node:path";
import { PrismaClient, ApplicationStage, JobSource } from "../src/generated/prisma";

const db = new PrismaClient();

// Your profile lives in profile.json at the project root (gitignored).
// The /setup skill in Claude Code writes it for you by interviewing you;
// see profile.example.json for the shape.
const PROFILE_PATH = path.join(__dirname, "..", "profile.json");

const PLACEHOLDER_PROFILE = {
  name: "Your Name",
  email: "you@example.com",
  location: null,
  headline: "Run /setup in Claude Code to fill in your profile",
  summary: null,
  skills: null,
  experience: null,
  mustHaves: null,
  salaryMin: null,
  salaryMax: null,
};

// Fictional sample data so the app isn't empty on first run.
// Only inserted when there are no jobs yet; delete them whenever you like.
const SAMPLE_JOBS: {
  title: string;
  company: { name: string; website: string; industry: string; sizeEstimate: string; fundingStage: string };
  source: JobSource;
  location: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  stage: ApplicationStage;
  matchScore: number | null;
  matchRationale: string | null;
}[] = [
  {
    title: "Senior Product Designer (Sample)",
    company: {
      name: "Acme Analytics (Sample)",
      website: "https://example.com",
      industry: "B2B SaaS",
      sizeEstimate: "51-200",
      fundingStage: "Series B",
    },
    source: JobSource.OTHER,
    location: "Hybrid, 2 days in office",
    remote: false,
    salaryMin: 70000,
    salaryMax: 85000,
    description:
      "This is a sample posting. Acme Analytics builds dashboards for operations teams. You'll own the end-to-end design of our reporting product, working with a PM and four engineers. Delete this job once you've added your own.",
    stage: ApplicationStage.SAVED,
    matchScore: 78,
    matchRationale:
      "Sample rationale: strong overlap on end-to-end ownership and B2B SaaS. Watch-outs: salary top end is close to the floor. CV angle: lead with your biggest measurable outcome.",
  },
  {
    title: "Product Designer, Growth (Sample)",
    company: {
      name: "Bramble Health (Sample)",
      website: "https://example.org",
      industry: "Health tech",
      sizeEstimate: "11-50",
      fundingStage: "Seed",
    },
    source: JobSource.WELCOME_TO_THE_JUNGLE,
    location: "Remote",
    remote: true,
    salaryMin: null,
    salaryMax: null,
    description:
      "This is a sample posting. Bramble Health is a small team building a patient booking app. You'll run experiments across onboarding and activation.",
    stage: ApplicationStage.APPLIED,
    matchScore: null,
    matchRationale: null,
  },
  {
    title: "UX Designer (Sample)",
    company: {
      name: "Cobalt Mobility (Sample)",
      website: "https://example.net",
      industry: "Transport",
      sizeEstimate: "201-500",
      fundingStage: "Series C",
    },
    source: JobSource.LINKEDIN,
    location: "On-site",
    remote: false,
    salaryMin: 55000,
    salaryMax: 65000,
    description: "This is a sample posting. Cobalt Mobility makes ticketing software for transit operators.",
    stage: ApplicationStage.INTERVIEWING,
    matchScore: null,
    matchRationale: null,
  },
];

function loadProfile() {
  if (!fs.existsSync(PROFILE_PATH)) {
    console.log("No profile.json found, using a placeholder profile.");
    return PLACEHOLDER_PROFILE;
  }
  const raw = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
  // Accept skills as either a list or a comma-separated string.
  if (Array.isArray(raw.skills)) raw.skills = raw.skills.join(", ");
  return { ...PLACEHOLDER_PROFILE, ...raw };
}

async function main() {
  const data = loadProfile();
  const existing = await db.profile.findFirst();
  if (existing) {
    await db.profile.update({ where: { id: existing.id }, data });
    console.log("Updated profile.");
  } else {
    await db.profile.create({ data });
    console.log("Created profile.");
  }

  if ((await db.job.count()) > 0) return;

  for (const [i, job] of SAMPLE_JOBS.entries()) {
    const { company, stage, ...fields } = job;
    await db.job.create({
      data: {
        ...fields,
        url: `https://example.com/jobs/sample-${i + 1}`,
        company: { create: company },
        application: { create: { stage } },
      },
    });
  }
  console.log(`Added ${SAMPLE_JOBS.length} sample jobs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
