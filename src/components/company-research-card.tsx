"use client";

import { type ReactNode, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { AiActionButton } from "@/components/ai-action-button";
import { SavedTextarea } from "@/components/saved-textarea";
import { researchCompany, updateCompanyResearch } from "@/lib/actions";

export function CompanyResearchCard({
  companyId,
  title = "Company research",
  meta,
  research,
  researchUpdatedAt,
}: {
  companyId: string;
  title?: string;
  meta?: ReactNode;
  research: string | null;
  researchUpdatedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onResearch(instructions: string) {
    startTransition(async () => {
      try {
        await researchCompany(companyId, instructions);
        toast.success("Research updated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to research company");
      }
    });
  }

  const researchButton = (
    <AiActionButton
      label="Research company"
      pendingLabel="Researching…"
      isPending={isPending}
      onRun={onResearch}
      instructionsPlaceholder="e.g. focus on the design team, or check if they sponsor visas..."
      icon={<Search className="size-3.5" />}
    />
  );

  if (!research && !isPending) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-sm">{title}</p>
          {meta}
        </div>
        {researchButton}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-heading text-sm">{title}</p>
          {meta}
        </div>
        {researchButton}
      </div>
      {isPending ? (
        <p className="text-xs text-muted-foreground/70">
          Searching the web and reading results — this can take up to a
          minute, hang tight.
        </p>
      ) : (
        researchUpdatedAt && (
          <p className="text-xs text-muted-foreground/70">
            Last researched {researchUpdatedAt.toLocaleDateString("en-GB")}
          </p>
        )
      )}
      <SavedTextarea
        key={research ?? ""}
        initialValue={research ?? ""}
        placeholder="Funding, size, culture notes, Glassdoor sentiment, anything worth remembering..."
        onSave={updateCompanyResearch.bind(null, companyId)}
        rows={6}
      />
      <p className="text-xs text-muted-foreground/70">
        Runs on Claude Sonnet with web search &mdash; roughly 15&ndash;25 cents and
        up to a minute per company (it's doing several real searches).
      </p>
    </div>
  );
}
