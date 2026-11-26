"use client";

import { useState } from "react";
import Link from "next/link";
import { CompanyResearchCard } from "@/components/company-research-card";
import { SearchInput, matchesQuery } from "@/components/search-input";
import type { Company, Job } from "@/generated/prisma";

type CompanyWithJobs = Company & { jobs: Job[] };

export function CompanyList({ companies }: { companies: CompanyWithJobs[] }) {
  const [query, setQuery] = useState("");

  const filtered = companies.filter((company) =>
    matchesQuery(query, company.name, ...company.jobs.map((job) => job.title))
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by company or role"
      />

      {query.trim() && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {companies.length}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No companies match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((company) => (
            <CompanyResearchCard
              key={company.id}
              companyId={company.id}
              title={company.name}
              research={company.research}
              researchUpdatedAt={company.researchUpdatedAt}
              meta={
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-xs text-muted-foreground">
                    {company.jobs.length} job{company.jobs.length === 1 ? "" : "s"}
                  </span>
                  {company.jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="truncate text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {job.title}
                    </Link>
                  ))}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
