import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Mail, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { FontAwesome } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)/discover');
    }
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (!session) {
      Alert.alert('Check your inbox', 'Please check your inbox for email verification!');
    } else {
      router.replace('/(tabs)/discover');
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    try {
      const redirectUri = Linking.createURL('/auth');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No URL returned from Supabase OAuth.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        // Trích xuất parameters từ URL thay vì dùng hàm không tồn tại
        const getParam = (url: string, param: string) => {
          const regex = new RegExp(`[?&#]${param}=([^&#]*)`);
          const results = regex.exec(url);
          return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        const code = getParam(result.url, 'code');
        const error_desc = getParam(result.url, 'error_description');
        
        if (error_desc) throw new Error(error_desc);

        if (code) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;
          router.replace('/(tabs)/discover');
        } else {
          const access_token = getParam(result.url, 'access_token');
          const refresh_token = getParam(result.url, 'refresh_token');
          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
            if (sessionError) throw sessionError;
            router.replace('/(tabs)/discover');
          } else {
           // Fallback nếu không có param nào, có thể AppState của Supabase sẽ tự lo
           router.replace('/(tabs)/discover');
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Google Auth Failed", e.message || "An unknown error occurred.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1, padding: 32, justifyContent: 'center' }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 64, height: 64, backgroundColor: '#FFC800', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 32 }}>🏖️</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#1C1917', marginBottom: 8 }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={{ fontSize: 15, color: '#78716C', textAlign: 'center' }}>
            {isLogin ? 'Sign in to access your travel diaries.' : 'Join WanderPool to plan your next adventure.'}
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          {/* Email Input */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' }}>
            <Mail size={20} color="#A8A29E" style={{ marginRight: 12 }} />
            <TextInput
              style={{ flex: 1, fontSize: 16, color: '#1C1917' }}
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor="#D4D4D4"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' }}>
            <Lock size={20} color="#A8A29E" style={{ marginRight: 12 }} />
            <TextInput
              style={{ flex: 1, fontSize: 16, color: '#1C1917' }}
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="Password"
              placeholderTextColor="#D4D4D4"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={{ 
            backgroundColor: '#FFC800', 
            borderRadius: 16, 
            padding: 18, 
            alignItems: 'center', 
            flexDirection: 'row', 
            justifyContent: 'center',
            marginTop: 24,
            shadowColor: '#FFC800',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}
          disabled={loading}
          onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
        >
          {loading ? (
            <ActivityIndicator color="#1C1917" />
          ) : (
            <>
              <Text style={{ color: '#1C1917', fontSize: 16, fontWeight: '700', marginRight: 8 }}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
              {isLogin ? <LogIn size={20} color="#1C1917" /> : <UserPlus size={20} color="#1C1917" />}
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ padding: 16, alignItems: 'center', marginTop: 12 }}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={{ color: '#78716C', fontSize: 14 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={{ color: '#1C1917', fontWeight: 'bold' }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
          <Text style={{ marginHorizontal: 16, color: '#A8A29E', fontSize: 13, fontWeight: '600' }}>OR CONTINUE WITH</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
        </View>

        {/* Google Auth Button */}
        <TouchableOpacity 
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E5E5',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 5
          }}
          onPress={signInWithGoogle}
        >
          <FontAwesome name="google" size={20} color="#1C1917" style={{ marginRight: 12 }} />
          <Text style={{ color: '#1C1917', fontSize: 16, fontWeight: '600' }}>Google</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
