import { useMemo } from 'react';
import { Post, Comment } from '../types/social';
import { useTravelStore } from '../store/useTravelStore';
import { supabase, uploadMediaToSupabase } from '../lib/supabase';

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
    const newLikes = p.hasLiked ? p.likes - 1 : p.likes + 1;
    updateStorePost(postId, { hasLiked: !p.hasLiked, likes: newLikes });
    
    if (!postId.startsWith('p')) {
      await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    }
  };

  const addComment = (postId: string, text: string) => {
    const p = allPosts.find(x => x.id === postId);
    if (!p) return;
    
    const { currentUserId, currentUserProfile, trips } = useTravelStore.getState();
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
    updateStorePost(postId, { comments: newCommentsList });
    
    if (!postId.startsWith('p')) {
      supabase.from('posts').update({ comments: newCommentsList }).eq('id', postId).then();
    }
  };

  const addPost = async (content: string, images: string[], authorId: string, authorName: string, targetTripId?: string, isDual?: boolean) => {
    // 1. Upload all local images to Supabase Storage
    const uploadedImages = [];
    for (const uri of images) {
      if (uri.startsWith('file://')) {
        try {
          const publicUrl = await uploadMediaToSupabase(uri);
          uploadedImages.push(publicUrl);
        } catch (e) {
          console.error("Upload failed layout, falling back to local uri", e);
          uploadedImages.push(uri);
        }
      } else {
        uploadedImages.push(uri);
      }
    }

    const { currentUserProfile, trips } = useTravelStore.getState();
    const trip = trips.find(t => t.id === (targetTripId || tripId));
    const userMember = trip?.members.find(m => m.id === authorId);
    const authorAvatar = currentUserProfile?.avatar || userMember?.avatar || undefined;

    const newPost: Post & { tripId?: string } = {
      id: 'p' + Date.now().toString(),
      tripId: targetTripId || tripId,
      authorId,
      authorName,
      authorAvatar,
      content,
      images: uploadedImages,
      isDual: isDual || false,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      hasLiked: false,
      comments: []
    };
    
    // 2. Add to Local Zustand Store
    addStorePost(newPost);
    
    // 3. (Optional) Sync to Supabase DB if user is logged in
    const { currentUserId } = useTravelStore.getState();
    if (currentUserId && newPost.tripId && !newPost.tripId.startsWith('t')) {
       supabase.from('posts').insert({
         trip_id: newPost.tripId,
         user_id: currentUserId,
         content: content,
         image_urls: uploadedImages,
         is_dual_camera: isDual || false,
         comments: []
       }).select().single().then(({ data, error }) => {
         if (error) {
           console.log("Post sync warning:", error.message);
         } else if (data) {
           useTravelStore.getState().updatePost(newPost.id, { id: data.id });
         }
       });
    }
  };

  const deletePost = async (postId: string) => {
    deleteStorePost(postId);
    if (!postId.startsWith('p')) {
      await supabase.from('posts').delete().eq('id', postId);
    }
  };

  const editPost = async (postId: string, content: string, images: string[]) => {
    updateStorePost(postId, { content, images });
    if (!postId.startsWith('p')) {
      await supabase.from('posts').update({ content: content, images: images }).eq('id', postId);
    }
  };

  return { posts, toggleLike, addComment, addPost, deletePost, editPost };
}
