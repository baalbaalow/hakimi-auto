import { DashboardOverview } from "@/components/app/DashboardOverview";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();

  return <DashboardOverview email={user.email} />;
}
