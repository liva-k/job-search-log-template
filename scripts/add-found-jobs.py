#!/usr/bin/env python3
"""Add roles found by the scheduled job search to the Job Search Log tracker.

Usage: python3 scripts/add-found-jobs.py found.json [--dry-run]

found.json is a list of objects with these keys:
  title, company, url (required)
  source: LINKEDIN | WELCOME_TO_THE_JUNGLE | JACK_AND_JILL | OTHER
  location, remote (bool), salaryMin, salaryMax (ints, GBP),
  postedAt (YYYY-MM-DD), matchScore (0-100), matchRationale, description,
  companyWebsite, companyIndustry, companySize, companyFunding

Skips any role whose URL is already saved, or whose company + title
already exists (any stage, including archived or rejected).
New roles are saved with tracker stage SAVED.
"""
import json, sqlite3, sys, uuid, time, datetime, os

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "..", "prisma", "dev.db")
SOURCES = {"LINKEDIN", "WELCOME_TO_THE_JUNGLE", "JACK_AND_JILL", "OTHER"}

def new_id():
    return "c" + uuid.uuid4().hex[:24]

def ms(d):
    if not d:
        return None
    try:
        return int(datetime.datetime.strptime(d[:10], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc).timestamp() * 1000)
    except ValueError:
        return None

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    roles = json.load(open(args[0]))
    con = sqlite3.connect(DB)
    cur = con.cursor()
    now = int(time.time() * 1000)
    added, skipped = [], []
    for r in roles:
        title, company, url = r.get("title"), r.get("company"), r.get("url")
        if not (title and company and url):
            skipped.append((title, company, "missing title/company/url")); continue
        if cur.execute('SELECT 1 FROM "Job" WHERE url = ?', (url,)).fetchone():
            skipped.append((title, company, "URL already in tracker")); continue
        dup = cur.execute('SELECT 1 FROM "Job" j JOIN "Company" c ON c.id = j.companyId '
                          'WHERE lower(c.name) = lower(?) AND lower(j.title) = lower(?)', (company, title)).fetchone()
        if dup:
            skipped.append((title, company, "same company and title already in tracker")); continue
        row = cur.execute('SELECT id FROM "Company" WHERE lower(name) = lower(?)', (company,)).fetchone()
        if row:
            cid = row[0]
        else:
            cid = new_id()
            if not dry:
                cur.execute('INSERT INTO "Company" (id, name, website, industry, sizeEstimate, fundingStage, createdAt, updatedAt) '
                            'VALUES (?,?,?,?,?,?,?,?)',
                            (cid, company, r.get("companyWebsite"), r.get("companyIndustry"),
                             r.get("companySize"), r.get("companyFunding"), now, now))
        src = r.get("source", "OTHER")
        src = src if src in SOURCES else "OTHER"
        jid = new_id()
        if not dry:
            cur.execute('INSERT INTO "Job" (id, title, url, source, location, remote, salaryMin, salaryMax, description, '
                        'postedAt, savedAt, matchScore, matchRationale, companyId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                        (jid, title, url, src, r.get("location"), 1 if r.get("remote") else 0,
                         r.get("salaryMin"), r.get("salaryMax"), r.get("description"), ms(r.get("postedAt")),
                         now, r.get("matchScore"), r.get("matchRationale"), cid))
            cur.execute('INSERT INTO "Application" (id, jobId, stage, createdAt, updatedAt) VALUES (?,?,?,?,?)',
                        (new_id(), jid, "SAVED", now, now))
        added.append((title, company))
    if not dry:
        con.commit()
    print(("DRY RUN: would add" if dry else "Added"), len(added))
    for t, c in added: print("  +", t, "at", c)
    print("Skipped", len(skipped))
    for t, c, why in skipped: print("  -", t, "at", c, ":", why)

if __name__ == "__main__":
    main()
