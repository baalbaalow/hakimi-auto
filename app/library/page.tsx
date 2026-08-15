import { LibraryView } from "@/components/app/LibraryView";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

const VIDEO_BUCKET = "videos";
const SIGNED_URL_EXPIRES_IN_SECONDS = 30 * 60;

export default async function LibraryPage() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("uploads")
    .select("id, title, caption, status, created_at, storage_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const uploads = await Promise.all(
    (data ?? []).map(async (upload) => {
      if (!upload.storage_path) {
        return {
          ...upload,
          signedUrl: null,
        };
      }

      const { data: signedData } = await supabase.storage
        .from(VIDEO_BUCKET)
        .createSignedUrl(
          upload.storage_path,
          SIGNED_URL_EXPIRES_IN_SECONDS,
        );

      return {
        ...upload,
        signedUrl: signedData?.signedUrl ?? null,
      };
    }),
  );

  return (
    <LibraryView
      initialUploads={uploads}
      loadError={error ? "Upload library could not be loaded." : null}
    />
  );
}
