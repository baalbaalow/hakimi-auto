import type { User } from "@supabase/supabase-js";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type SettingsViewProps = {
  user: User;
};

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
          Workspace settings
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Profile
          </h2>
          <label className="mt-5 block text-sm font-medium text-[var(--muted-strong)]">
            Email
            <Input className="mt-2" value={user.email ?? ""} readOnly />
          </label>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Account
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Authentication is managed by the existing Supabase email and password flow.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Appearance
          </h2>
          <label className="mt-5 block text-sm font-medium text-[var(--muted-strong)]">
            Theme
            <Select className="mt-2" defaultValue="dark" disabled>
              <option value="dark">Dark</option>
            </Select>
          </label>
        </Card>
      </div>
    </div>
  );
}
