-- 1. Create a public bucket
insert into storage.buckets (id, name, public) 
values ('nomadsync-media', 'nomadsync-media', true);

-- 2. Allow public access to view files (SELECT)
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'nomadsync-media' );

-- 3. Allow anyone (including anonymous) to upload files (INSERT)
create policy "Public Upload" 
on storage.objects for insert 
with check ( bucket_id = 'nomadsync-media' );
