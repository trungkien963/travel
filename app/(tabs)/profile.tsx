import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Settings, Shield, HelpCircle, ChevronRight, LogOut, Edit3, Compass } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.headerTitle}>Profile</Text>

          {/* User Identity Card */}
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3276&auto=format&fit=crop' }} 
              style={styles.avatarImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName} numberOfLines={1}>Jane Doe</Text>
              <Text style={styles.userEmail} numberOfLines={1}>jane@nomadsync.com</Text>
              <TouchableOpacity style={styles.editButton}>
                <Edit3 size={14} color="#FFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Travel Stats Section */}
          <Text style={styles.sectionLabel}>MILESTONES</Text>
          <View style={styles.statsContainer}>
             <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
               <Text style={[styles.statNumber, { color: '#166534' }]}>12</Text>
               <Text style={[styles.statLabel, { color: '#166534' }]}>Trips</Text>
             </View>
             <View style={[styles.statBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
               <Text style={[styles.statNumber, { color: '#92400E' }]}>5</Text>
               <Text style={[styles.statLabel, { color: '#92400E' }]}>Countries</Text>
             </View>
             <View style={[styles.statBox, { backgroundColor: '#F5F5F4', borderColor: '#E7E5E4' }]}>
               <Text style={[styles.statNumber, { color: '#1C1917' }]}>142</Text>
               <Text style={[styles.statLabel, { color: '#1C1917' }]}>Moments</Text>
             </View>
          </View>

          {/* Account Settings Section */}
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.settingsBlock}>
             <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconLayer}>
                    <Settings size={20} color="#1C1917" />
                  </View>
                  <Text style={styles.settingText}>Preferences</Text>
                </View>
                <ChevronRight size={20} color="#D4D4D4" />
             </TouchableOpacity>

             <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconLayer}>
                    <Shield size={20} color="#1C1917" />
                  </View>
                  <Text style={styles.settingText}>Privacy & Security</Text>
                </View>
                <ChevronRight size={20} color="#D4D4D4" />
             </TouchableOpacity>

             <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconLayer}>
                    <HelpCircle size={20} color="#1C1917" />
                  </View>
                  <Text style={styles.settingText}>Help Center</Text>
                </View>
                <ChevronRight size={20} color="#D4D4D4" />
             </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutBtn}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800', 
    color: '#1C1917', 
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 40,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 28,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A29E',
    marginBottom: 16,
  },
  editButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1917',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4D4D4',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 8,
  },
  
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  settingsBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIconLayer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  }
});
