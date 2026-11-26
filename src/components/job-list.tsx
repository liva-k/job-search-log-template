"use client";

import { useState } from "react";
import { SearchInput, matchesQuery } from "@/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "@/components/job-card";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/format";
import type { Application, Company, Job } from "@/generated/prisma";

type JobWithRelations = Job & {
  company: Company | null;
  application: Application | null;
};

const ALL = "ALL";

export function JobList({ jobs }: { jobs: JobWithRelations[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState(ALL);

  const q = query.trim();
  const filtered = jobs.filter(
    (job) =>
      (stage === ALL || job.application?.stage === stage) &&
      matchesQuery(q, job.title, job.company?.name)
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by company or role"
        />
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STAGE_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(q || stage !== ALL) && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {jobs.length}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No jobs match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
