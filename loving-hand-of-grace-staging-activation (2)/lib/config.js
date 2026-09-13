export const centre = {
  phone: process.env.NEXT_PUBLIC_CENTRE_PHONE || '+254 721 987 024',
  email: process.env.NEXT_PUBLIC_CENTRE_EMAIL || 'info@thelovinghandofgrace.org',
  address: process.env.NEXT_PUBLIC_CENTRE_ADDRESS || "Joska, opposite Hon. Makau's farm, Kenya",
  hours: process.env.NEXT_PUBLIC_CENTRE_HOURS || 'Mon-Sat, 8:00 AM-5:00 PM',
};

export const isDatabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
