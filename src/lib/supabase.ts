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

// Polyfill specifically for React Native to ArrayBuffer conversion
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

const customBase64Decode = (base64: string): ArrayBuffer => {
  let bufferLength = base64.length * 0.75;
  let len = base64.length;
  let i = 0;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  const arraybuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
};

export const uploadMediaToSupabase = async (uri: string): Promise<string> => {
  try {
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // React Native's most bulletproof way for Supabase is passing raw bytes from base64
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const buffer = customBase64Decode(base64);

    const { data, error } = await supabase.storage
      .from('nomadsync-media')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
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
