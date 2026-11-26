"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_JOB, PHOTO_MIME_TYPES } from "@/types";
import { validatePhotoSelection, type SelectedPhoto } from "@/features/technician/inspection-form";

const inputClass = "block w-full min-h-[var(--pc-control-min-height)] rounded-pc-control border border-pc-control-border px-3 py-2";

type PhotoEvidenceProps = {
  jobId: string;
  photos: SelectedPhoto[];
  notes: string;
  registeredIds: string[];
  headingRef: (heading: HTMLHeadingElement | null) => void;
  onPhotosChange: (photos: SelectedPhoto[]) => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PhotoEvidence({ jobId, photos, notes, registeredIds, headingRef, onPhotosChange, onNotesChange, onBack, onContinue }: PhotoEvidenceProps) {
  const [errors, setErrors] = useState<string[]>([]);

  function selectFiles(files: FileList) {
    const result = validatePhotoSelection(jobId, Array.from(files), photos.length);
    setErrors(result.errors);
    onPhotosChange([...photos, ...result.accepted.map((file) => ({ id: crypto.randomUUID(), file, caption: "" }))]);
  }

  return (
    <section aria-labelledby="photo-evidence-heading" className="min-w-0 space-y-4 rounded-pc-card border border-pc-border bg-pc-surface p-5 shadow-pc-card">
      <h2 ref={headingRef} id="photo-evidence-heading" tabIndex={-1} className="text-[length:var(--pc-type-section)] font-semibold">Photo Evidence and Notes</h2>
      <p className="text-sm text-pc-muted">Photos are optional. Selections stay in this open form as local previews.</p>
      <div className="space-y-2">
        <label htmlFor="inspection-photos" className="font-semibold">Add photos</label>
        <p id="photo-limits" className="text-sm text-pc-muted">
          JPEG, PNG or WebP. Up to {MAX_PHOTO_BYTES / (1024 * 1024)} MB each and {MAX_PHOTOS_PER_JOB} per job.
          {" "}{photos.length} of {MAX_PHOTOS_PER_JOB} selected.
        </p>
        <input
          id="inspection-photos"
          className={inputClass}
          type="file"
          multiple
          accept={PHOTO_MIME_TYPES.join(",")}
          aria-describedby="photo-limits"
          onChange={(event) => {
            const input = event.currentTarget;
            if (input.files?.length) selectFiles(input.files);
            input.value = "";
          }}
        />
        {errors.length > 0 && (
          <ul role="alert" className="space-y-1 break-words text-sm text-pc-danger-text">
            {errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
          </ul>
        )}
      </div>
      {photos.length > 0 && (
        <ul aria-label="Selected photos" className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="min-w-0 space-y-2 rounded-pc-control border border-pc-border p-3">
              <PhotoPreview file={photo.file} />
              <p className="break-words text-sm font-semibold">{photo.file.name}</p>
              <p className="text-sm text-pc-muted">{registeredIds.includes(photo.id) ? "Added (demo)" : "Selected"}</p>
              <label className="block text-sm font-semibold" htmlFor={`caption-${photo.id}`}>Caption for photo {index + 1} (optional)</label>
              <input
                id={`caption-${photo.id}`}
                className={inputClass}
                value={photo.caption}
                readOnly={registeredIds.includes(photo.id)}
                maxLength={200}
                onChange={(event) => {
                  const caption = event.currentTarget.value;
                  onPhotosChange(photos.map((item) => item.id === photo.id ? { ...item, caption } : item));
                }}
              />
              <button
                type="button"
                className="min-h-[var(--pc-control-min-height)] rounded-pc-control px-1 font-semibold text-pc-primary underline"
                aria-label={`Remove Photo ${index + 1}: ${photo.file.name}`}
                onClick={() => {
                  setErrors([]);
                  onPhotosChange(photos.filter((item) => item.id !== photo.id));
                }}
              >
                Remove Photo
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-1.5">
        <label className="block font-semibold" htmlFor="inspection-notes">Inspection notes (optional)</label>
        <textarea
          id="inspection-notes"
          className={inputClass}
          rows={4}
          maxLength={2000}
          value={notes}
          onChange={(event) => onNotesChange(event.currentTarget.value)}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onContinue} className="min-h-[var(--pc-control-min-height)] rounded-pc-control bg-pc-primary px-4 font-semibold text-pc-on-primary hover:bg-pc-primary-hover">
          Continue to Confirmation
        </button>
        <button type="button" onClick={onBack} className="min-h-[var(--pc-control-min-height)] rounded-pc-control px-3 font-semibold text-pc-primary underline">
          Back to Checklist
        </button>
      </div>
    </section>
  );
}

function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  if (failed) return <p className="text-sm text-pc-muted">Preview unavailable.</p>;
  if (!url) return null;
  return (
    <Image unoptimized src={url} width={320} height={180} alt={`Selected photo: ${file.name}`}
      onError={() => setFailed(true)} className="h-32 w-full rounded-pc-control bg-pc-canvas object-contain" />
  );
}
