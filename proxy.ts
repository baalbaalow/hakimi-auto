import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/library/:path*",
    "/accounts/:path*",
    "/settings/:path*",
    "/login",
    "/auth/:path*",
  ],
};
