import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';

export async function uploadImage(uri: string, folder: string): Promise<string | null> {
  try {
    // Compress + resize: max width 1200px, JPEG quality 70%
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const response = await fetch(manipulated.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const { error } = await supabase.storage
      .from('hse-media')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
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
