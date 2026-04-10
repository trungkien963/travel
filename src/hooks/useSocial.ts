import { useState } from 'react';
import { Post, Comment } from '../types/social';

export function useSocial() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'p1',
      authorId: 'm2',
      authorName: 'Jane Doe',
      content: 'Chuyến đi Bali này đỉnh quá mọi người ơi! Hoàng hôn tuyệt đẹp 🌅 Cảm ơn cả nhóm đã đồng hành!',
      images: [
        'https://images.unsplash.com/photo-1512684534887-3c5e8869c362?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop'
      ],
      timestamp: '2 hours ago',
      date: '2026-04-10',
      likes: 12,
      hasLiked: true,
      comments: [
        { id: 'c1', authorId: 'm3', authorName: 'Khoi Nguyen', text: 'Chụp hình xịn quá, gửi file gốc đi bà!', timestamp: '1 hour ago' }
      ]
    },
    {
      id: 'p2',
      authorId: 'm1',
      authorName: 'You (Edric)',
      content: 'Vừa check-in resort xong. Chuẩn bị bung xõa đêm nay thôi 🔥🍾',
      images: [],
      timestamp: '5 hours ago',
      date: '2026-04-10',
      likes: 4,
      hasLiked: false,
      comments: []
    }
  ]);

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, hasLiked: !p.hasLiked, likes: p.hasLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComment: Comment = {
          id: 'c' + Date.now().toString(),
          authorId: 'm1', // Hardcoded as logged-in user Edric
          authorName: 'You (Edric)',
          text: text,
          timestamp: 'Just now'
        };
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));
  };

  const addPost = (content: string, images: string[], authorId: string, authorName: string) => {
    const newPost: Post = {
      id: 'p' + Date.now().toString(),
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
    setPosts(prev => [newPost, ...prev]);
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const editPost = (postId: string, content: string, images: string[]) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, content, images };
      }
      return p;
    }));
  };

  return { posts, toggleLike, addComment, addPost, deletePost, editPost };
}
