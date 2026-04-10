import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Heart, MessageCircle, Share2, Pencil, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const canModifyPost = isOwner || post.authorId === currentUserId;
  const hasMultipleImages = post.images && post.images.length > 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.imageBlock}>
        {post.images && post.images.length > 0 ? (
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
        ) : (
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.image} />
        )}

        {/* Top Overlay: Author & Actions */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.authorBadge}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{post.authorName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
          </View>
          
          {canModifyPost && (
            <View style={styles.actionPill}>
              <TouchableOpacity onPress={() => onEdit(post)} style={styles.iconBtn}>
                <Pencil size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(post.id)} style={styles.iconBtn}>
                <Trash2 size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Bottom Overlay: Content text and interactions */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} style={styles.bottomOverlay} pointerEvents="box-none">
            {post.content ? (
              <Text style={styles.contentTxt}>{post.content}</Text>
            ) : null}

            <View style={styles.interactionsRow}>
              <TouchableOpacity onPress={() => onLike(post.id)} style={styles.interactBtnWrapper}>
                <View style={[styles.interactCircle, post.hasLiked && {backgroundColor: '#EF4444'}]}>
                    <Heart size={26} color="#FFF" fill={post.hasLiked ? '#FFF' : 'transparent'} />
                </View>
                {post.likes > 0 && <Text style={styles.interactCount}>{post.likes}</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => onComment(post)} style={styles.interactBtnWrapper}>
                <View style={styles.interactCircle}>
                    <MessageCircle size={26} color="#FFF" />
                </View>
                {post.comments.length > 0 && <Text style={styles.interactCount}>{post.comments.length}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.interactCircle, {marginLeft: 'auto'}]}>
                  <Share2 size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
        </LinearGradient>
      </View>

      {/* Pagination Dots (Locket Style) */}
      {hasMultipleImages && (
        <View style={styles.paginationRow}>
          {post.images.map((_, idx) => (
            <View key={idx} style={[styles.dot, activeIndex === idx ? styles.activeDot : styles.inactiveDot]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    marginBottom: 24,
    alignItems: 'center',
  },
  imageBlock: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#1C1917',
    position: 'relative'
  },
  image: {
    width: width - 32, // Accommodate for padding of contentArea (16 on each side)
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    zIndex: 10
  },
  authorBadge: {
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingRight: 16, paddingLeft: 6, paddingVertical: 6, 
    borderRadius: 100, gap: 10
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontWeight: '900', color: '#1C1917', fontSize: 15 },
  authorName: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  timestamp: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  actionPill: {
    flexDirection: 'row', gap: 8, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 100, padding: 6
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center'
  },
  bottomOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 24, paddingTop: 80,
    zIndex: 10
  },
  contentTxt: {
    fontSize: 18, color: '#FFF', fontWeight: '700', 
    lineHeight: 28, marginBottom: 24
  },
  interactionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 20
  },
  interactBtnWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10
  },
  interactCircle: {
    width: 54, height: 54, borderRadius: 27, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center'
  },
  interactCount: {
    fontSize: 18, fontWeight: '900', color: '#FFF'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    height: 6, borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#059669',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#E5E5E5',
    width: 6,
  }
});
