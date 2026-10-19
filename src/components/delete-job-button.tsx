"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteJob } from "@/lib/actions";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!confirm("Delete this job and its application? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await deleteJob(jobId);
        toast.success("Job deleted");
        router.push("/");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
      onClick={onDelete}
      disabled={isPending}
    >
      <Trash2 className="size-3.5" />
      Delete
    </Button>
  );
}
