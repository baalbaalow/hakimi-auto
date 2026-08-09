import Card from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <main className="py-20">
      <div className="ha-container max-w-4xl">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">
            Terms of service
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
            Terms of Service
          </h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            By accessing or using Hakimi Auto, you agree to these terms. The platform is intended for creators and teams who want to plan and publish content with more structure and less friction.
          </p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-[var(--muted)]">
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Acceptable use
              </h2>
              <p className="mt-2">
                You agree to use the service lawfully and to respect the rights of other creators, platform owners, and audiences.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Account responsibility
              </h2>
              <p className="mt-2">
                You are responsible for the accuracy of the information you provide and for maintaining the security of your account credentials.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Content ownership
              </h2>
              <p className="mt-2">
                You retain ownership of the content you upload. By using the platform, you grant us the limited rights needed to store, process, and display your content in connection with the service.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Service availability
              </h2>
              <p className="mt-2">
                The service may be updated, paused, or interrupted from time to time. We do not guarantee uninterrupted access or specific performance outcomes.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </main>
  );
}
