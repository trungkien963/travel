import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Map, Camera, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669', // Emerald Green instead of black
        tabBarInactiveTintColor: '#A8A29E',
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 32, 
          left: 32,
          right: 32,
          backgroundColor: '#FFFFFF',
          borderRadius: 100, 
          height: 72,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#1C1917',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          paddingHorizontal: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          tabBarIcon: ({ color }) => <Map size={26} color={color} />,
        }}
      />
      
      {/* MASSIVE CENTER CAPTURE BUTTON */}
      <Tabs.Screen
        name="capture"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-moment');
          },
        }}
        options={{
          tabBarIcon: () => (
            <View style={styles.captureButtonContainer}>
               <View style={styles.captureButton}>
                 <Camera size={28} color="#FFFFFF" strokeWidth={2.5} />
               </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User size={26} color={color} />,
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="discover_alt"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  captureButtonContainer: {
    top: -24, // Break out of the tab bar
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#059669', // Emerald green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FBFBFB',
  }
});
