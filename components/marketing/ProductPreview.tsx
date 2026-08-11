import { CheckCircle2, Clock3, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ProductPreview() {
  return (
    <section aria-label="Hakimi Auto product preview" className="ha-container pb-20">
      <div className="preview-float overflow-hidden rounded-[var(--radius)] border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] shadow-[0_30px_120px_-70px_rgba(16,185,129,0.7)]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.045] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <span className="ml-3 truncate text-xs text-[var(--muted)]">
            app.hakimiauto.com/dashboard
          </span>
        </div>

        <div className="grid min-h-[32rem] bg-[var(--app-background)] lg:grid-cols-[16rem_1fr]">
          <aside className="hidden border-r border-white/[0.08] bg-black/10 p-5 lg:block">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Hakimi Auto
            </p>
            <nav className="mt-6 space-y-1 text-sm">
              {["Dashboard", "Upload", "Library", "Accounts"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-[var(--radius)] px-3 py-2 ${
                      index === 0
                        ? "bg-emerald-300/10 text-emerald-100"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {item}
                  </div>
                ),
              )}
            </nav>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
                  Creator workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                  Workspace overview
                </h2>
              </div>
              <Button href="/login" size="sm">
                Get Started
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Drafts", "0"],
                ["Publishing", "Idle"],
                ["Accounts", "Pending"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.05] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      TikTok account
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Connect your creator account when the TikTok integration is enabled.
                    </p>
                  </div>
                  <Badge variant="warning">Not connected</Badge>
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.035] px-3 text-sm text-[var(--muted)] opacity-70"
                >
                  Connect TikTok
                </button>
              </section>

              <section className="rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.05] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Current activity
                  </p>
                  <Clock3
                    size={16}
                    className="text-[var(--muted)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-5 rounded-[var(--radius)] border border-dashed border-white/[0.16] bg-black/10 p-5 text-center">
                  <Video
                    className="mx-auto text-emerald-200"
                    size={24}
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                    No uploads yet
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    Your real drafts and publishing jobs will appear here.
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.04]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/[0.08] px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>Video</span>
                <span>Status</span>
                <span className="hidden sm:block">Created</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-5 text-sm text-[var(--muted)]">
                <CheckCircle2
                  size={16}
                  className="text-emerald-200"
                  aria-hidden="true"
                />
                <span>Upload a video to create your first draft.</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
