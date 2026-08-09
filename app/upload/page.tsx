import { UploadComposer } from "@/components/app/UploadComposer";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function UploadPage() {
  await requireAuthenticatedUser();

  return <UploadComposer />;
}
