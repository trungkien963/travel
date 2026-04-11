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

  const toggleLike = (postId: string) => {
    const p = allPosts.find(x => x.id === postId);
    if (!p) return;
    updateStorePost(postId, { hasLiked: !p.hasLiked, likes: p.hasLiked ? p.likes - 1 : p.likes + 1 });
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
      authorId: currentUserId || 'm1',
      authorName: commentAuthorName,
      authorAvatar: commentAuthorAvatar,
      text: text,
      timestamp: new Date().toISOString()
    };
    updateStorePost(postId, { comments: [...p.comments, newComment] });
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

    const newPost: Post & { tripId?: string } = {
      id: 'p' + Date.now().toString(),
      tripId: targetTripId || tripId,
      authorId,
      authorName,
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
    if (currentUserId && currentUserId !== 'm1') {
       supabase.from('posts').insert([{
         id: newPost.id.replace('p', ''), // Supabase wants UUID, maybe generate one? Or let DB generate it. 
         // For now, doing it offline first is fine, but here's the API call.
       }]).then(({ error }) => {
         if (error) console.log("Post sync warning:", error.message);
       });
    }
  };

  const deletePost = (postId: string) => {
    deleteStorePost(postId);
  };

  const editPost = (postId: string, content: string, images: string[]) => {
    updateStorePost(postId, { content, images });
  };

  return { posts, toggleLike, addComment, addPost, deletePost, editPost };
}
