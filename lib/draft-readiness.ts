import { validateDraftMetadata } from "@/lib/draft-validation";

export type DraftReadinessCheckKey =
  | "status"
  | "video"
  | "title"
  | "caption"
  | "tiktok";

export type DraftReadinessCheck = {
  key: DraftReadinessCheckKey;
  label: string;
  ready: boolean;
  message?: string;
};

export type DraftReadiness = {
  ready: boolean;
  checks: DraftReadinessCheck[];
};

export type DraftReadinessUpload = {
  status: string | null;
  storage_path: string | null;
  title: string | null;
  caption: string | null;
};

export function getDraftReadiness(
  upload: DraftReadinessUpload,
  tiktokConnected: boolean,
): DraftReadiness {
  const metadata = validateDraftMetadata({
    title: upload.title,
    caption: upload.caption,
  });
  const isDraft = upload.status === "draft";
  const hasVideo = Boolean(upload.storage_path?.trim());
  const titleReady = !metadata.fieldErrors.title;
  const captionReady = !metadata.fieldErrors.caption;

  const checks: DraftReadinessCheck[] = [
    {
      key: "status",
      label: "Draft status",
      ready: isDraft,
      ...(!isDraft
        ? { message: "Only draft records can be prepared for publishing." }
        : {}),
    },
    {
      key: "video",
      label: "Video stored",
      ready: hasVideo,
      ...(!hasVideo ? { message: "Add a stored video." } : {}),
    },
    {
      key: "title",
      label: "Title complete",
      ready: titleReady,
      ...(metadata.fieldErrors.title
        ? { message: metadata.fieldErrors.title }
        : {}),
    },
    {
      key: "caption",
      label: "Caption complete",
      ready: captionReady,
      ...(metadata.fieldErrors.caption
        ? { message: metadata.fieldErrors.caption }
        : {}),
    },
    {
      key: "tiktok",
      label: "TikTok connected",
      ready: tiktokConnected,
      ...(!tiktokConnected ? { message: "TikTok account required." } : {}),
    },
  ];

  return {
    ready: checks.every((check) => check.ready),
    checks,
  };
}
