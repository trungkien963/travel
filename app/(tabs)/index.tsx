import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, StatusBar } from 'react-native';
import { Heart, MessageCircle, Share2, Globe, Sparkles } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header - Neo-Minimalist */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>

        {/* Categories - Pill styling */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={{ gap: 10, paddingHorizontal: 24 }}>
          <TouchableOpacity style={styles.categoryActive}>
            <Text style={styles.categoryTextActive}>For You</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Popular</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryInactive}>
            <Text style={styles.categoryTextInactive}>Recent</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.feedContainer}>
          {/* Card 1 */}
          <Link href="/trip/1" asChild>
            <TouchableOpacity activeOpacity={0.9} style={styles.feedCard}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={require('../../assets/images/content/discover_jungle_cover_1775745341693.png')} 
                  style={styles.cardImage}
                />
                <View style={styles.statusTag}>
                  <Globe size={12} color="#059669" />
                  <Text style={styles.statusText}>Global</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Bali Escape</Text>
                <Text style={styles.cardSubtitle}>South America • Oct 12 - Oct 20</Text>
                <View style={styles.engagementRow}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Heart size={20} color="#1C1917" />
                    <Text style={styles.actionText}>2.4K</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={20} color="#1C1917" />
                    <Text style={styles.actionText}>128</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Share2 size={20} color="#1C1917" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Link>

          {/* Card 2 */}
          <Link href="/trip/2" asChild>
            <TouchableOpacity activeOpacity={0.9} style={styles.feedCard}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={require('../../assets/images/content/discover_mountain_cover_1775745360148.png')} 
                  style={styles.cardImage}
                />
                <View style={styles.statusTag}>
                  <Globe size={12} color="#059669" />
                  <Text style={styles.statusText}>Global</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Andes Trails</Text>
                <Text style={styles.cardSubtitle}>Peru • Nov 1 - Nov 5</Text>
                <View style={styles.engagementRow}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Heart size={20} color="#1C1917" />
                    <Text style={styles.actionText}>1.8K</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={20} color="#1C1917" />
                    <Text style={styles.actionText}>94</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Share2 size={20} color="#1C1917" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB', // Stone 50
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800', 
    color: '#1C1917', // Stone 900
    letterSpacing: -0.5,
  },
  categories: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  categoryActive: {
    backgroundColor: '#1C1917',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100, 
  },
  categoryTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  categoryInactive: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryTextInactive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A8A29E',
  },
  feedContainer: {
    gap: 32,
    paddingHorizontal: 24,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669', // Emerald
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#A8A29E',
    fontWeight: '500',
    marginBottom: 16,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
  }
});
