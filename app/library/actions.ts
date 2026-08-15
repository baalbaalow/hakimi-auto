"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const VIDEO_BUCKET = "videos";

type DeleteDraftUploadResult = {
  ok: boolean;
  message: string;
};

export async function deleteDraftUpload(
  uploadId: string,
): Promise<DeleteDraftUploadResult> {
  if (!isUuid(uploadId)) {
    return {
      ok: false,
      message: "This draft could not be found.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Sign in again before deleting drafts.",
    };
  }

  const { data: upload, error: selectError } = await supabase
    .from("uploads")
    .select("id, user_id, storage_path, status")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return {
      ok: false,
      message: "The draft could not be checked. Please try again.",
    };
  }

  if (!upload) {
    return {
      ok: false,
      message: "This draft could not be found.",
    };
  }

  if (upload.status !== "draft") {
    return {
      ok: false,
      message: "Only drafts can be deleted from the library.",
    };
  }

  if (upload.storage_path) {
    if (!upload.storage_path.startsWith(`${user.id}/`)) {
      return {
        ok: false,
        message: "This draft failed the ownership check.",
      };
    }

    const { error: storageError } = await supabase.storage
      .from(VIDEO_BUCKET)
      .remove([upload.storage_path]);

    if (storageError) {
      return {
        ok: false,
        message: "The stored video could not be deleted. Please try again.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("uploads")
    .delete()
    .eq("id", upload.id)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (deleteError) {
    return {
      ok: false,
      message: "The draft row could not be deleted. Please try again.",
    };
  }

  revalidatePath("/library");

  return {
    ok: true,
    message: "Draft deleted.",
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
