import { SettingsView } from "@/components/app/SettingsView";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();

  return <SettingsView user={user} />;
}
