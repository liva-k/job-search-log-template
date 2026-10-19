"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SavedTextarea({
  initialValue,
  placeholder,
  onSave,
  rows = 4,
}: {
  initialValue: string;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  rows?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const dirty = value !== initialValue;

  function save() {
    startTransition(async () => {
      try {
        await onSave(value);
        toast.success("Saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      {dirty && (
        <Button size="sm" variant="outline" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      )}
    </div>
  );
}
