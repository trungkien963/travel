import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Alert, Share, ActionSheetIOS, Platform } from 'react-native';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react-native';
import { Post } from '../types/social';

const { width } = Dimensions.get('window');

interface PostItemProps {
  post: Post;
  isOwner: boolean;
  currentUserId: string;
  onLike: (postId: string) => void;
  onComment: (post: Post) => void;
  onDelete: (postId: string) => void;
  onEdit: (post: Post) => void;
}

export function PostItem({ post, isOwner, currentUserId, onLike, onComment, onDelete, onEdit }: PostItemProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = post.images && post.images.length > 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleMorePress = () => {
    const isAuthor = post.authorId === currentUserId;
    
    const optionsText = ['Cancel'];
    const actions = [() => {}]; // Cancel does nothing
    let destructiveIndex = -1;

    if (isAuthor) {
      optionsText.push('Edit Post');
      actions.push(() => onEdit(post));
      
      optionsText.push('Delete Post');
      actions.push(() => onDelete(post.id));
      destructiveIndex = optionsText.length - 1;
    } else {
      optionsText.push('Hide Post');
      actions.push(() => Alert.alert('Hidden', 'This post has been hidden from your feed.'));
      
      optionsText.push('Report');
      actions.push(() => Alert.alert('Reported', 'Thank you. This post has been reported for review.'));
      destructiveIndex = optionsText.length - 1; // Make Report red
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: optionsText,
          cancelButtonIndex: 0,
          destructiveButtonIndex: destructiveIndex !== -1 ? destructiveIndex : undefined,
        },
        (buttonIndex) => {
          actions[buttonIndex]();
        }
      );
    } else {
      // Fallback for Android
      const alertOptions = optionsText.map((text, idx) => ({
        text,
        style: text === 'Cancel' ? 'cancel' as const : (idx === destructiveIndex ? 'destructive' as const : 'default' as const),
        onPress: actions[idx]
      }));
      Alert.alert('Post Options', '', alertOptions);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing moment from ${post.authorName} on NomadSync! 🌊: "${post.content}"`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.postContainer}>
      
      {/* Sleek Header (Above Image) */}
      <View style={styles.headerRow}>
        <View style={styles.authorInfo}>
          <View style={styles.avatarCircle}>
             <Text style={styles.avatarText}>{post.authorName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleMorePress} style={styles.moreBtn}>
          <MoreHorizontal size={20} color="#A8A29E" />
        </TouchableOpacity>
      </View>

      {/* Image Block */}
      {post.images && post.images.length > 0 && (
        <View style={styles.imageBlock}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {post.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>
          
          {/* Pagination Dots Floating on bottom of image */}
          {hasMultipleImages && (
            <View style={styles.paginationRow}>
              {post.images.map((_, idx) => (
                <View key={idx} style={[styles.dot, activeIndex === idx ? styles.activeDot : styles.inactiveDot]} />
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Interactions (Below Image) */}
      <View style={styles.interactionsRow}>
        <TouchableOpacity onPress={() => onLike(post.id)} style={styles.iconHitbox}>
            <Heart size={24} color={post.hasLiked ? '#EF4444' : '#1C1917'} fill={post.hasLiked ? '#EF4444' : 'transparent'} />
            {post.likes > 0 && <Text style={[styles.countText, post.hasLiked && {color: '#EF4444'}]}>{post.likes}</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onComment(post)} style={styles.iconHitbox}>
            <MessageCircle size={24} color="#1C1917" />
            {post.comments.length > 0 && <Text style={styles.countText}>{post.comments.length}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={[styles.iconHitbox, {marginLeft: 'auto', paddingRight: 0}]}>
            <Share2 size={22} color="#1C1917" />
        </TouchableOpacity>
      </View>

      {/* Caption Content */}
      {post.content ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionAuthor}>{post.authorName} <Text style={styles.captionText}>{post.content}</Text></Text>
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    width: '100%',
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#FFC800', 
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontWeight: '900', color: '#1C1917', fontSize: 16 },
  authorName: { fontSize: 14, fontWeight: '800', color: '#1C1917' },
  timestamp: { fontSize: 11, fontWeight: '600', color: '#A8A29E' },
  moreBtn: {
    padding: 4,
  },

  imageBlock: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative'
  },
  image: {
    width: width - 48, // Padding of container is 24 on each side
    height: '100%',
  },

  paginationRow: {
    position: 'absolute',
    bottom: 16,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4 },
  activeDot: { backgroundColor: '#FFC800', width: 24 },
  inactiveDot: { backgroundColor: 'rgba(255,255,255,0.7)', width: 6 },

  interactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  iconHitbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },

  captionContainer: {
    marginTop: 4,
  },
  captionAuthor: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    lineHeight: 20,
  },
  captionText: {
    fontWeight: '400',
  }
});
