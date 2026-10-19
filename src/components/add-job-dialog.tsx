"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob, fetchJobDetails } from "@/lib/actions";
import { Plus, Wand2 } from "lucide-react";

export function AddJobDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isFetching, startFetching] = useTransition();
  const router = useRouter();

  const urlRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createJob(formData);
        toast.success("Job saved");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save job");
      }
    });
  }

  function onFetchDetails() {
    const url = urlRef.current?.value.trim();
    if (!url) {
      toast.error("Paste the posting URL first");
      return;
    }
    startFetching(async () => {
      try {
        const result = await fetchJobDetails(url);
        if (titleRef.current && !titleRef.current.value && result.title) {
          titleRef.current.value = result.title;
        }
        if (
          companyRef.current &&
          !companyRef.current.value &&
          result.companySuggestion
        ) {
          companyRef.current.value = result.companySuggestion;
        }
        if (
          descriptionRef.current &&
          !descriptionRef.current.value &&
          result.description
        ) {
          descriptionRef.current.value = result.description;
        }
        toast.success("Filled in what we could find — check it over");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't fetch that page");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Save a job posting</DialogTitle>
          <DialogDescription>
            Paste the details from LinkedIn, Welcome to the Jungle, or anywhere
            else you found it. &quot;Try autofill&quot; can grab the title/description
            for many sites, but not LinkedIn — it blocks automated fetches.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="url">Posting URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://..."
                  ref={urlRef}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={onFetchDetails}
                  disabled={isFetching}
                >
                  <Wand2 className="size-3.5" />
                  {isFetching ? "Fetching…" : "Try autofill"}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Senior Product Designer"
                ref={titleRef}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                name="companyName"
                required
                placeholder="Acme"
                ref={companyRef}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select name="source" defaultValue="OTHER">
                <SelectTrigger id="source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                  <SelectItem value="WELCOME_TO_THE_JUNGLE">
                    Welcome to the Jungle
                  </SelectItem>
                  <SelectItem value="JACK_AND_JILL">Jack &amp; Jill</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="City, Country" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMin">Salary min (£)</Label>
              <Input id="salaryMin" name="salaryMin" type="number" placeholder="90000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salaryMax">Salary max (£)</Label>
              <Input id="salaryMax" name="salaryMax" type="number" placeholder="120000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Job description (paste it in)</Label>
              <Textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Paste the full job description here..."
                ref={descriptionRef}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
