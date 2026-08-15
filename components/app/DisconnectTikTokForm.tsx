"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Unlink } from "lucide-react";
import {
  disconnectTikTokAccount,
  type DisconnectTikTokState,
} from "@/app/accounts/actions";
import { Button } from "@/components/ui/Button";

const initialState: DisconnectTikTokState = {
  ok: null,
  message: null,
};

export function DisconnectTikTokForm() {
  const [state, formAction, pending] = useActionState(
    disconnectTikTokAccount,
    initialState,
  );

  return (
    <div className="space-y-3">
      {state.message ? (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-[var(--radius)] border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-300/10 text-rose-100"
          }`}
        >
          {state.ok ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <form
        action={formAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            "Disconnect TikTok from Hakimi Auto? This will revoke TikTok authorization and remove the connected account from this workspace.",
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Unlink size={15} aria-hidden="true" />
          )}
          {pending ? "Disconnecting..." : "Disconnect TikTok"}
        </Button>
      </form>
    </div>
  );
}
