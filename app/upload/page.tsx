import { UploadComposer } from "@/components/app/UploadComposer";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function UploadPage() {
  const user = await requireAuthenticatedUser();

  return <UploadComposer userId={user.id} />;
}
