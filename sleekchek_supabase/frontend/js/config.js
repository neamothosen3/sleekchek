/* ==========================================================================
   SLEEKCHEK — Global Config
   Edit these values when you deploy.
   ========================================================================== */

// Supabase project credentials — find these in your Supabase project at
// Project Settings > API. The anon/public key is safe to expose in
// frontend code (it only has the permissions granted by your RLS policies).
const SUPABASE_URL = "https://ivjcfltiyegnzfoeqhwr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8wb5TXd77bn3bID6EodxkQ_NKxy-m4t";

// Storage bucket where admin-uploaded product images are kept.
const SUPABASE_PRODUCT_BUCKET = "product-images";

// Official WhatsApp checkout + bKash/Nagad personal number (digits only, with country code, no + or spaces)
const WHATSAPP_NUMBER = "8801627053081";

// Single shared Supabase client used across all pages.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
