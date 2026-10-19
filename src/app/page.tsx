import { db } from "@/lib/db";
import { AddJobDialog } from "@/components/add-job-dialog";
import { JobCard } from "@/components/job-card";

export default async function JobsPage() {
  const jobs = await db.job.findMany({
    include: { company: true, application: true },
    orderBy: { savedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} saved posting{jobs.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddJobDialog />
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No jobs saved yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
