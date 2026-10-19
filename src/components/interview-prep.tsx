"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { AiActionButton } from "@/components/ai-action-button";
import { SavedTextarea } from "@/components/saved-textarea";
import { generateInterviewPrep, updateInterviewPrep } from "@/lib/actions";

export function InterviewPrep({
  applicationId,
  interviewPrep,
}: {
  applicationId: string;
  interviewPrep: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onGenerate(instructions: string) {
    startTransition(async () => {
      try {
        await generateInterviewPrep(applicationId, instructions);
        toast.success("Interview prep generated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate prep");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Interview prep</p>
        <AiActionButton
          label={interviewPrep ? "Regenerate" : "Generate with Claude"}
          pendingLabel="Generating…"
          isPending={isPending}
          onRun={onGenerate}
          instructionsPlaceholder="e.g. focus on system design questions, or I'm most nervous about..."
          icon={<GraduationCap className="size-3.5" />}
        />
      </div>
      <SavedTextarea
        key={interviewPrep ?? ""}
        initialValue={interviewPrep ?? ""}
        placeholder="Likely questions, talking points, questions to ask them..."
        onSave={updateInterviewPrep.bind(null, applicationId)}
        rows={10}
      />
      <p className="text-xs text-muted-foreground/70">
        Runs on Claude Sonnet &mdash; a cent or two per generation.
      </p>
    </div>
  );
}
