import { DashboardOverview } from "@/components/app/DashboardOverview";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTikTokAccountSummary } from "@/lib/tiktok-login";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const tiktokAccount = await getTikTokAccountSummary(user.id);

  return <DashboardOverview email={user.email} tiktokAccount={tiktokAccount} />;
}
