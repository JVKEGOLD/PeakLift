export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    if (/provider.*not.*enabled|unsupported provider|sign-in method.*not.*enabled/i.test(error.message)) {
      return "This sign-in method is not enabled in Supabase yet.";
    }
    if (/email not confirmed/i.test(error.message)) {
      return "Check your inbox for the Peak Lift confirmation email, confirm the account, then sign in.";
    }
    if (/invalid login credentials/i.test(error.message)) {
      return "The email or password is incorrect, or the account has not been confirmed yet.";
    }
    return error.message;
  }
  if (typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code);
    if (code === "email_not_confirmed") {
      return "Check your inbox for the Peak Lift confirmation email, confirm the account, then sign in.";
    }
    if (code === "invalid_credentials") {
      return "The email or password is incorrect, or the account has not been confirmed yet.";
    }
    if (code === "auth/admin-restricted-operation") {
      return "This sign-in method is not enabled yet.";
    }
    if (code === "validation_failed" || code === "provider_disabled" || code === "bad_oauth_state") {
      return "This sign-in method is not enabled in Supabase yet.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in was canceled.";
    }
    if (code === "permission-denied") {
      return "You do not have permission to complete that action.";
    }
    return fallback;
  }
  return fallback;
}
