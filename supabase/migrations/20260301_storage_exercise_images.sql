-- Bucket "exercise-images" para fotos de ejercicios (público para leer).
-- 1) Crear el bucket desde el Dashboard: Storage → New bucket → nombre "exercise-images", Public = true.
-- 2) Ejecutar este SQL para permitir que usuarios autenticados suban/borren en su carpeta.

-- Subir: solo en la carpeta que coincide con su user_id (path = user_id/...)
create policy "Users can upload exercise images in own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Leer: bucket público, permitir select para que las URLs funcionen
create policy "Public read exercise images"
on storage.objects for select to public
using (bucket_id = 'exercise-images');

-- Borrar: solo archivos en su carpeta
create policy "Users can delete own exercise images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'exercise-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
