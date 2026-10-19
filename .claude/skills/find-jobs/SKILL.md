---
name: find-jobs
description: Search the web for new roles that match the user's brief in JOB-SEARCH-TASK.md, score them, save the good ones to the tracker and report back. Use when the user runs /find-jobs, asks to find or search for jobs, or a scheduled search runs.
---

# Find jobs

1. Read `JOB-SEARCH-TASK.md`. If it doesn't exist, stop and tell the user to run `/setup` first.
2. Check what's already in the tracker so you don't report it again:
   ```
   sqlite3 prisma/dev.db 'SELECT c.name, j.title, j.url FROM "Job" j LEFT JOIN "Company" c ON c.id = j.companyId'
   ```
3. Search the sources listed in the brief, following its freshness window, rules and skip list exactly. Never apply, log in, create accounts or submit forms.
4. Score each role using the brief's weights. Keep only roles at or above its minimum score.
5. Write the keepers to `found.json` in the shape the brief describes, then run:
   ```
   python3 scripts/add-found-jobs.py found.json --dry-run
   python3 scripts/add-found-jobs.py found.json
   ```
   Delete `found.json` afterwards.
6. Report in the brief's report format, highest score first. If nothing qualified, say so plainly. Don't pad the list.
