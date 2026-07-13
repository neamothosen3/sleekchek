/* ==========================================================================
   SLEEKCHEK — Admin auth
   Uses Supabase Auth (email/password). The Supabase session is stored
   automatically by the client library (in localStorage) and is sent with
   every request the client makes, so protected table/storage operations
   just work as long as the RLS policies allow the "authenticated" role.
   ========================================================================== */

// Redirects to login if there's no active Supabase session.
// Call at the top of protected pages. Returns once the check is done.
async function requireAdminAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "/admin/login.html";
  }
}

/* ---- Login form (login.html) ---- */
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // Admin accounts are created in Supabase Auth using an email address.
  // If you log in with a plain username (no "@"), it's assumed to be the
  // local part of the admin email — see README for how this is set up.
  const email = username.includes("@") ? username : `${username}@sleekchek.admin`;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message || "Login failed. Please try again.";
    return;
  }
  window.location.href = "/admin/dashboard.html";
});
