"use client";

import { useRef, useState } from "react";
import { Camera, Images, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  onChange: (file: File | null) => void;
}

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB, matches server action body limit

/**
 * Two separate inputs, two separate buttons — not one input trying to do
 * both jobs. Relying on `capture="environment"` alone is unreliable across
 * devices: some browsers force the camera open and hide the gallery option
 * entirely, others ignore `capture` altogether. Giving the reporter an
 * explicit "Take Photo" button (camera input) and "Choose from Gallery"
 * button (plain file input) works predictably everywhere, and degrades
 * gracefully to a normal file picker on desktop.
 */
export function PhotoCapture({ onChange }: PhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <div>
      {/* Camera input: capture="environment" opens the back camera directly
          on devices/browsers that support it, and just falls back to a
          normal file picker where it isn't supported (e.g. desktop). */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files)}
      />
      {/* Gallery input: no `capture` attribute, so this always opens the
          normal photo library / file browser, never the camera. */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files)}
      />

      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed",
              "border-neutral-300 bg-neutral-50 px-3 py-4 text-sm font-medium text-neutral-700",
              "hover:bg-neutral-100 active:scale-[0.98] transition"
            )}
          >
            <Camera className="h-5 w-5" aria-hidden />
            Take photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed",
              "border-neutral-300 bg-neutral-50 px-3 py-4 text-sm font-medium text-neutral-700",
              "hover:bg-neutral-100 active:scale-[0.98] transition"
            )}
          >
            <Images className="h-5 w-5" aria-hidden />
            Choose from gallery
          </button>
        </div>
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