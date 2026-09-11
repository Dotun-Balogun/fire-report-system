"use client";

import { useRef, useState } from "react";
import { Camera, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  onChange: (file: File | null) => void;
}

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB, matches server action body limit

/**
 * Deliberately NOT a text input. The reporter only ever sees a big button
 * and, once they've taken a shot, a preview. `capture="environment"` is
 * what makes a tap open the phone's back camera directly instead of a
 * gallery/file picker — the gallery is still reachable as a fallback the
 * browser offers automatically on most devices.
 */
export function PhotoCapture({ onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like a photo — please try again.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("That photo is too large. Please try one more shot.");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function reset() {
    setPreview(null);
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files)}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed",
            "border-neutral-300 bg-neutral-50 px-4 py-4 text-base font-medium text-neutral-700",
            "hover:bg-neutral-100 active:scale-[0.99] transition"
          )}
        >
          <Camera className="h-5 w-5" aria-hidden />
          Add a photo (optional)
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Photo of the incident" className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={reset}
            aria-label="Remove photo and retake"
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Retake
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <X className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-500">
        A photo helps responders prepare, but it&apos;s never required — send the report either way.
      </p>
    </div>
  );
}
