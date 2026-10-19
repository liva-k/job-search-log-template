import { db } from "@/lib/db";
import { TrackerBoard } from "@/components/tracker-board";

export default async function TrackerPage() {
  const applications = await db.application.findMany({
    include: { job: { include: { company: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const items = applications.map((app) => ({
    id: app.id,
    stage: app.stage,
    job: {
      id: app.job.id,
      title: app.job.title,
      company: app.job.company ? { name: app.job.company.name } : null,
    },
  }));

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-0 flex-col gap-6">
      <div className="shrink-0">
        <h1 className="font-heading text-lg">Tracker</h1>
        <p className="text-sm text-muted-foreground">
          {applications.length} application{applications.length === 1 ? "" : "s"}
          {" · "}drag cards between stages
        </p>
      </div>

      <TrackerBoard items={items} />
    </div>
  );
}
