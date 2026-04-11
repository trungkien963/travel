import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useTravelStore } from '../src/store/useTravelStore';
import { supabase } from '../src/lib/supabase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const initSupabase = useTravelStore((state) => state.initSupabase);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <RootLayoutNav />
          </AuthGuard>
        </QueryClientProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const segs = segments as any[];
      const isPublicGroup = segs.length === 0 || segs[0] === 'auth' || segs[0] === 'index';
      if (!session && !isPublicGroup) {
        router.replace('/');
      } else if (session && isPublicGroup) {
        useTravelStore.getState().initSupabase();
        router.replace('/(tabs)/discover');
      } else if (session) {
        useTravelStore.getState().initSupabase();
      }
    });

    // Listen for auth changes (Login & Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const segs = segments as any[];
      const isPublicGroup = segs.length === 0 || segs[0] === 'auth' || segs[0] === 'index';
      if (!session && !isPublicGroup) {
        router.replace('/');
      } else if (session && isPublicGroup) {
        useTravelStore.getState().initSupabase();
        router.replace('/(tabs)/discover');
      } else if (session) {
        useTravelStore.getState().initSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
