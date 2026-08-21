"use server";

import { revalidatePath } from "next/cache";
import {
  executeTikTokDirectPost,
  type TikTokDirectPostSettings,
} from "@/lib/tiktok-content-posting";
import { validateDraftMetadata } from "@/lib/draft-validation";
import { isUuid } from "@/lib/identifiers";
import { readVideoDurationSeconds } from "@/lib/video-duration";
import { createClient } from "@/utils/supabase/server";

const VIDEO_BUCKET = "videos";
const MAX_SINGLE_UPLOAD_BYTES = 64 * 1024 * 1024;
const SUPPORTED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export type PublishDraftState = {
  status: "idle" | "success" | "error";
  message: string | null;
  revision: number;
};

export async function postDraftToTikTok(
  uploadId: string,
  previousState: PublishDraftState,
  formData: FormData,
): Promise<PublishDraftState> {
  void previousState;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorState("Sign in again before posting this draft.");
  }

  if (!isUuid(uploadId)) {
    return errorState("This draft could not be found.");
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, title, caption, status, storage_path, publish_id")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (uploadError) {
    return errorState("The draft could not be checked. Please try again.");
  }

  if (!upload) {
    return errorState("This draft could not be found.");
  }

  if (upload.status !== "draft") {
    return errorState(
      upload.status === "queued"
        ? "This upload is already queued with TikTok. Do not retry until its publishing status is checked."
        : upload.status === "processing"
          ? "This upload is already processing on TikTok and cannot be posted again."
        : "Only draft records can be posted.",
    );
  }

  if (upload.publish_id?.trim()) {
    return errorState(
      "This draft already has TikTok publishing history. Do not retry until its status is checked.",
    );
  }

  if (upload.publish_id !== null) {
    return errorState(
      "This draft has an invalid TikTok tracking state. Do not retry until its status is checked.",
    );
  }

  const settings = readPublishingSettings(formData);

  if (!settings.ok) {
    return errorState(settings.message);
  }

  const consentGiven = formData.get("tiktok_music_usage_consent") === "on";

  if (!consentGiven) {
    return errorState("Confirm TikTok's music usage terms before posting.");
  }

  const storagePath = upload.storage_path?.trim() ?? "";

  if (!isOwnedStoragePath(storagePath, user.id)) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The private video storage path could not be verified.",
    );
    return errorState("The private video storage path could not be verified.");
  }

  const metadata = validateDraftMetadata({
    title: upload.title,
    caption: upload.caption,
  });

  if (!metadata.valid) {
    return errorState(
      "Complete the draft title and caption before posting to TikTok.",
    );
  }

  const { data: videoBlob, error: downloadError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .download(storagePath);

  if (downloadError || !videoBlob) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The private video file could not be loaded.",
    );
    return errorState(
      "The private video file is missing or could not be loaded.",
    );
  }

  if (videoBlob.size === 0) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The stored video file is empty.",
    );
    return errorState("The stored video file is empty.");
  }

  if (videoBlob.size > MAX_SINGLE_UPLOAD_BYTES) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The video is too large for the current single-chunk upload.",
    );
    return errorState(
      "This video is too large for the current single-chunk upload.",
    );
  }

  const videoMimeType = resolveVideoMimeType(videoBlob.type, storagePath);

  if (!videoMimeType) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The stored video type is not supported by TikTok Direct Post.",
    );
    return errorState(
      "This video's file type is not supported by TikTok Direct Post.",
    );
  }

  let videoDurationSeconds: number | null = null;

  try {
    videoDurationSeconds = readVideoDurationSeconds(
      await videoBlob.arrayBuffer(),
      videoMimeType,
    );
  } catch {
    videoDurationSeconds = null;
  }

  if (!videoDurationSeconds) {
    await recordDraftError(
      supabase,
      upload.id,
      user.id,
      "The video duration could not be verified safely.",
    );
    return errorState(
      "The video duration could not be verified safely. Re-export the video and try again.",
    );
  }

  const { data: claimedUpload, error: claimError } = await supabase
    .from("uploads")
    .update({
      status: "queued",
      error_message: null,
    })
    .eq("id", upload.id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .is("publish_id", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    return errorState("The draft could not be prepared for posting.");
  }

  if (!claimedUpload) {
    return errorState(
      "This draft is already being sent or changed. Refresh before trying again.",
    );
  }

  let postResult: Awaited<ReturnType<typeof executeTikTokDirectPost>>;

  try {
    postResult = await executeTikTokDirectPost({
      caption: metadata.values.caption,
      videoBlob,
      videoMimeType,
      videoDurationSeconds,
      settings: settings.value,
      savePublishId: async (publishId) => {
        const { data: trackedUpload, error: trackingError } = await supabase
          .from("uploads")
          .update({
            publish_id: publishId,
            status: "queued",
            error_message: null,
          })
          .eq("id", upload.id)
          .eq("user_id", user.id)
          .eq("status", "queued")
          .is("publish_id", null)
          .select("id")
          .maybeSingle();

        return !trackingError && Boolean(trackedUpload);
      },
    });
  } catch {
    const publishingState = await loadOwnedPublishingState(
      supabase,
      upload.id,
      user.id,
    );

    if (
      publishingState?.status === "queued" &&
      publishingState.publish_id?.trim()
    ) {
      const message =
        "TikTok upload status is uncertain. Do not retry until publishing status is checked.";
      await recordQueuedPostError(
        supabase,
        upload.id,
        user.id,
        publishingState.publish_id,
        message,
      );
      return errorState(message);
    }

    const message = "TikTok posting failed before initialization. Please try again.";
    await restoreClaimedDraft(supabase, upload.id, user.id, message);
    return errorState(message);
  }

  if (!postResult.ok) {
    if (postResult.phase === "pre_init") {
      await restoreClaimedDraft(
        supabase,
        upload.id,
        user.id,
        postResult.message,
      );
      return errorState(postResult.message);
    }

    if (postResult.phase === "tracking_failed") {
      const publishingState = await loadOwnedPublishingState(
        supabase,
        upload.id,
        user.id,
      );

      if (publishingState?.publish_id === postResult.publishId) {
        await recordQueuedPostError(
          supabase,
          upload.id,
          user.id,
          postResult.publishId,
          postResult.message,
        );
      } else {
        await recordQueuedTrackingError(
          supabase,
          upload.id,
          user.id,
          postResult.message,
        );
      }

      return errorState(postResult.message);
    }

    await recordQueuedPostError(
      supabase,
      upload.id,
      user.id,
      postResult.publishId,
      postResult.message,
    );
    return errorState(postResult.message);
  }

  const { data: processingUpload, error: processingError } = await supabase
    .from("uploads")
    .update({
      publish_id: postResult.publishId,
      status: "processing",
      error_message: null,
    })
    .eq("id", upload.id)
    .eq("user_id", user.id)
    .eq("status", "queued")
    .eq("publish_id", postResult.publishId)
    .select("id")
    .maybeSingle();

  if (processingError || !processingUpload) {
    const message =
      "The video reached TikTok, but the local processing state could not be saved. Do not retry.";
    await recordQueuedPostError(
      supabase,
      upload.id,
      user.id,
      postResult.publishId,
      message,
    );
    return errorState(
      message,
    );
  }

  revalidatePath("/library");
  revalidatePath(`/library/${upload.id}`);
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Video transferred to TikTok and is now processing.",
    revision: Date.now(),
  };
}

function readPublishingSettings(
  formData: FormData,
):
  | { ok: true; value: TikTokDirectPostSettings }
  | { ok: false; message: string } {
  const privacyLevelValue = formData.get("privacy_level");
  const privacyLevel =
    typeof privacyLevelValue === "string" ? privacyLevelValue.trim() : "";
  const contentDisclosure = formData.get("content_disclosure") === "on";
  const brandContentToggle =
    contentDisclosure && formData.get("brand_content_toggle") === "on";
  const brandOrganicToggle =
    contentDisclosure && formData.get("brand_organic_toggle") === "on";

  if (!privacyLevel || privacyLevel.length > 80) {
    return {
      ok: false,
      message: "Choose a TikTok privacy option before posting.",
    };
  }

  if (contentDisclosure && !brandContentToggle && !brandOrganicToggle) {
    return {
      ok: false,
      message:
        "Choose Your brand, Branded content, or both for content disclosure.",
    };
  }

  if (brandContentToggle && privacyLevel === "SELF_ONLY") {
    return {
      ok: false,
      message:
        "Branded content cannot use private visibility. Choose another option or turn off Branded content.",
    };
  }

  return {
    ok: true,
    value: {
      privacyLevel,
      allowComment: formData.get("allow_comment") === "on",
      allowDuet: formData.get("allow_duet") === "on",
      allowStitch: formData.get("allow_stitch") === "on",
      contentDisclosure,
      brandContentToggle,
      brandOrganicToggle,
      isAigc: formData.get("is_aigc") === "on",
    },
  };
}

function isOwnedStoragePath(storagePath: string, userId: string) {
  return (
    storagePath.startsWith(`${userId}/`) &&
    storagePath.length > userId.length + 1 &&
    !storagePath.split("/").includes("..")
  );
}

function resolveVideoMimeType(blobType: string, storagePath: string) {
  const normalizedBlobType = blobType.split(";", 1)[0]?.trim().toLowerCase();

  if (normalizedBlobType && SUPPORTED_VIDEO_MIME_TYPES.has(normalizedBlobType)) {
    return normalizedBlobType;
  }

  const normalizedPath = storagePath.toLowerCase();

  if (normalizedPath.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (normalizedPath.endsWith(".mov")) {
    return "video/quicktime";
  }

  if (normalizedPath.endsWith(".webm")) {
    return "video/webm";
  }

  return null;
}

async function recordDraftError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string,
  userId: string,
  message: string,
) {
  await supabase
    .from("uploads")
    .update({ error_message: message })
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "draft");
}

async function restoreClaimedDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string,
  userId: string,
  message: string,
) {
  await supabase
    .from("uploads")
    .update({
      status: "draft",
      error_message: message,
    })
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "queued")
    .is("publish_id", null);
}

async function loadOwnedPublishingState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("uploads")
    .select("status, publish_id")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

async function recordQueuedPostError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string,
  userId: string,
  publishId: string,
  message: string,
) {
  await supabase
    .from("uploads")
    .update({ error_message: message })
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "queued")
    .eq("publish_id", publishId);
}

async function recordQueuedTrackingError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploadId: string,
  userId: string,
  message: string,
) {
  await supabase
    .from("uploads")
    .update({ error_message: message })
    .eq("id", uploadId)
    .eq("user_id", userId)
    .eq("status", "queued");
}

function errorState(message: string): PublishDraftState {
  return {
    status: "error",
    message,
    revision: Date.now(),
  };
}
