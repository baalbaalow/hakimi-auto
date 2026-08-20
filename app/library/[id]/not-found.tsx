import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";

export default function DraftNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <EmptyState
        icon={FileQuestion}
        title="Draft not available"
        description="This upload does not exist or is not available to your account."
      >
        <Button href="/library" variant="secondary">
          Return to library
        </Button>
      </EmptyState>
    </div>
  );
}
