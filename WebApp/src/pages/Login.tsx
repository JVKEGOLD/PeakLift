import { FormEvent, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { defaultAuthProviderSettings, loadAuthProviderSettings } from "../authSettings";
import type { AuthProviderSettings } from "../authSettings";
import { friendlyError } from "../utils/errors";

export default function Login() {
  const { user, login, signup, resendConfirmation, loginWithApple, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [providers, setProviders] = useState<AuthProviderSettings>(defaultAuthProviderSettings);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";

  useEffect(() => {
    void loadAuthProviderSettings()
      .then(setProviders)
      .catch(() => {
        setProviders(defaultAuthProviderSettings);
      });

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = hashParams.get("error_code");
    const description = hashParams.get("error_description");

    if (code === "otp_expired" || description?.toLowerCase().includes("expired")) {
      setMode("signup");
      setError("That confirmation email link is invalid or expired. Enter your email below and send a new Peak Lift confirmation email.");
    } else if (hashParams.get("error")) {
      setError(description || "The confirmation email link could not be used. Send a new confirmation email and try again.");
    }
  }, []);

  const hasSocialSignIn = providers.apple || providers.google;

  if (user) {
    return <Navigate to={from} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const result = await signup(email, password, username);
        if (result.needsEmailConfirmation) {
          setNotice("Check your inbox for the Peak Lift confirmation email. Open that email and tap Confirm Your Signup, then return here to sign in.");
          return;
        }
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err, "Authentication failed."));
    } finally {
      setBusy(false);
    }
  };

  const resendSignupEmail = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await resendConfirmation(email);
      setNotice("A fresh Peak Lift confirmation email was sent. Open that email and tap Confirm Your Signup.");
    } catch (err) {
      setError(friendlyError(err, "Unable to send a new confirmation email."));
    } finally {
      setBusy(false);
    }
  };

  const providerAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err, "Authentication failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <div className="login-mark">
          <Activity size={30} />
        </div>
        <h1>Peak Lift</h1>
        <p>Track workouts, save routines, share sessions, and keep nutrition in one focused training cockpit.</p>
        <form onSubmit={submit} className="form-stack">
          {mode === "signup" ? <Input aria-label="Username" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} required /> : null}
          <Input aria-label="Email" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <Input aria-label="Password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          {notice ? <p className="form-success">{notice}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Working..." : mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
          {mode === "signup" ? (
            <Button type="button" variant="secondary" onClick={resendSignupEmail} disabled={busy || !email}>
              Send Confirmation Email
            </Button>
          ) : null}
        </form>
        {hasSocialSignIn ? (
          <div className="button-row">
            {providers.apple ? (
              <Button variant="secondary" onClick={() => providerAction(loginWithApple)} disabled={busy}>
                Apple
              </Button>
            ) : null}
            {providers.google ? (
              <Button variant="secondary" onClick={() => providerAction(loginWithGoogle)} disabled={busy}>
                Google
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="form-note">Email sign-in is enabled. Apple and Google sign-in are not enabled in Supabase yet.</p>
        )}
        <button className="text-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
