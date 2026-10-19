---
name: setup
description: Interview the user to build their job search profile. Reads their CV, asks only what's missing or vague, then writes profile.json, JOB-SEARCH-TASK.md and resumes/asset-brief.md and loads the profile into the app. Use when the user runs /setup, asks to set up or update their profile, or when profile.json or JOB-SEARCH-TASK.md doesn't exist yet.
---

# Setup interview

You're helping someone set up their job search. The goal is a profile specific enough that match scores, company research and tailored CVs are actually useful. Generic answers ("hard-working team player") make every downstream feature worse, so push gently for specifics.

## Ground rules

- **Ask one section at a time**, a few questions per message at most. This is a conversation, not a form.
- **Read before you ask.** If they gave you a CV, LinkedIn export or portfolio text, pull everything you can from it first, then only ask about gaps and vague spots. Never ask for something the CV already answers.
- **Never invent anything.** Not metrics, not skills, not dates. If they don't know a number, write what they do know ("reduced support tickets noticeably, exact figure unknown") and list it as a gap.
- **Play back what you understood** at the end of each section in a few lines, so they can correct it before you move on.
- If they want to skip a section, let them, and record it as a gap.
- This is personal data. Write it only to the gitignored files listed below.

## Step 0: Check where things stand

1. Check whether `profile.json`, `JOB-SEARCH-TASK.md` and anything in `resumes/` already exist.
   - If they exist, this is an update: read them, summarise what's there, and ask what they want to change. Then edit only that.
2. Check `.env` exists and has `ANTHROPIC_API_KEY` set (don't print the key). If not, tell them the app runs without it but the AI buttons won't work, and how to add it (see README).
3. Ask them to drop their CV into `resumes/` (or paste it into the chat) and share any portfolio or LinkedIn URL. If they have none, that's fine: you'll build it from the interview.

## Step 1: Background (from the CV first)

Fill in what you can, then ask about gaps:

- Name, email, location (city and country)
- Current title, company, what the company does, start date
- Previous roles: title, company, what it does, dates
- Years of experience, plus anything adjacent that counts
- Education, certifications (only if relevant to the roles they want)
- Portfolio and LinkedIn URLs

## Step 2: Proof points (the most important part)

Ask for their **3 to 5 strongest pieces of work**. For each one, make sure you have:

- What the problem or goal was
- What *they* did, as distinct from the team
- The scale (users, customers, revenue, markets, team size)
- The result, with a number if at all possible (before and after, percentage, time saved)

Then probe the vague CV bullets. Good follow-ups:

- "This bullet says 'improved onboarding'. What changed, and how do you know?"
- "Who else was involved? Were you leading, or one of several?"
- "Is there a number here, even a rough one? Or a customer quote?"
- "Which of these would you most want to talk about in an interview?"

## Step 3: What they're looking for

- Target titles and level
- Location and working pattern (in-office, hybrid, remote, and any time zone limits)
- Salary: hard floor, target range, currency. Remind them that a stated floor makes scoring much sharper.
- Contract types they will and won't accept
- Company stage and size preference
- Industries they want, industries where their experience transfers, and any to avoid
- Strong pluses: what would make them excited about a role
- Deal-breakers: what to skip outright

## Step 4: How the search should work

- Which job boards matter in their field and location (suggest a few you know of if they're unsure)
- Whether to adjust the default scoring weights in the template, and the minimum score worth reporting (default 65)
- Writing preferences for CVs and reports (spelling variant, tone, things to avoid)
- Whether they want a recurring search. If so, which days and time (they can schedule it later with Claude Code's scheduling)

## Step 5: Write the files

1. **`profile.json`** at the project root, following `profile.example.json` exactly (same keys). Notes:
   - `experience` is plain text: one block per role with outcome-led bullets, education at the end.
   - `salaryMin` and `salaryMax` are integers or null.
   - `mustHaves` is one line combining level, location, working pattern and the non-negotiables.
2. **`JOB-SEARCH-TASK.md`** from `JOB-SEARCH-TASK.template.md`: replace every `[placeholder]`, delete the HTML comments, and remove optional sections they skipped.
3. **`resumes/asset-brief.md`**: the long version. Snapshot, full experience text, each proof point written up in full (context, what they did, result, quotes), which proof point to lead with for which kind of role, and a "Gaps to fill" section at the end.
4. Load the profile into the app: `npm run db:seed`. This updates the profile without touching their jobs.

## Step 6: Wrap up

Tell them:

- What was written, and where
- **Gaps:** a short list of anything missing or weak (no metric on a key proof point, no salary floor, no portfolio, unclear target level), each with a suggestion for how to fill it
- What to try next:
  - Open http://localhost:4300/profile to check the profile reads right
  - Save a real job posting and press "Score match"
  - Run `/find-jobs` to search for roles

If they change their mind about anything later, they can run `/setup` again to update it.
