import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { AppNotification } from '../src/types/notification';
import { useTravelStore } from '../src/store/useTravelStore';
import { ChevronLeft, MapPin, DollarSign, MessageCircle, Heart, Plane, Bell } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications } = useTravelStore();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TRIP_INVITE':
        return <Plane size={20} color="#3B82F6" />;
      case 'EXPENSE_ADDED':
        return <DollarSign size={20} color="#10B981" />; // Green for money
      case 'POST_COMMENT':
        return <MessageCircle size={20} color="#F59E0B" />; // Orange for messages
      case 'POST_LIKE':
        return <Heart size={20} color="#EF4444" />; // Red for likes
      case 'POST_NEW':
        return <MapPin size={20} color="#8B5CF6" />; // Purple for places
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'TRIP_INVITE': return '#EFF6FF';
      case 'EXPENSE_ADDED': return '#ECFDF5';
      case 'POST_COMMENT': return '#FFFBEB';
      case 'POST_LIKE': return '#FEF2F2';
      case 'POST_NEW': return '#F5F3FF';
      default: return '#F3F4F6';
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return d.toLocaleDateString('en-US', options);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.actorAvatar }} style={styles.avatar} />
        
        <View style={styles.content}>
          <Text style={styles.messageText}>
            <Text style={styles.actorName}>{item.actorName} </Text>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          
          {item.type === 'TRIP_INVITE' && !item.isRead && (
             <View style={styles.actionRow}>
                <TouchableOpacity style={styles.primaryActionBtn}>
                  <Text style={styles.primaryActionText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryActionBtn}>
                  <Text style={styles.secondaryActionText}>Decline</Text>
                </TouchableOpacity>
             </View>
          )}

          {item.type === 'EXPENSE_ADDED' && !item.isRead && (
             <View style={styles.actionRow}>
                <TouchableOpacity style={styles.payBtn}>
                  <DollarSign size={14} color="#FFF" />
                  <Text style={styles.primaryActionText}>Settle Up</Text>
                </TouchableOpacity>
             </View>
          )}
        </View>

        <View style={[styles.iconContainer, { backgroundColor: getIconBackground(item.type) }]}>
          {getNotificationIcon(item.type)}
        </View>
        
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={48} color="#D6D3D1" />
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptySubtitle}>When your friends interact with you, it will show up here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60, // Adjust for notch
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  headerRightSpacer: {
    width: 44,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  unreadCard: {
    backgroundColor: '#FFFAEB', // Very soft yellow tint for unread
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  actorName: {
    fontWeight: '700',
    color: '#1C1917',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#44403C',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A29E',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 24,
    left: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  primaryActionBtn: {
    backgroundColor: '#FFC800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryActionBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryActionText: {
    color: '#1C1917',
    fontWeight: '600',
    fontSize: 13,
  },
  payBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  }
});
