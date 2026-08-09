import { AccountsView } from "@/components/app/AccountsView";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function AccountsPage() {
  await requireAuthenticatedUser();

  return <AccountsView />;
}
