"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { updateApplicationStage } from "@/lib/actions";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/format";
import type { ApplicationStage } from "@/generated/prisma";

export type TrackerItem = {
  id: string;
  stage: ApplicationStage;
  job: {
    id: string;
    title: string;
    company: { name: string } | null;
  };
};

export function TrackerBoard({ items: initialItems }: { items: TrackerItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // dnd-kit assigns internal aria ids from a module-level counter, which can
  // come out different between the SSR pass and the client hydration pass
  // and trip a (harmless) hydration warning. Mounting the DnD tree only on
  // the client sidesteps that entirely — there's nothing server-rendered to
  // mismatch against.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    items: items.filter((item) => item.stage === stage),
  }));

  const activeItem = items.find((item) => item.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const applicationId = String(active.id);
    const newStage = over.id as ApplicationStage;
    const current = items.find((item) => item.id === applicationId);
    if (!current || current.stage === newStage) return;

    const previousStage = current.stage;
    setItems((prev) =>
      prev.map((item) =>
        item.id === applicationId ? { ...item, stage: newStage } : item
      )
    );

    startTransition(async () => {
      try {
        await updateApplicationStage(applicationId, newStage);
      } catch (err) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === applicationId ? { ...item, stage: previousStage } : item
          )
        );
        toast.error(err instanceof Error ? err.message : "Failed to move card");
      }
    });
  }

  if (!mounted) {
    return (
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
        {byStage.map(({ stage, items: stageItems }) => (
          <StaticColumn key={stage} stage={stage} items={stageItems} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      id="tracker-board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
        {byStage.map(({ stage, items: stageItems }) => (
          <Column key={stage} stage={stage} items={stageItems} />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? <CardBody item={activeItem} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function StaticColumn({
  stage,
  items,
}: {
  stage: ApplicationStage;
  items: TrackerItem[];
}) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
          {STAGE_LABELS[stage]}
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg bg-secondary/30 p-2">
        {items.map((item) => (
          <CardBody key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}

function Column({
  stage,
  items,
}: {
  stage: ApplicationStage;
  items: TrackerItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between px-1">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">
          {STAGE_LABELS[stage]}
        </p>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg p-2 transition-colors ${
          isOver ? "bg-accent" : "bg-secondary/30"
        }`}
      >
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            {isOver ? "Drop here" : "Empty"}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ item }: { item: TrackerItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-30" : ""}
    >
      <CardBody item={item} />
    </div>
  );
}

function CardBody({
  item,
  dragging = false,
}: {
  item: TrackerItem;
  dragging?: boolean;
}) {
  const className = `space-y-0.5 rounded-lg border border-border bg-card p-3 touch-none select-none ${
    dragging ? "cursor-grabbing shadow-lg" : "cursor-grab"
  }`;

  if (dragging) {
    return (
      <div className={className}>
        <p className="truncate font-heading text-sm">{item.job.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.job.company?.name ?? "Unknown"}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link href={`/jobs/${item.job.id}`} className="block space-y-0.5">
        <p className="truncate font-heading text-sm hover:underline">
          {item.job.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.job.company?.name ?? "Unknown"}
        </p>
      </Link>
    </div>
  );
}
