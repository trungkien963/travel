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
        tabBarActiveTintColor: '#FFC800', // Sunshine Yellow
        tabBarInactiveTintColor: '#D4D4D4', 
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0, 
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF', // Pure white, solid
          height: 84, // Taller to accommodate home indicator
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0', // Subtle native line
          elevation: 0,
          shadowOpacity: 0,
          paddingHorizontal: 16,
          paddingBottom: 24, // Lift icons up above home indicator
          paddingTop: 12,
        },
        headerShown: false,
      }}>
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
      
      {/* INTEGRATED CENTER ACTION BUTTON */}
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
             <View style={styles.captureButton}>
               <Camera size={22} color="#FFFFFF" strokeWidth={3} />
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
  captureButton: {
    width: 44,
    height: 44,
    borderRadius: 16, // Squircle action button, very modern
    backgroundColor: '#FFC800', // Sunshine Yellow
    justifyContent: 'center',
    alignItems: 'center',
  }
});
