import { supabasePublishableKey, supabaseUrl } from "./supabase";

export type AuthProviderSettings = {
  email: boolean;
  apple: boolean;
  google: boolean;
};

type SupabaseAuthSettingsResponse = {
  external?: Partial<Record<keyof AuthProviderSettings, boolean>>;
};

export const defaultAuthProviderSettings: AuthProviderSettings = {
  email: true,
  apple: false,
  google: false,
};

export async function loadAuthProviderSettings(): Promise<AuthProviderSettings> {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load sign-in settings.");
  }

  const settings = (await response.json()) as SupabaseAuthSettingsResponse;
  return {
    email: settings.external?.email ?? defaultAuthProviderSettings.email,
    apple: settings.external?.apple ?? defaultAuthProviderSettings.apple,
    google: settings.external?.google ?? defaultAuthProviderSettings.google,
  };
}
