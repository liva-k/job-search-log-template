"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sparkles } from "lucide-react";

export function AiActionButton({
  label,
  pendingLabel,
  isPending,
  onRun,
  instructionsPlaceholder = "Any specific instructions for this run...",
  icon,
}: {
  label: string;
  pendingLabel: string;
  isPending: boolean;
  onRun: (instructions: string) => void;
  instructionsPlaceholder?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");

  function runMagic() {
    setOpen(false);
    onRun("");
  }

  function runWithInstructions() {
    setOpen(false);
    const value = instructions;
    setInstructions("");
    onRun(value);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" disabled={isPending}>
          {icon}
          {isPending ? pendingLabel : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="end">
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Add instructions (optional)</p>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={instructionsPlaceholder}
            rows={3}
            autoFocus
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={runMagic}
            className="text-muted-foreground"
          >
            <Sparkles className="size-3.5" />
            I believe in magic
          </Button>
          <Button size="sm" onClick={runWithInstructions}>
            Run
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
