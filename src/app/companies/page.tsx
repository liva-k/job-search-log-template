import Link from "next/link";
import { db } from "@/lib/db";
import { CompanyResearchCard } from "@/components/company-research-card";

export default async function CompaniesPage() {
  const companies = await db.company.findMany({
    include: { jobs: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-lg">Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} compan{companies.length === 1 ? "y" : "ies"}
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No companies yet — they&apos;re created automatically when you save a job.
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <CompanyResearchCard
              key={company.id}
              companyId={company.id}
              title={company.name}
              research={company.research}
              researchUpdatedAt={company.researchUpdatedAt}
              meta={
                <div
                  key={company.id}
                  className="flex flex-wrap gap-x-3 gap-y-1"
                >
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
