"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions";
import type { Profile } from "@/generated/prisma";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateProfile(formData);
        toast.success("Profile saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <input type="hidden" name="id" value={profile.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={profile.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={profile.email} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={profile.location ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" name="headline" defaultValue={profile.headline ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Target salary min (£)</Label>
          <Input
            id="salaryMin"
            name="salaryMin"
            type="number"
            defaultValue={profile.salaryMin ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Target salary max (£)</Label>
          <Input
            id="salaryMax"
            name="salaryMax"
            type="number"
            defaultValue={profile.salaryMax ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" rows={3} defaultValue={profile.summary ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Textarea id="skills" name="skills" rows={3} defaultValue={profile.skills ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="experience">Experience (used for CV generation &amp; matching)</Label>
        <Textarea
          id="experience"
          name="experience"
          rows={12}
          defaultValue={profile.experience ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mustHaves">Must-haves / dealbreakers</Label>
        <Textarea id="mustHaves" name="mustHaves" rows={2} defaultValue={profile.mustHaves ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
