import { AccountsView } from "@/components/app/AccountsView";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getTikTokAccountSummary } from "@/lib/tiktok-login";

type AccountsPageProps = {
  searchParams?: Promise<{
    connected?: string | string[];
  }>;
};

function normalizeConnectedStatus(status: string | string[] | undefined) {
  const value = Array.isArray(status) ? status[0] : status;

  if (value === "success" || value === "error") {
    return value;
  }

  return null;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = searchParams ? await searchParams : undefined;
  const tiktokAccount = await getTikTokAccountSummary(user.id);

  return (
    <AccountsView
      connectedStatus={normalizeConnectedStatus(params?.connected)}
      tiktokAccount={tiktokAccount}
    />
  );
}
