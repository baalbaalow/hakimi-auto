"use server";

import { revalidatePath } from "next/cache";
import { fetchTikTokPublishStatus } from "@/lib/tiktok-content-posting";

export type CheckTikTokStatusState = {
  status:
    | "idle"
    | "processing"
    | "published"
    | "failed"
    | "unchanged"
    | "error";
  message: string | null;
  revision: number;
};

export async function checkTikTokStatus(
  uploadId: string,
  previousState: CheckTikTokStatusState,
): Promise<CheckTikTokStatusState> {
  void previousState;

  const result = await fetchTikTokPublishStatus(uploadId);

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      revision: Date.now(),
    };
  }

  revalidatePath("/library");
  revalidatePath(`/library/${uploadId}`);
  revalidatePath("/dashboard");

  return {
    status: result.status,
    message: result.message,
    revision: Date.now(),
  };
}
