-- This Supabase project includes an administrative SECURITY DEFINER helper.
-- It is not used by the CRM and must not be callable through the Data API.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
