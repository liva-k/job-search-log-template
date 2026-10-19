"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Copy, Trash2, ScanSearch } from "lucide-react";
import { AiActionButton } from "@/components/ai-action-button";
import { SavedTextarea } from "@/components/saved-textarea";
import {
  checkAtsCompatibility,
  deleteCvVersion,
  generateCvDraft,
  updateCvVersion,
} from "@/lib/actions";
import type { CvVersion } from "@/generated/prisma";

export function CvVersions({
  applicationId,
  versions,
}: {
  applicationId: string;
  versions: CvVersion[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onGenerate(instructions: string) {
    startTransition(async () => {
      try {
        await generateCvDraft(applicationId, instructions);
        toast.success("CV draft generated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate CV");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">CV drafts</p>
        <AiActionButton
          label="Generate draft"
          pendingLabel="Generating…"
          isPending={isPending}
          onRun={onGenerate}
          instructionsPlaceholder="e.g. keep it to one page, lead with my most recent role..."
          icon={<FileText className="size-3.5" />}
        />
      </div>
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No drafts yet.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <CvVersionItem key={v.id} version={v} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground/70">
        Runs on Claude Sonnet &mdash; roughly a cent or two per draft.
      </p>
    </div>
  );
}

function CvVersionItem({ version }: { version: CvVersion }) {
  const router = useRouter();
  const [isDeleting, startDeleting] = useTransition();
  const [isChecking, startChecking] = useTransition();

  function onDelete() {
    if (!confirm(`Delete "${version.label}"? This can't be undone.`)) return;
    startDeleting(async () => {
      try {
        await deleteCvVersion(version.id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete draft");
      }
    });
  }

  function onCheckAts(instructions: string) {
    startChecking(async () => {
      try {
        await checkAtsCompatibility(version.id, instructions);
        toast.success("ATS check complete");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to run ATS check");
      }
    });
  }

  return (
    <details className="rounded-md border border-border/60 p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {version.label}
          {version.atsScore != null && (
            <span
              className={`rounded-full border px-1.5 py-0.5 font-mono text-[0.68rem] ${
                version.atsScore >= 70
                  ? "border-border text-foreground"
                  : "border-destructive/40 text-destructive"
              }`}
            >
              ATS {version.atsScore}
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 text-muted-foreground">
          <button
            type="button"
            className="hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(version.content);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            className="hover:text-destructive"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        <SavedTextarea
          initialValue={version.content}
          onSave={updateCvVersion.bind(null, version.id)}
          rows={14}
        />
        <div className="space-y-2 rounded-md border border-border/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">ATS check</p>
            <AiActionButton
              label={version.atsScore != null ? "Re-check" : "Run ATS check"}
              pendingLabel="Checking…"
              isPending={isChecking}
              onRun={onCheckAts}
              instructionsPlaceholder="e.g. this JD is unusually keyword-heavy, weigh that..."
              icon={<ScanSearch className="size-3.5" />}
            />
          </div>
          {version.atsReport ? (
            <div className="whitespace-pre-wrap text-xs text-muted-foreground">
              {version.atsReport}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Checks keyword match against the job description and flags
              formatting that trips up ATS parsers.
            </p>
          )}
          <p className="text-xs text-muted-foreground/70">
            Runs on Claude Haiku &mdash; a fraction of a cent per check.
          </p>
        </div>
      </div>
    </details>
  );
}
