"use client";

import React, { useState, useRef, useEffect } from "react";

interface ProgressBarProps {
  value: number;
  editable?: boolean;
  onEdit?: (value: number) => void;
  className?: string;
  showLabel?: boolean;
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 text-gray-400"
    >
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export default function ProgressBar({
  value,
  editable = false,
  onEdit,
  className = "",
  showLabel = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(clampedValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(100, Math.max(0, parsed));
      onEdit?.(clamped);
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.round((x / rect.width) * 100);
    const clamped = Math.min(100, Math.max(0, percentage));
    setDraft(String(clamped));
    onEdit?.(clamped);
  };

  const startEditing = () => {
    if (!editable) return;
    setDraft(String(clampedValue));
    setEditing(true);
  };

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div
        className={`h-2 bg-gray-100 rounded-full overflow-hidden w-full ${
          editable ? "cursor-pointer" : ""
        }`}
        onClick={handleBarClick}
        role={editable ? "slider" : "progressbar"}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-blue-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {showLabel && (
        <>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={100}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className={`text-sm font-medium text-gray-700 whitespace-nowrap flex items-center ${
                editable
                  ? "hover:text-blue-600 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              {clampedValue}%
              {editable && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <PencilIcon />
                </span>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
