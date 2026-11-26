import { db } from "@/lib/db";
import { CompanyList } from "@/components/company-list";

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
        <CompanyList companies={companies} />
      )}
    </div>
  );
}
