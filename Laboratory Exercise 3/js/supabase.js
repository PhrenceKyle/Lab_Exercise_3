// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase project credentials
// NEVER use the service_role key in client-side code
// Only use the anon/public key for client-side applications

const SUPABASE_URL = "https://ayltoayhopkibxgoeomx.supabase.co";
const SUPABASE_KEY = "sb_publishable_UosNrwWjOU6H2FprPM5BoQ_pkyH09zq";

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient };
}
