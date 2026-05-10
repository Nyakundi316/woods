-- Storage buckets for user media
-- Note: bucket rows live in storage schema; RLS policies use auth.uid()

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('style-dna', 'style-dna', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('closet',    'closet',    false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('auth-scans','auth-scans',false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- style-dna: users can only read/write their own folder (style-dna/<user_id>/*)
create policy "style_dna_user_select"
  on storage.objects for select
  using (bucket_id = 'style-dna' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "style_dna_user_insert"
  on storage.objects for insert
  with check (bucket_id = 'style-dna' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "style_dna_user_delete"
  on storage.objects for delete
  using (bucket_id = 'style-dna' and auth.uid()::text = (storage.foldername(name))[1]);

-- closet: same pattern
create policy "closet_user_select"
  on storage.objects for select
  using (bucket_id = 'closet' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "closet_user_insert"
  on storage.objects for insert
  with check (bucket_id = 'closet' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "closet_user_delete"
  on storage.objects for delete
  using (bucket_id = 'closet' and auth.uid()::text = (storage.foldername(name))[1]);

-- auth-scans: same pattern
create policy "auth_scans_user_select"
  on storage.objects for select
  using (bucket_id = 'auth-scans' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "auth_scans_user_insert"
  on storage.objects for insert
  with check (bucket_id = 'auth-scans' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "auth_scans_user_delete"
  on storage.objects for delete
  using (bucket_id = 'auth-scans' and auth.uid()::text = (storage.foldername(name))[1]);
