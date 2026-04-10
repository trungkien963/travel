import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, Image, ScrollView } from 'react-native';
import { X, Image as ImageIcon, Camera as CameraIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Post } from '../types/social';

const { height } = Dimensions.get('window');

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string, images: string[]) => void;
  currentUserName: string;
  initialPost?: Post | null;
}

export function CreatePostModal({ visible, onClose, onSave, currentUserName, initialPost }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  React.useEffect(() => {
    if (visible) {
      setContent(initialPost?.content || '');
      setImages(initialPost?.images || []);
    }
  }, [visible, initialPost]);

  const pickImage = async (fromCamera: boolean = false) => {
    try {
      if (fromCamera) {
        if (!cameraPermission?.granted) {
          const p = await requestCameraPermission();
          if (!p.granted) {
            Alert.alert("Permission required", "Camera permission is needed to take a photo.");
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) { setImages([...images, result.assets[0].uri]); }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled) { 
          setImages([...images, ...result.assets.map(a => a.uri)]); 
        }
      }
    } catch (error) {
      Alert.alert("Camera Unavailable", "Cannot open the camera on this device or simulator.");
    }
  };

  const handlePost = () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Post', 'Please write something or attach an image.');
      return;
    }
    onSave(content.trim(), images);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                 <TouchableOpacity onPress={onClose}><X size={24} color="#1C1917" /></TouchableOpacity>
                 <Text style={styles.modalTitle}>{initialPost ? 'Edit Post' : 'Create Post'}</Text>
              </View>
              <TouchableOpacity onPress={handlePost} style={[styles.postBtn, (!content.trim() && images.length === 0) && {opacity: 0.5}]} disabled={!content.trim() && images.length === 0}>
                <Text style={styles.postBtnText}>{initialPost ? 'Save' : 'Publish'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 40}} showsVerticalScrollIndicator={false}>
               <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16}}>
                 <View style={{width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontWeight: '900', color: '#059669', fontSize: 18}}>{currentUserName.charAt(0)}</Text>
                 </View>
                 <Text style={{fontSize: 16, fontWeight: '800', color: '#1C1917'}}>{currentUserName}</Text>
               </View>

               <TextInput
                 style={styles.input}
                 placeholder="What's going on in this trip?"
                 placeholderTextColor="#A8A29E"
                 multiline
                 value={content}
                 onChangeText={setContent}
                 autoFocus
               />

               {images.length > 0 && (
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {images.map((uri, idx) => (
                      <View key={idx} style={{marginRight: 12, position: 'relative'}}>
                         <Image source={{ uri }} style={{ width: 140, height: 180, borderRadius: 16 }} />
                         <TouchableOpacity 
                           style={styles.removeImageBtn}
                           onPress={() => setImages(images.filter((_, i) => i !== idx))}
                         >
                           <X size={14} color="#FFF" />
                         </TouchableOpacity>
                      </View>
                    ))}
                 </ScrollView>
               )}

               <View style={{flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16, gap: 16, marginTop: 16}}>
                 <TouchableOpacity onPress={() => pickImage(false)} style={styles.mediaBtn}>
                   <ImageIcon size={24} color="#059669" />
                   <Text style={styles.mediaBtnText}>Photo</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => pickImage(true)} style={styles.mediaBtn}>
                   <CameraIcon size={24} color="#059669" />
                   <Text style={styles.mediaBtnText}>Camera</Text>
                 </TouchableOpacity>
               </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentWrapper: { width: '100%', maxHeight: height * 0.9 },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1C1917' },
  postBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  postBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  
  input: { fontSize: 18, color: '#1C1917', lineHeight: 28, minHeight: 120, textAlignVertical: 'top', marginBottom: 16, fontWeight: '500' },
  
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 },
  
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: '#F0FDF4' },
  mediaBtnText: { color: '#059669', fontWeight: '800', fontSize: 14 }
});
