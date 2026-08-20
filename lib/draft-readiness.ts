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

export type TikTokPublishingAuthorization = {
  connected: boolean;
  canPublishDirect: boolean;
};

export function getDraftReadiness(
  upload: DraftReadinessUpload,
  tiktokAuthorization: TikTokPublishingAuthorization,
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
      label: "TikTok publishing permission",
      ready:
        tiktokAuthorization.connected &&
        tiktokAuthorization.canPublishDirect,
      ...(!tiktokAuthorization.connected
        ? { message: "TikTok account required." }
        : !tiktokAuthorization.canPublishDirect
          ? { message: "Reconnect TikTok to authorize direct publishing." }
          : {}),
    },
  ];

  return {
    ready: checks.every((check) => check.ready),
    checks,
  };
}
