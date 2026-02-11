-- Replace with your real admin email(s) before running.
update public.users
set role = 'admin'
where email in ('your-admin-email@domain.com');
