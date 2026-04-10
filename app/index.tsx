import { useRouter } from 'expo-router';
import { ChevronRight, Mail, X } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Placeholder URLs to represent the 5 specific images from the user's prompt. 
// They match the theme and feel.
const ONBOARDING_DATA = [
  {
    id: '1',
    image: require('../assets/images/landing/1.jpg'),
    title: 'Find Your Perfect Escape',
    description: 'Discover beautiful destinations and breathtaking views recommended just for you.',
  },
  {
    id: '2',
    image: require('../assets/images/landing/2.jpg'),
    title: 'Relax and Unwind',
    description: 'Leave the stress behind and dive into a world of ultimate relaxation and luxury.',
  },
  {
    id: '3',
    image: require('../assets/images/landing/3.jpg'),
    title: 'Enjoy Every Moment',
    description: 'Create unforgettable memories filled with fun, sunshine, and endless joy.',
  },
  {
    id: '4',
    image: require('../assets/images/landing/4.jpg'),
    title: 'Sunny Days Ahead',
    description: 'Bask in the tropical sun and enjoy your much-deserved holiday by the pool.',
  },
  {
    id: '5',
    image: require('../assets/images/landing/5.jpg'),
    title: '',
    description: '',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentIndex === ONBOARDING_DATA.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleLogin = (provider: string) => {
    router.replace('/auth');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item }: { item: typeof ONBOARDING_DATA[0] }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        
        {/* Sleek Gradient Overlay for text visibility - Fade out on last slide since there's no text */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
            locations={[0.4, 0.8, 1]}
            style={styles.gradientOverlay}
          />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        bounces={false}
      />

      {/* Skip/Close Button to go back easily */}
      <Animated.View style={[styles.closeButtonContainer, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]} pointerEvents={currentIndex < ONBOARDING_DATA.length - 1 ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/auth')} activeOpacity={0.8}>
          <X color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomContainer} pointerEvents={currentIndex < ONBOARDING_DATA.length - 1 ? 'auto' : 'none'}>
        <Animated.View style={{ opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
          <View style={styles.navRow}>
            {/* Dots Pagination */}
            <View style={styles.pagination}>
              {ONBOARDING_DATA.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Circular Floating Next Button */}
            <TouchableOpacity style={styles.nextFab} onPress={handleNext} activeOpacity={0.85}>
              <ChevronRight color="#1C1917" size={32} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.centerAuthContainer, { opacity: fadeAnim }]} pointerEvents={currentIndex === ONBOARDING_DATA.length - 1 ? 'auto' : 'none'}>
        <View style={styles.authGlassCard}>
          <Text style={styles.authPrompt}>Your Journey Awaits ✈️</Text>
          <Text style={styles.authSubPrompt}>The world is vast and beautiful. Choose how you want to dive in.</Text>
          
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: '#FFC800', borderWidth: 0 }]}
            onPress={() => handleLogin('Email')}
            activeOpacity={0.9}
          >
            <Text style={[styles.authButtonTextDark, { color: '#1C1917' }]}>Get Started</Text>
          </TouchableOpacity>

          {/* Micro-copy for professionalism */}
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  slide: {
    width,
    height,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)', // Very light dim
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  textContainer: {
    position: 'absolute',
    bottom: 140, // Pulled up to leave space for nav
    paddingHorizontal: 32,
    width: '100%',
  },
  title: {
    fontSize: 44,
    fontFamily: 'SpaceMono', // Injecting the app's custom font if loaded, otherwise standard
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -1.5, // Tighter letter spacing for impactful look
    lineHeight: 48,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 26,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: 50,
    paddingHorizontal: 32,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 80, 
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 32,
    backgroundColor: '#FFC800', 
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFC800', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  centerAuthContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  authGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 36,
    paddingHorizontal: 28,
    paddingVertical: 36,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  authPrompt: {
    fontSize: 28,
    fontFamily: 'SpaceMono',
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  authSubPrompt: {
    fontSize: 15,
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 100, // Super pill
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  authButtonGoogle: {
    backgroundColor: '#FFFFFF',
  },
  authButtonFacebook: {
    backgroundColor: '#EBF4FF', // Soft modern blue
    marginBottom: 24, // Space before terms
  },
  termsText: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  authButtonTextDark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  authButtonTextLight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
