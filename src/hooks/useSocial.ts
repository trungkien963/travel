import { useMemo } from 'react';
import { Post, Comment } from '../types/social';
import { useTravelStore } from '../store/useTravelStore';
import { supabase, uploadMediaToSupabase } from '../lib/supabase';
import { Alert } from 'react-native';

export function useSocial(tripId?: string) {
  const { posts: allPosts, addPost: addStorePost, updatePost: updateStorePost, deletePost: deleteStorePost } = useTravelStore();

  const posts = useMemo(() => {
    let list = allPosts;
    if (tripId) list = list.filter(p => p.tripId === tripId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPosts, tripId]);

  const toggleLike = async (postId: string) => {
    const p = allPosts.find(x => x.id === postId);
    if (!p) return;
    const { setGlobalLoading } = useTravelStore.getState();
    setGlobalLoading(true);
    try {
      const newLikes = p.hasLiked ? p.likes - 1 : p.likes + 1;
      const { error } = await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
      if (error) throw error;
      updateStorePost(postId, { hasLiked: !p.hasLiked, likes: newLikes });

    } catch (e) {
      Alert.alert('Error', 'Failed to toggle like.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const addComment = async (postId: string, text: string) => {
    const p = allPosts.find(x => x.id === postId);
    if (!p) return;
    
    const { currentUserId, currentUserProfile, trips, setGlobalLoading } = useTravelStore.getState();
    const trip = trips.find(t => t.id === p.tripId);
    const userMember = trip?.members.find(m => m.id === currentUserId);
    
    const commentAuthorName = currentUserProfile?.name || userMember?.name || 'Traveler';
    const commentAuthorAvatar = currentUserProfile?.avatar || userMember?.avatar || undefined;
    
    const newComment: Comment = {
      id: 'c' + Date.now().toString(),
      authorId: currentUserId,
      authorName: commentAuthorName,
      authorAvatar: commentAuthorAvatar,
      text: text,
      timestamp: new Date().toISOString()
    };
    const newCommentsList = [...p.comments, newComment];

    setGlobalLoading(true);
    try {
      const { error } = await supabase.from('posts').update({ comments: newCommentsList }).eq('id', postId);
      if (error) throw error;
      updateStorePost(postId, { comments: newCommentsList });

    } catch (e) {
      Alert.alert('Error', 'Failed to add comment.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const addPost = async (content: string, images: string[], authorId: string, authorName: string, targetTripId?: string, isDual?: boolean) => {
    const { setGlobalLoading, currentUserId, currentUserProfile, trips } = useTravelStore.getState();
    setGlobalLoading(true);
    try {
      // 1. Upload all local images to Supabase Storage
      const uploadedImages = [];
      for (const uri of images) {
        if (uri.startsWith('file://')) {
          const publicUrl = await uploadMediaToSupabase(uri);
          uploadedImages.push(publicUrl);
        } else {
          uploadedImages.push(uri);
        }
      }

      const trip = trips.find(t => t.id === (targetTripId || tripId));
      const userMember = trip?.members.find(m => m.id === authorId);
      const authorAvatar = currentUserProfile?.avatar || userMember?.avatar || undefined;

      const { data, error } = await supabase.from('posts').insert({
        trip_id: targetTripId || tripId,
        user_id: currentUserId,
        content: content,
        image_urls: uploadedImages,
        is_dual_camera: isDual || false,
        comments: [],
        likes: 0
      }).select().single();

      if (error) throw error;

      if (data) {
        const newPost: Post & { tripId?: string } = {
          id: data.id,
          tripId: data.trip_id,
          authorId,
          authorName,
          authorAvatar,
          content,
          images: uploadedImages,
          isDual: isDual || false,
          timestamp: data.created_at || new Date().toISOString(),
          date: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          likes: 0,
          hasLiked: false,
          comments: []
        };
        addStorePost(newPost);

      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add post.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    const { setGlobalLoading } = useTravelStore.getState();
    setGlobalLoading(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      deleteStorePost(postId);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete post.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const editPost = async (postId: string, content: string, images: string[]) => {
    const { setGlobalLoading } = useTravelStore.getState();
    setGlobalLoading(true);
    try {
      const { error } = await supabase.from('posts').update({ content: content, images: images }).eq('id', postId);
      if (error) throw error;
      updateStorePost(postId, { content, images });
    } catch (e) {
      Alert.alert('Error', 'Failed to edit post.');
    } finally {
      setGlobalLoading(false);
    }
  };

  return { posts, toggleLike, addComment, addPost, deletePost, editPost };
}
