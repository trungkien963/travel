import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Send } from 'lucide-react-native';
import { Post } from '../types/social';

const { height } = Dimensions.get('window');

interface PostCommentsModalProps {
  post: Post | null;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
}

export function PostCommentsModal({ post, onClose, onAddComment }: PostCommentsModalProps) {
  const [text, setText] = useState('');

  if (!post) return null;

  const handleSend = () => {
    if (text.trim().length > 0) {
      onAddComment(post.id, text.trim());
      setText('');
    }
  };

  return (
    <Modal visible={!!post} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments ({post.comments.length})</Text>
              <TouchableOpacity onPress={onClose}><X size={24} color="#A8A29E" /></TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 24, gap: 16}}>
              {post.comments.length === 0 ? (
                <Text style={{textAlign: 'center', color: '#A8A29E', marginTop: 24, fontWeight: '600'}}>No comments yet. Be the first!</Text>
              ) : (
                post.comments.map(c => (
                  <View key={c.id} style={{flexDirection: 'row', gap: 12}}>
                    <View style={{width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center'}}>
                       <Text style={{fontWeight: '900', color: '#059669', fontSize: 14}}>{c.authorName.charAt(0)}</Text>
                    </View>
                    <View style={{flex: 1, backgroundColor: '#FBFBFB', padding: 14, borderRadius: 16}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                         <Text style={{fontSize: 14, fontWeight: '900', color: '#1C1917'}}>{c.authorName}</Text>
                         <Text style={{fontSize: 11, fontWeight: '700', color: '#A8A29E'}}>{c.timestamp}</Text>
                      </View>
                      <Text style={{fontSize: 14, color: '#1C1917', lineHeight: 20}}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                placeholder="Write a comment..."
                placeholderTextColor="#A8A29E"
                value={text}
                onChangeText={setText}
                multiline
              />
              <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!text.trim()}>
                <Send size={20} color={text.trim() ? '#059669' : '#F0F0F0'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentWrapper: { width: '100%', maxHeight: height * 0.7 },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, height: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1C1917' },
  commentsList: { flex: 1 },
  inputArea: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16, marginTop: 8, gap: 12 },
  input: { flex: 1, backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 15, maxHeight: 120, fontWeight: '500' },
  sendBtn: { padding: 10, backgroundColor: '#FBFBFB', borderRadius: 24, borderWidth: 1, borderColor: '#F0F0F0' }
});
