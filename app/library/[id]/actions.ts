"use server";

import { revalidatePath } from "next/cache";
import type { DraftMetadataFieldErrors } from "@/lib/draft-validation";
import { validateDraftMetadata } from "@/lib/draft-validation";
import { isUuid } from "@/lib/identifiers";
import { createClient } from "@/utils/supabase/server";

export type EditDraftState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: DraftMetadataFieldErrors;
  revision: number;
};

export async function updateDraftMetadata(
  uploadId: string,
  previousState: EditDraftState,
  formData: FormData,
): Promise<EditDraftState> {
  void previousState;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorState("Sign in again before editing this draft.");
  }

  if (!isUuid(uploadId)) {
    return errorState("This draft could not be found.");
  }

  const validation = validateDraftMetadata({
    title: formData.get("title"),
    caption: formData.get("caption"),
  });

  if (!validation.valid) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      fieldErrors: validation.fieldErrors,
      revision: Date.now(),
    };
  }

  const { data: upload, error: selectError } = await supabase
    .from("uploads")
    .select("id, status")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return errorState("The draft could not be checked. Please try again.");
  }

  if (!upload) {
    return errorState("This draft could not be found.");
  }

  if (upload.status !== "draft") {
    return errorState("Only draft records can be edited.");
  }

  const { data: updatedUpload, error: updateError } = await supabase
    .from("uploads")
    .update({
      title: validation.values.title,
      caption: validation.values.caption,
    })
    .eq("id", upload.id)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return errorState("The draft could not be saved. Please try again.");
  }

  if (!updatedUpload) {
    return errorState(
      "The draft changed before it could be saved. Refresh and try again.",
    );
  }

  revalidatePath("/library");
  revalidatePath(`/library/${upload.id}`);
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Draft details saved.",
    fieldErrors: {},
    revision: Date.now(),
  };
}

function errorState(message: string): EditDraftState {
  return {
    status: "error",
    message,
    fieldErrors: {},
    revision: Date.now(),
  };
}
