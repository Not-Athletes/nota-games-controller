"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type PassTabsProps = {
  passCount: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAddPass: () => void;
  disabled?: boolean;
};

export function PassTabs({
  passCount,
  activeIndex,
  onSelect,
  onReorder,
  onAddPass,
  disabled = false,
}: PassTabsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    if (disabled || dragIndex === null) return;
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (disabled || dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    onReorder(dragIndex, index);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-1">
      {Array.from({ length: passCount }, (_, index) => {
        const isActive = index === activeIndex;
        const isDragging = dragIndex === index;
        const isDragOver = dragOverIndex === index && dragIndex !== index;

        return (
          <button
            key={`pass-tab-${index}`}
            type="button"
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(index)}
            disabled={disabled}
            className={`rounded-t-sm px-4 py-2 text-sm font-medium transition ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing"
            } ${
              isActive
                ? "border border-b-0 border-zinc-200 bg-white text-zinc-900"
                : "border border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-50"
            } ${isDragging ? "opacity-50" : ""} ${isDragOver ? "ring-2 ring-[#1DB954]/40" : ""}`}
          >
            Pass {index + 1}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAddPass}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add pass
      </button>
    </div>
  );
}
