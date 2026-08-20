export const MAX_VIDEO_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_FILE_LABEL = "50 MB";

export const ACCEPTED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
] as const;

export const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov"] as const;
