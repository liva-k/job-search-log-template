"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateApplicationStage } from "@/lib/actions";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/format";
import type { ApplicationStage } from "@/generated/prisma";

export function StageSelect({
  applicationId,
  stage,
}: {
  applicationId: string;
  stage: ApplicationStage;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  function onChange(value: string) {
    startTransition(async () => {
      await updateApplicationStage(applicationId, value as ApplicationStage);
      router.refresh();
    });
  }

  return (
    <Select value={stage} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGE_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {STAGE_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
