import { UploadComposer } from "@/components/app/UploadComposer";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTikTokAccountSummary } from "@/lib/tiktok-login";

export default async function UploadPage() {
  const user = await requireAuthenticatedUser();
  const tiktokAccount = await getTikTokAccountSummary(user.id);

  return <UploadComposer userId={user.id} tiktokAccount={tiktokAccount} />;
}
