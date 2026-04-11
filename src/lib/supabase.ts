import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system';

const supabaseStorage = {
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (e) {}
  },
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (e) {
      return null
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (e) {}
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export const uploadMediaToSupabase = async (uri: string): Promise<string> => {
  try {
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    const { data, error } = await supabase.storage
      .from('nomadsync-media')
      .upload(fileName, formData, {
        contentType: 'multipart/form-data',
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('nomadsync-media')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload image:", error);
    throw error;
  }
};
