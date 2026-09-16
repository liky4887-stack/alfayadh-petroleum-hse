import { supabase } from './supabase';

export async function uploadImage(uri: string, folder: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage
      .from('hse-media')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: false,
      });
    if (error) {
      console.error('Upload failed:', error);
      return null;
    }
    const { data } = supabase.storage.from('hse-media').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}
