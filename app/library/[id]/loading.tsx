import Card from "@/components/ui/Card";

export default function DraftDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading draft details">
      <div className="h-28 animate-pulse rounded-[var(--radius)] border border-white/[0.08] bg-white/[0.025]" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="aspect-video animate-pulse bg-white/[0.025]">
          <span className="sr-only">Loading video preview</span>
        </Card>
        <Card className="min-h-96 animate-pulse bg-white/[0.025]">
          <span className="sr-only">Loading readiness checks</span>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="min-h-80 animate-pulse bg-white/[0.025]">
          <span className="sr-only">Loading metadata</span>
        </Card>
        <Card className="min-h-80 animate-pulse bg-white/[0.025]">
          <span className="sr-only">Loading record details</span>
        </Card>
      </div>
    </div>
  );
}
