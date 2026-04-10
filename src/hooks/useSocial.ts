import { useMemo } from 'react';
import { Post, Comment } from '../types/social';
import { useTravelStore } from '../store/useTravelStore';

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
    const newComment: Comment = {
      id: 'c' + Date.now().toString(),
      authorId: 'm1', // Hardcoded as logged-in user Edric
      authorName: 'You (Edric)',
      text: text,
      timestamp: 'Just now'
    };
    updateStorePost(postId, { comments: [...p.comments, newComment] });
  };

  const addPost = (content: string, images: string[], authorId: string, authorName: string, targetTripId?: string) => {
    const newPost: Post & { tripId?: string } = {
      id: 'p' + Date.now().toString(),
      tripId: targetTripId || tripId,
      authorId,
      authorName,
      content,
      images,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      hasLiked: false,
      comments: []
    };
    addStorePost(newPost);
  };

  const deletePost = (postId: string) => {
    deleteStorePost(postId);
  };

  const editPost = (postId: string, content: string, images: string[]) => {
    updateStorePost(postId, { content, images });
  };

  return { posts, toggleLike, addComment, addPost, deletePost, editPost };
}
