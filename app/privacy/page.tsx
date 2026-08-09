import Card from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <main className="py-20">
      <div className="ha-container max-w-4xl">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-200">
            Privacy policy
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
            Privacy Policy for Hakimi Auto
          </h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            This Privacy Policy explains how Hakimi Auto handles account information, TikTok connection details, uploaded video content, and analytics when you use our creator automation workspace.
          </p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-[var(--muted)]">
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Data collection
              </h2>
              <p className="mt-2">
                We collect the information necessary to operate the service, including your account details, TikTok connection metadata, uploaded video files and metadata, and product usage analytics.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                How we use it
              </h2>
              <p className="mt-2">
                We use this information to connect your workspace, prepare uploads, manage publishing steps, provide support, and improve reliability and performance.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Storage and sharing
              </h2>
              <p className="mt-2">
                Your data is stored in secure environments and is not sold to third parties. We may share limited information with service providers that help us run the product.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                User rights
              </h2>
              <p className="mt-2">
                You can request access to, correction of, or deletion of your personal data, subject to legal and operational requirements.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </main>
  );
}
