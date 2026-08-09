import { LibraryView } from "@/components/app/LibraryView";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function LibraryPage() {
  await requireAuthenticatedUser();

  return <LibraryView />;
}
