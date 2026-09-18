-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default; explicitly remove it.
revoke execute on function public.create_client_support_request(text,text,text) from public;
revoke execute on function public.create_client_support_request(text,text,text) from anon;
grant execute on function public.create_client_support_request(text,text,text) to authenticated;
