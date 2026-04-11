import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { MapPin, Sparkles, Bell } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useTravelStore } from '../../src/store/useTravelStore';

export default function DiscoverScreen() {
  const router = useRouter();
  const { refreshData } = useTravelStore();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC800" />
        }
      >
        
        {/* Sleek Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Sparkles size={20} color="#FFC800" />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellButton}>
              <Bell size={24} color="#1C1917" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Minimal Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <TouchableOpacity style={styles.categoryActive}>
            <Text style={styles.categoryTextActive}>For You</Text>
            <View style={styles.activeDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Trending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Nearby</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.masonryContainer}>
          {/* Left Column */}
          <View style={styles.column}>
            <Link href="/trip/1" asChild>
              <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
                <Image source={{uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 260 }]} />
                <View style={styles.pinMeta}>
                  <Text style={styles.pinTitle} numberOfLines={1}>Summer Breeze</Text>
                  <View style={styles.pinLocationRow}>
                    <Text style={styles.pinSubtitle}>Oceania</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
              <Image source={{uri: 'https://images.unsplash.com/photo-1532853270311-c918ee97268b?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 180 }]} />
              <View style={styles.pinMeta}>
                <Text style={styles.pinTitle} numberOfLines={1}>Poolside Sips</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
              <Image source={{uri: 'https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 260 }]} />
              <View style={styles.pinMeta}>
                <Text style={styles.pinTitle} numberOfLines={1}>Sailing Day</Text>
                <View style={styles.pinLocationRow}>
                  <Text style={styles.pinSubtitle}>Adriatic Sea</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Column (Staggered) */}
          <View style={[styles.column, { paddingTop: 40 }]}>
            <Link href="/trip/2" asChild>
              <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
                <Image source={{uri: 'https://images.unsplash.com/photo-1535262412228-673dc34efaca?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 320 }]} />
                <View style={styles.pinMeta}>
                  <Text style={styles.pinTitle} numberOfLines={1}>Into the Blue</Text>
                  <View style={styles.pinLocationRow}>
                    <Text style={styles.pinSubtitle}>Maldives</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
               <Image source={{uri: 'https://images.unsplash.com/photo-1600093678033-9097723af8bb?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 220 }]} />
               <View style={styles.pinMeta}>
                 <Text style={styles.pinTitle} numberOfLines={1}>Coastal Drive</Text>
               </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={styles.pinCard}>
               <Image source={{uri: 'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?w=800&auto=format&fit=crop'}} style={[styles.pinImage, { height: 280 }]} />
               <View style={styles.pinMeta}>
                 <Text style={styles.pinTitle} numberOfLines={1}>Crystal Clear</Text>
                 <View style={styles.pinLocationRow}>
                   <Text style={styles.pinSubtitle}>Bora Bora</Text>
                 </View>
               </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background like Lemon8
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900', 
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // Red dot for unread
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },
  categories: {
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 24,
  },
  categoryActive: {
    alignItems: 'center',
  },
  categoryTextActive: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC800',
  },
  categoryInactive: {
    paddingTop: 0,
  },
  categoryTextInactive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A8A29E',
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  pinCard: {
    width: '100%',
    marginBottom: 8,
  },
  pinImage: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    resizeMode: 'cover',
  },
  pinMeta: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  pinTitle: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  pinLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinSubtitle: {
    color: '#78716C',
    fontSize: 12,
    fontWeight: '600',
  }
});
