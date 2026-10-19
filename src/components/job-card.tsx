import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOURCE_LABELS, STAGE_LABELS, formatSalary } from "@/lib/format";
import type { ApplicationStage, Job, Company, Application } from "@/generated/prisma";

type JobWithRelations = Job & {
  company: Company | null;
  application: Application | null;
};

export function JobCard({ job }: { job: JobWithRelations }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className="flex flex-row items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/50">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading text-sm">{job.title}</p>
            {job.application && (
              <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
                {STAGE_LABELS[job.application.stage as ApplicationStage]}
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {job.company?.name ?? "Unknown company"}
            {job.location ? ` · ${job.location}` : ""}
            {salary ? ` · ${salary}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge variant="secondary" className="font-normal">
            {SOURCE_LABELS[job.source]}
          </Badge>
          {job.matchScore != null && (
            <Badge
              className="font-mono font-normal"
              variant={job.matchScore >= 70 ? "default" : "outline"}
            >
              {job.matchScore}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
