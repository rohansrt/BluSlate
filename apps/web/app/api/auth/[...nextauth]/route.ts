import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/auth";
import { checkSignInCode } from "@/lib/sign-in-code-check";

export const { POST } = handlers;

/**
 * Sign-in codes are verified through Auth.js's email callback. Every code that
 * reaches it is checked here first, so wrong guesses count against the email's
 * limit even when someone calls this URL directly (docs/decisions/0009).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  if (url.pathname.endsWith("/callback/resend")) {
    const result = await checkSignInCode(
      url.searchParams.get("email"),
      url.searchParams.get("token"),
    );
    if (result !== "ok") {
      const error = result === "locked" ? "TooManyCodes" : "Verification";
      return NextResponse.redirect(new URL(`/signin?error=${error}`, url.origin));
    }
  }
  return handlers.GET(request);
}
