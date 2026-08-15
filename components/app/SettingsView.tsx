import type { User } from "@supabase/supabase-js";
import { Bell, Palette, ShieldCheck, UserRoundCog } from "lucide-react";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { Badge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type SettingsViewProps = {
  user: User;
};

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Review profile, authentication, and interface preferences for your workspace."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-emerald-200">
                <UserRoundCog size={19} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Profile
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Account identity is provided by the existing Supabase auth flow.
                </p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoField label="Email" value={user.email ?? "Unknown"} />
            <InfoField label="User ID" value={user.id} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Account
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Supabase managed
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Authentication is managed by the existing Supabase email and password
            flow.
          </p>
          <div className="mt-5 space-y-3">
            {["Email/password sign-in", "Protected app routes", "Secure sign-out"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-[var(--muted-strong)]">
                    {item}
                  </span>
                  <span className="text-xs font-medium text-emerald-200">
                    Enabled
                  </span>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-amber-200">
              <Palette size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Appearance
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Workspace display preferences
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            The workspace currently uses the default dark interface. Theme
            editing will be added only when it can be saved for your account.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-white/[0.1] bg-white/[0.045] text-emerald-200">
              <Bell size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Publishing alerts
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Notification preferences are not enabled yet, so there are no
            controls to configure.
          </p>
        </Card>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-white/[0.07] bg-white/[0.025] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
