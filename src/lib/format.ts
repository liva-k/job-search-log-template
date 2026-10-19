import { ApplicationStage, JobSource } from "@/generated/prisma";

export const SOURCE_LABELS: Record<JobSource, string> = {
  LINKEDIN: "LinkedIn",
  WELCOME_TO_THE_JUNGLE: "Welcome to the Jungle",
  JACK_AND_JILL: "Jack & Jill",
  OTHER: "Other",
};

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  SAVED: "Saved",
  RESEARCHING: "Researching",
  APPLYING: "Applying",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const STAGE_ORDER: ApplicationStage[] = [
  ApplicationStage.SAVED,
  ApplicationStage.RESEARCHING,
  ApplicationStage.APPLYING,
  ApplicationStage.APPLIED,
  ApplicationStage.INTERVIEWING,
  ApplicationStage.OFFER,
  ApplicationStage.REJECTED,
  ApplicationStage.ARCHIVED,
];

export function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `£${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  return fmt((min ?? max) as number);
}
