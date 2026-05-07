import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qwqwctttggwesgqspgrp.supabase.co";
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_OXWeJ_vTwPcbHpFBVbql4g_eoYoBkHT";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
