"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { AiActionButton } from "@/components/ai-action-button";
import { scoreJobMatch } from "@/lib/actions";

export function MatchScore({
  jobId,
  score,
  rationale,
}: {
  jobId: string;
  score: number | null;
  rationale: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onScore(instructions: string) {
    startTransition(async () => {
      try {
        await scoreJobMatch(jobId, instructions);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to score job");
      }
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Match score</p>
        <AiActionButton
          label={score != null ? "Re-score" : "Score with Claude"}
          pendingLabel="Scoring…"
          isPending={isPending}
          onRun={onScore}
          instructionsPlaceholder="e.g. weigh salary more heavily, ignore the seniority mismatch..."
          icon={<Sparkles className="size-3.5" />}
        />
      </div>
      {score != null ? (
        <>
          <p className="font-mono text-2xl">{score}/100</p>
          {rationale && <p className="text-sm text-muted-foreground">{rationale}</p>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not scored yet.</p>
      )}
      <p className="text-xs text-muted-foreground/70">
        Runs on Claude Haiku &mdash; a fraction of a cent per score.
      </p>
    </div>
  );
}
