"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import {
  updateDraftMetadata,
  type EditDraftState,
} from "@/app/library/[id]/actions";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  DRAFT_CAPTION_MAX_LENGTH,
  DRAFT_TITLE_MAX_LENGTH,
  type DraftMetadataFieldErrors,
  validateDraftMetadata,
} from "@/lib/draft-validation";

const initialState: EditDraftState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  revision: 0,
};

type DraftMetadataFormProps = {
  uploadId: string;
  initialTitle: string | null;
  initialCaption: string | null;
};

export function DraftMetadataForm({
  uploadId,
  initialTitle,
  initialCaption,
}: DraftMetadataFormProps) {
  const updateDraftWithId = updateDraftMetadata.bind(null, uploadId);
  const [state, formAction, pending] = useActionState(
    updateDraftWithId,
    initialState,
  );
  const [title, setTitle] = useState(initialTitle ?? "");
  const [caption, setCaption] = useState(initialCaption ?? "");
  const [clientErrors, setClientErrors] =
    useState<DraftMetadataFieldErrors>({});
  const [dismissedRevision, setDismissedRevision] = useState<number | null>(null);
  const showServerState = dismissedRevision !== state.revision;

  const visibleServerErrors = showServerState ? state.fieldErrors : {};
  const titleError = clientErrors.title ?? visibleServerErrors.title;
  const captionError = clientErrors.caption ?? visibleServerErrors.caption;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pending) {
      event.preventDefault();
      return;
    }

    const validation = validateDraftMetadata({ title, caption });
    setClientErrors(validation.fieldErrors);
    setDismissedRevision(state.revision);

    if (!validation.valid) {
      event.preventDefault();
      return;
    }

    setTitle(validation.values.title);
    setCaption(validation.values.caption);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setClientErrors((currentErrors) => ({
      ...currentErrors,
      title: undefined,
    }));
    setDismissedRevision(state.revision);
  };

  const handleCaptionChange = (value: string) => {
    setCaption(value);
    setClientErrors((currentErrors) => ({
      ...currentErrors,
      caption: undefined,
    }));
    setDismissedRevision(state.revision);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Draft metadata
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Edit title and caption
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Changes stay in draft status and do not publish this video.
          </p>
        </div>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block text-sm font-medium text-[var(--muted-strong)]">
          Title
          <Input
            name="title"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            className="mt-2"
            required
            disabled={pending}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? "draft-title-error" : "draft-title-count"}
          />
          <span
            id="draft-title-count"
            className="mt-2 block text-xs text-[var(--muted)]"
          >
            {title.length}/{DRAFT_TITLE_MAX_LENGTH} characters
          </span>
          {titleError ? (
            <span id="draft-title-error" className="mt-2 block text-sm text-rose-200">
              {titleError}
            </span>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-[var(--muted-strong)]">
          Caption
          <Textarea
            name="caption"
            value={caption}
            onChange={(event) => handleCaptionChange(event.target.value)}
            className="mt-2 min-h-40"
            rows={7}
            required
            disabled={pending}
            aria-invalid={Boolean(captionError)}
            aria-describedby={
              captionError ? "draft-caption-error" : "draft-caption-count"
            }
          />
          <span
            id="draft-caption-count"
            className="mt-2 block text-xs text-[var(--muted)]"
          >
            {caption.length}/{DRAFT_CAPTION_MAX_LENGTH} characters
          </span>
          {captionError ? (
            <span
              id="draft-caption-error"
              className="mt-2 block text-sm text-rose-200"
            >
              {captionError}
            </span>
          ) : null}
        </label>

        {showServerState && state.message ? (
          <div
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`flex items-start gap-2 rounded-[var(--radius)] border p-3 text-sm ${
              state.status === "success"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/20 bg-rose-300/10 text-rose-100"
            }`}
          >
            {state.status === "success" ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{state.message}</span>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            {pending ? "Saving draft" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
