# Job Search Project: Context and Instructions

<!--
This is the template. Don't fill it in by hand unless you want to:
run /setup in Claude Code and it will interview you and write JOB-SEARCH-TASK.md (gitignored) from this.

This file is the brief Claude works from when it searches for roles, scores them and tailors CVs.
The more specific it is, the better the matches. Everything in [brackets] is a placeholder.
-->

Source of truth for the job search project and the scheduled search. Last updated: [date].

---

## Who I am

- **Name:** [Full name]
- **Current role:** [Title, Company (what it does), since Month Year]
- **Before that:** [Previous roles, one line each]
- **Experience:** [Years in the field, plus anything adjacent]
- **Location:** [City, Country]
- **Portfolio:** [URL, or "none"]
- **LinkedIn:** [URL]

**In short:** [Two or three sentences on what you do and how you work. Written the way you'd say it to a recruiter.]

**Proof points:**
<!-- The most important section. Each one: what you did, at what scale, and the measurable result. -->
- [Project: result with a number, e.g. conversion 30% to 47%, support tickets down 43%]
- [Project: result]
- [Project: result]

**Core skills:** [comma-separated list]

**Canonical CV:** [filename in resumes/]. Full detail lives in `resumes/asset-brief.md`.

---

## What I'm looking for

| | |
|---|---|
| **Titles** | [e.g. Product Designer, Senior Product Designer] |
| **Location** | [City. In-office, hybrid or remote? Time zone limits for remote?] |
| **Salary** | [Hard floor and target range, with currency] |
| **Contract type** | [Permanent, fixed-term, freelance, day-rate: which are OK?] |
| **Company stage** | [Startup, scaleup, enterprise: preference or open?] |
| **Industry** | [Open, or preferred industries. Where your domain experience is] |

**Strong pluses (boost the score):**
- [Domains or product types you'd love]
- [Ways of working you want, e.g. close to engineering, real ownership]

**Skip these:**
- [Salary below floor]
- [Contract types you won't take]
- [Levels or role types that don't fit]
- [Locations or relocation you won't consider]

---

## Where to search

- LinkedIn: only listings that surface through normal web search. Do not log in or scrape LinkedIn, its terms prohibit automated extraction.
- [Job boards that matter for your field and location]
- Company careers pages (Ashby, Greenhouse, Lever, Workable, Teamtailor boards)

**Freshness:** only roles posted since the previous run (roughly the last [N] days), or the last 14 days on a first run. Skip anything you can't confirm is still open.

---

## Rules

- **Never apply, message recruiters, create accounts, or submit forms.** Research and report only.
- Use only the details in this brief. Do not invent experience or skills.
- Do not report a role already in the tracker. The import script checks this, but check the tracker first so the report only lists new roles.
- [Any writing preferences, e.g. British spelling, no em dashes]

---

## How to score each role (0 to 100)

<!-- Adjust the weights to what matters most to you. They should add up to 100%. -->

| Factor | Weight |
|---|---|
| Role and level fit (title, ownership, scope) | 25% |
| Salary (stated, or a reasoned estimate) | 20% |
| Domain fit ([your preferred domains] score highest) | 20% |
| Skills overlap ([your core skills]) | 20% |
| Company stage ([preference] highest) | 15% |

Only report roles scoring **[65] or higher**. If nothing qualifies, say so. Do not pad the list.

---

## Saving roles to the tracker

The tracker is this app (SQLite at `prisma/dev.db`). Save each qualifying role with the import script:

```
python3 scripts/add-found-jobs.py found.json
```

`found.json` is a list of objects: `title`, `company`, `url` (required), plus `source` (LINKEDIN, WELCOME_TO_THE_JUNGLE, JACK_AND_JILL or OTHER), `location`, `remote` (true/false), `salaryMin`, `salaryMax` (integers), `postedAt` (YYYY-MM-DD), `matchScore`, `matchRationale` (why it fits, watch-outs and CV angle in plain text), `description`, `companyWebsite`, `companyIndustry`, `companySize`, `companyFunding`. New roles land in the tracker's Saved column. The script skips duplicates by URL or by company plus title. Run it with `--dry-run` first to check.

---

## Report format

Start with one summary line, for example: "6 new roles found, 2 strong matches (80+). All saved to your tracker." Then list roles from highest score to lowest:

```
### [Job title] at [Company] (score: 82)
- Link: [direct posting URL]
- Source: LinkedIn | Welcome to the Jungle | Jack & Jill | Other
- Location / working pattern: [e.g. hybrid 2 days]
- Salary: [range, or "not stated, est. ..."]
- Contract: permanent | fixed-term (length)
- Posted: YYYY-MM-DD
- Company: one line on what they do, size and stage
- Why it fits: 2 to 3 bullets tied to my proof points
- Watch-outs: anything that might not fit
- CV angle: which proof point to lead with
```

If the tracker couldn't be reached, still give the list and say the roles were not saved.

---

## Schedule

[Optional. e.g. "Runs Tuesday and Thursday at 12:50 local time." Most jobs are posted Monday to Wednesday, so a Tuesday and a Thursday run keeps you early.]
