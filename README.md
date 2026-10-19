# Job Search Log

A local job tracker that works with Claude. Save job postings, get an AI match score against your profile, research companies, draft tailored CVs, and move applications through a Kanban board. With [Claude Code](https://claude.com/claude-code) it can also interview you to build your profile and search the web for new roles.

Everything runs on your own machine. Your data stays in a local SQLite file and is never committed to git.

## What's in it

- **Jobs**: save postings (paste the URL and description). Each job gets a match score (0 to 100) with a rationale, watch-outs and the angle to take in your CV.
- **Tracker**: a Kanban board from Saved through Researching, Applying, Applied, Interviewing to Offer or Rejected.
- **Companies**: created from your saved jobs. One click gets a research briefing covering funding, size, culture, recent news and red flags.
- **CV versions**: tailored CV drafts per application, with an ATS check.
- **Interview prep**: likely questions and talking points based on the job and your experience.
- **Profile**: your background, which every AI feature uses.

No scraping: LinkedIn's terms prohibit automated extraction, so adding jobs is deliberately manual (or done by Claude through normal web search).

## What you need

- **Node.js 20 or newer** ([download](https://nodejs.org))
- **An Anthropic API key** for the AI buttons ([get one](https://console.anthropic.com/settings/keys)). The app runs without it, but scoring, research and CV drafts won't work. Each action costs a fraction of a cent to a few cents.
- **Claude Code** (optional, recommended) for the guided setup and job search. It comes in a terminal, desktop and web version.

## Setup

### 1. Get the code

Click **Use this template** on GitHub to make your own copy, then clone it. Or:

```bash
git clone https://github.com/<your-username>/<your-repo>.git job-search-log
```

### 2. Install and create the database

```bash
cd job-search-log
npm install
cp .env.example .env
npm run db:setup
```

Open `.env` and paste your Anthropic API key after `ANTHROPIC_API_KEY=`.

`db:setup` creates the database at `prisma/dev.db` and adds three sample jobs (marked "Sample") so you can see how things look. Delete them whenever you like.

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:4300](http://localhost:4300).

### 4. Set up your profile with Claude

Open the project folder in Claude Code and run:

```
/setup
```

Claude will:

1. Ask for your CV (drop it into `resumes/` or paste it in) and read it
2. Ask only what the CV doesn't already answer, one topic at a time: your background, your strongest work and its results, what you're looking for, salary, deal-breakers, where to search
3. Push for specifics where your CV is vague ("what changed, and how do you know?"), because concrete proof points make better matches and better CVs
4. Write your profile and search brief, and load them into the app
5. List any gaps worth filling, such as a key project with no metric or no salary floor

It takes about 15 to 20 minutes. Run `/setup` again any time to update things.

**No Claude Code?** Copy `profile.example.json` to `profile.json`, fill it in, run `npm run db:seed`, and edit the rest on the Profile page. To use the search brief with another assistant, fill in `JOB-SEARCH-TASK.template.md` and save it as `JOB-SEARCH-TASK.md`.

## What background information it needs

The better this is, the better everything else works. `/setup` asks for all of it, but here's what and why:

| Information | Used for |
|---|---|
| **CV and work history** (roles, companies, dates, what each company does) | CV drafts, match scoring |
| **3 to 5 proof points**: your strongest work with scale and measurable results | Match rationales, choosing which work to lead with, interview prep |
| **Skills** | Match scoring, ATS checks |
| **Target titles and level** | Scoring and filtering searches |
| **Location and working pattern** (office, hybrid, remote, time zones) | Scoring, company research context |
| **Salary floor and target range** | Scoring. A hard floor makes it much sharper |
| **Contract types, company stage, industries** | Scoring and filtering |
| **Strong pluses and deal-breakers** | Boosting or skipping roles |
| **Job boards for your field and location** | Where `/find-jobs` searches |

Where it's stored (all gitignored, so none of it ends up on GitHub):

- `profile.json`: the short version the app uses
- `JOB-SEARCH-TASK.md`: the full search brief Claude works from
- `resumes/`: your CV and `asset-brief.md`, the long version of your story

## Using it with Claude

**In the app:** the AI buttons (Score match, Research company, Draft CV, Check ATS, Interview prep) call the Anthropic API directly with your key. Each has an optional instructions field, e.g. "keep it to one page" or "focus on their design team".

**In Claude Code:** open the project folder and use:

| Command | What it does |
|---|---|
| `/setup` | Interview you and build or update your profile |
| `/find-jobs` | Search for new roles matching your brief, score them, save the good ones to the tracker and report back |

You can also just ask in plain words, for example:

- "Add this job: [URL]"
- "Which of my saved roles should I apply to first?"
- "Tailor my CV for the Acme job and lead with the onboarding project"
- "Run /find-jobs every Tuesday and Thursday at noon", which sets up a scheduled search

Claude never applies, messages recruiters or submits forms for you. It researches and reports, and you decide.

## Customising

- **Scoring:** edit the weights and minimum score in `JOB-SEARCH-TASK.md`.
- **Currency:** salaries display in GBP (£). Change it in `src/lib/format.ts` and the labels in `src/components/profile-form.tsx` and `src/components/add-job-dialog.tsx`.
- **Job sources:** the source list (LinkedIn, Welcome to the Jungle, Jack & Jill, Other) is the `JobSource` enum in `prisma/schema.prisma`.
- **Port:** change `4300` in the `dev` script in `package.json`.

## Project structure

```
src/app/            pages: jobs, tracker, companies, profile
src/components/     UI
src/lib/actions.ts  server actions, including all AI prompts
prisma/             schema, migrations, seed
scripts/            add-found-jobs.py: bulk-import roles found by /find-jobs
.claude/skills/     the /setup and /find-jobs skills
```

## Troubleshooting

- **"No ANTHROPIC_API_KEY set"**: add your key to `.env` and restart `npm run dev`.
- **Profile page errors or is empty**: run `npm run db:seed`.
- **Start fresh**: delete `prisma/dev.db` and run `npm run db:setup`.
