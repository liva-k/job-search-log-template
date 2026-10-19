@AGENTS.md

# Job Search Log

A local job tracker (Next.js + SQLite) with AI match scoring, company research and CV tailoring, plus Claude Code skills that set up the user's profile and search for roles.

## First run

If `profile.json` or `JOB-SEARCH-TASK.md` doesn't exist, the user hasn't set up yet. Before doing anything else, suggest running `/setup`, which interviews them and writes both files.

## Personal data

These files hold the user's personal data and are gitignored. Never commit them, and never copy their contents into tracked files:

- `profile.json`, `JOB-SEARCH-TASK.md`, `resumes/*`, `.env`, `prisma/dev.db`

## Skills

- `/setup`: interview the user, write their profile and search brief, and load them into the app
- `/find-jobs`: search for new roles matching the brief, save them to the tracker, report back

## Useful commands

- `npm run dev`: the app at http://localhost:4300
- `npm run db:seed`: reload `profile.json` into the app (adds sample jobs only if there are no jobs)
- `python3 scripts/add-found-jobs.py found.json [--dry-run]`: bulk-add roles to the tracker
