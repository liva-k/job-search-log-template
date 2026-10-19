import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SOURCE_LABELS, formatSalary } from "@/lib/format";
import { MatchScore } from "@/components/match-score";
import { StageSelect } from "@/components/stage-select";
import { SavedTextarea } from "@/components/saved-textarea";
import { CvVersions } from "@/components/cv-versions";
import { DeleteJobButton } from "@/components/delete-job-button";
import { CompanyResearchCard } from "@/components/company-research-card";
import { InterviewPrep } from "@/components/interview-prep";
import { updateApplicationNotes } from "@/lib/actions";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    include: { company: true, application: { include: { cvVersions: true } } },
  });

  if (!job) notFound();

  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All jobs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-heading text-xl">{job.title}</h1>
          <p className="text-sm text-muted-foreground">
            {job.company?.name ?? "Unknown company"}
            {job.location ? ` · ${job.location}` : ""}
            {salary ? ` · ${salary}` : ""}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className="font-normal">
              {SOURCE_LABELS[job.source]}
            </Badge>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View posting <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.application && (
            <StageSelect
              applicationId={job.application.id}
              stage={job.application.stage}
            />
          )}
          <DeleteJobButton jobId={job.id} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        <MatchScore jobId={job.id} score={job.matchScore} rationale={job.matchRationale} />

        {job.company && (
          <CompanyResearchCard
            companyId={job.company.id}
            research={job.company.research}
            researchUpdatedAt={job.company.researchUpdatedAt}
          />
        )}
      </div>

      {job.description && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Job description</p>
          <div className="whitespace-pre-wrap rounded-lg border border-border p-4 text-sm text-muted-foreground">
            {job.description}
          </div>
        </div>
      )}

      {job.application && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Application notes</p>
            <SavedTextarea
              initialValue={job.application.notes ?? ""}
              placeholder="Referral contacts, follow-up dates, general notes..."
              onSave={updateApplicationNotes.bind(null, job.application.id)}
            />
          </div>

          <CvVersions
            applicationId={job.application.id}
            versions={job.application.cvVersions}
          />

          <InterviewPrep
            applicationId={job.application.id}
            interviewPrep={job.application.interviewPrep}
          />
        </>
      )}
    </div>
  );
}
