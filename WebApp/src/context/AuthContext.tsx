import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type { Profile } from "../types";
import { friendlyError } from "../utils/errors";
import { toProfile } from "../utils/supabaseRows";

export type AppUser = {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  isAnonymous?: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<{ needsEmailConfirmation: boolean }>;
  resendConfirmation: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getAuthRedirectURL = () =>
  import.meta.env.VITE_AUTH_REDIRECT_URL ||
  (window.location.protocol === "app:" ? "peaklift://auth-callback" : window.location.origin);

const userName = (user: User, username?: string) =>
  username ||
  user.user_metadata?.username ||
  user.user_metadata?.display_name ||
  user.user_metadata?.full_name ||
  user.user_metadata?.name ||
  user.email?.split("@")[0] ||
  "Peak Lifter";

const userPhoto = (user: User) =>
  user.user_metadata?.photo_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

const toAppUser = (user: User): AppUser => ({
  id: user.id,
  uid: user.id,
  email: user.email,
  displayName: userName(user),
  photoURL: userPhoto(user),
  isAnonymous: user.is_anonymous,
});

async function ensureProfile(user: User, username?: string) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return toProfile(existing);

  const displayName = userName(user, username);
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username: displayName,
      display_name: displayName,
      photo_url: userPhoto(user),
    })
    .select("*")
    .single();

  if (error) throw error;
  return toProfile(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const currentUser = sessionData.session?.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    setProfile(await ensureProfile(currentUser));
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const currentUser = data.session?.user ?? null;
        if (!mounted) return;
        setUser(currentUser ? toAppUser(currentUser) : null);
        setProfile(currentUser ? await ensureProfile(currentUser) : null);
      } catch (error) {
        console.warn(friendlyError(error, "Unable to load your profile."));
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser ? toAppUser(currentUser) : null);
      void (async () => {
        try {
          setProfile(currentUser ? await ensureProfile(currentUser) : null);
        } catch (error) {
          console.warn(friendlyError(error, "Unable to load your profile."));
          setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      async login(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signup(email, password, username) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username },
            emailRedirectTo: getAuthRedirectURL(),
          },
        });
        if (error) throw error;
        if (data.session?.user) {
          await ensureProfile(data.session.user, username);
          return { needsEmailConfirmation: false };
        }
        return { needsEmailConfirmation: true };
      },
      async resendConfirmation(email) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: getAuthRedirectURL() },
        });
        if (error) throw error;
      },
      async loginWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: getAuthRedirectURL() },
        });
        if (error) throw error;
      },
      async loginWithApple() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo: getAuthRedirectURL() },
        });
        if (error) throw error;
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      async deleteAccount() {
        const { error } = await supabase.rpc("delete_current_user");
        if (error) throw error;
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      },
      refreshProfile,
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
