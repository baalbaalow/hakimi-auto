export const DRAFT_TITLE_MAX_LENGTH = 120;
export const DRAFT_CAPTION_MAX_LENGTH = 2200;

export type DraftMetadataFieldErrors = {
  title?: string;
  caption?: string;
};

export type DraftMetadataValidation = {
  values: {
    title: string;
    caption: string;
  };
  fieldErrors: DraftMetadataFieldErrors;
  valid: boolean;
};

export function validateDraftMetadata(input: {
  title: unknown;
  caption: unknown;
}): DraftMetadataValidation {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const caption = typeof input.caption === "string" ? input.caption.trim() : "";
  const fieldErrors: DraftMetadataFieldErrors = {};

  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > DRAFT_TITLE_MAX_LENGTH) {
    fieldErrors.title = `Title must be ${DRAFT_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (!caption) {
    fieldErrors.caption = "Caption is required.";
  } else if (caption.length > DRAFT_CAPTION_MAX_LENGTH) {
    fieldErrors.caption = `Caption must be ${DRAFT_CAPTION_MAX_LENGTH.toLocaleString("en-US")} characters or fewer.`;
  }

  return {
    values: { title, caption },
    fieldErrors,
    valid: Object.keys(fieldErrors).length === 0,
  };
}
