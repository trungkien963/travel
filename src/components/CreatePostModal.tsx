import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, Image, SafeAreaView, ScrollView } from 'react-native';
import { X, Image as ImageIcon, RefreshCcw, Zap, ChevronDown, Check, Users, Receipt, CheckCircle2, Circle, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Post } from '../types/social';
import { Expense, Member, SplitType } from '../types/expense';

const { height, width } = Dimensions.get('window');

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string, images: string[], expenseData?: Expense, isDual?: boolean) => void;
  currentUserName: string;
  initialPost?: Post | null;
  tripMembers: Member[];
}

const formatCurrency = (val: string) => {
  if (!val) return '0';
  return parseInt(val, 10).toLocaleString('en-US');
};

export function CreatePostModal({ visible, onClose, onSave, currentUserName, initialPost, tripMembers }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // Expense Toggles and States
  const [isExpenseMode, setIsExpenseMode] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState('m1'); 
  const [splitType, setSplitType] = useState<SplitType>('EQUALLY');
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isDualMode, setIsDualMode] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    if (visible) {
      if (initialPost) {
        setContent(initialPost.content || '');
        setImages(initialPost.images || []);
        setIsExpenseMode(false);
      } else {
        setContent('');
        setImages([]);
        setIsExpenseMode(false);
        setExpenseAmount('');
        setPaidBy('m1');
        setSplitType('EQUALLY');
        setCustomSplits({});
        if (tripMembers?.length > 0) {
          setIncludedMembers(Object.fromEntries(tripMembers.map(m => [m.id, true])));
        }
        if (!cameraPermission?.granted) {
          requestCameraPermission();
        }
      }
    }
  }, [visible, initialPost, tripMembers]);

  const toggleCameraFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));
  const toggleFlash = () => setFlash(current => (current === 'off' ? 'on' : 'off'));

  const getCalculatedSplit = (memberId: string) => {
    const total = parseInt(expenseAmount || '0', 10);
    const includedCount = Object.values(includedMembers).filter(Boolean).length;
    if (!includedMembers[memberId] || includedCount === 0 || total === 0) return 0;
    if (splitType === 'EQUALLY') return Math.round(total / includedCount);
    if (splitType === 'PERCENT') return Math.round((total * parseFloat(customSplits[memberId] || '0')) / 100);
    if (splitType === 'FIXED') return parseInt(customSplits[memberId] || '0', 10);
    return 0;
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      if (isDualMode) {
        // Dual Capture Mode: 
        // 1. Capture current facing
        const photo1 = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        
        setIsFlipping(true);
        // 2. Flip camera
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        
        // 3. Wait a bit for hardware switch
        await new Promise(r => setTimeout(r, 800)); // Increase wait for slower hardware
        
        // 4. Capture second facing
        const photo2 = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        
        setIsFlipping(false);
        if (isAddingMore) {
          setImages(prev => [...prev, photo1.uri, photo2.uri]);
          setIsAddingMore(false);
        } else {
          setImages([photo1.uri, photo2.uri]);
        }
      } else {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (isAddingMore) {
          setImages(prev => [...prev, photo.uri]);
          setIsAddingMore(false);
        } else {
          setImages([photo.uri]);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Could not take picture.");
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) { 
        if (isAddingMore) {
          setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
          setIsAddingMore(false);
        } else {
          setImages(result.assets.map(a => a.uri)); 
        }
      }
    } catch (error) {
      Alert.alert("Unavailable", "Cannot open library.");
    }
  };

  const handlePost = () => {
    let expenseData: Expense | undefined = undefined;

    if (isExpenseMode) {
      if (!expenseAmount) {
        Alert.alert('Missing Info', 'Please enter valid amount to create an expense.');
        return;
      }
      
      const splitsBreakdown: Record<string, number> = {};
      tripMembers.forEach(m => { splitsBreakdown[m.id] = getCalculatedSplit(m.id); });

      expenseData = {
        id: Date.now().toString() + '_exp',
        desc: content || 'Shared Moment',
        amount: parseInt(expenseAmount, 10),
        payerId: paidBy,
        date: new Date().toISOString().split('T')[0],
        splits: splitsBreakdown,
        receipts: images
      };
    }

    onSave(content.trim(), images, expenseData, isDualMode);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView ref={scrollViewRef} bounces={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* TOP CAMERA / IMAGE SECTION (Split Screen) */}
          <View style={{ height: height * 0.55, width: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: '#000', position: 'relative' }}>
          
          {isFlipping && (
            <View style={{...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', zIndex: 999, justifyContent: 'center', alignItems: 'center'}}>
              <RefreshCcw size={48} color="#000" />
              <Text style={{ marginTop: 24, fontSize: 18, fontWeight: '800', color: '#000' }}>Hold on! Flipping...</Text>
            </View>
          )}

          {(images.length > 0 && !isAddingMore) ? (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: images[Math.min(selectedPreviewIndex, Math.max(0, images.length - 1))] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              {images.length === 2 && isDualMode && (
                <View style={[styles.pipContainer, { top: 100, left: 24 }]}>
                  <Image source={{ uri: images[1] }} style={styles.pipImage} />
                </View>
              )}

            </View>
          ) : (
            cameraPermission?.granted ? (
              <CameraView style={{ flex: 1 }} facing={facing} flash={flash} ref={cameraRef} />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1917' }}>
                 <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Camera Permission Denied</Text>
              </View>
            )
          )}

          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />

          {/* Top Controls Overlay */}
          <SafeAreaView style={{ position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
            <TouchableOpacity onPress={() => {
                if (isAddingMore) {
                  setIsAddingMore(false);
                } else if (images.length > 0 || content) {
                  Alert.alert("Discard Post?", "If you close this, your edits will be lost.", [
                    { text: "Keep Editing", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => onClose() }
                  ]);
                } else {
                  onClose();
                }
              }} style={styles.iconCircle}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            {(!images.length || isAddingMore) && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.iconCircle} onPress={pickImage}>
                  <ImageIcon color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={() => setIsDualMode(!isDualMode)}>
                  <Text style={{ color: isDualMode ? '#F59E0B' : '#FFF', fontWeight: '800', fontSize: 10 }}>DUAL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={toggleCameraFacing}>
                  <RefreshCcw color="#FFF" size={20} />
                </TouchableOpacity>
              </View>
            )}

            {(images.length > 0 && !isAddingMore && !isDualMode) && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => setIsAddingMore(true)}>
                  <Plus size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>

          {/* Bottom Controls Overlay (Shutter) */}
          <View style={{ position: 'absolute', bottom: 30, alignSelf: 'center' }}>
            {(images.length > 0 && !isAddingMore) ? (
              <TouchableOpacity style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 }} onPress={() => setImages([])}>
                <Text style={{ color: '#FFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Retake</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' }}
                onPress={takePicture}
              >
                 <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', opacity: 0.8 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* BOTTOM FORM SECTION */}
        <View style={{ padding: 24 }}>
          {images.length > 0 && !isDualMode && (
             <View style={{ marginBottom: 24 }}>
               <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Photos ({images.length})</Text>
               <ScrollView 
                 horizontal 
                 showsHorizontalScrollIndicator={false}
                 contentContainerStyle={{ gap: 12 }}
               >
                 {images.map((img, idx) => (
                   <TouchableOpacity 
                     key={idx} 
                     activeOpacity={0.8}
                     onPress={() => setViewingImageIndex(idx)}
                     style={{ width: 80, height: 100, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', elevation: 2 }}
                   >
                     <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} />
                     <TouchableOpacity 
                       style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}
                       onPress={() => {
                          setImages(prev => prev.filter((_, i) => i !== idx));
                          if (selectedPreviewIndex === idx) setSelectedPreviewIndex(0);
                          else if (selectedPreviewIndex > idx) setSelectedPreviewIndex(prev => prev - 1);
                       }}
                     >
                       <X size={12} color="#FFF" />
                     </TouchableOpacity>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
             </View>
          )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <Text style={{ color: '#1C1917', fontSize: 28, fontWeight: '900' }}>Add Details</Text>
               <TouchableOpacity 
                 style={[styles.expenseToggleBtn, isExpenseMode && {backgroundColor: '#F59E0B'}]} 
                 onPress={() => setIsExpenseMode(!isExpenseMode)}
               >
                 <Receipt size={16} color={isExpenseMode ? '#000' : '#1C1917'} />
                 <Text style={{color: isExpenseMode ? '#000' : '#1C1917', fontWeight: '800', fontSize: 12}}>
                   {isExpenseMode ? 'EXPENSE ON' : '+ BILL'}
                 </Text>
               </TouchableOpacity>
            </View>

            {/* Content Input (Add Post style) */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
               <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>What was this for?</Text>
               <TextInput
                 style={{ fontSize: 18, fontWeight: '600', color: '#1C1917', minHeight: 40 }}
                 placeholder="E.g., Dinner at the bay"
                 placeholderTextColor="#D0D0D0"
                 multiline
                 value={content}
                 onChangeText={setContent}
                 onFocus={() => scrollViewRef.current?.scrollTo({ y: height * 0.55, animated: true })}
               />
            </View>

            {isExpenseMode && (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
                 <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Total Price</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12, marginBottom: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: '#F59E0B', marginRight: 8 }}>₫</Text>
                    <TextInput 
                      style={{ flex: 1, fontSize: 32, fontWeight: '900', color: '#1C1917' }}
                      keyboardType="numeric" 
                      placeholder="0"
                      placeholderTextColor="#D0D0D0"
                      value={formatCurrency(expenseAmount)} 
                      onChangeText={(v) => setExpenseAmount(v.replace(/[^0-9]/g, ''))} 
                      onFocus={() => scrollViewRef.current?.scrollTo({ y: height * 0.55, animated: true })}
                    />
                 </View>

                 <Text style={[styles.fieldLabel, { color: '#8C8C8C' }]}>PAID BY</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                    {tripMembers.map(member => (
                      <TouchableOpacity 
                        key={member.id} 
                        style={paidBy === member.id ? styles.paidByActivePill : styles.paidByInactivePill}
                        onPress={() => setPaidBy(member.id)}
                      >
                        <Text style={paidBy === member.id ? styles.paidByActiveText : styles.paidByInactiveText}>{member.name}</Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>

                 <Text style={[styles.fieldLabel, { color: '#8C8C8C' }]}>SPLIT EQUALLY</Text>
                 <View style={styles.membersList}>
                   {tripMembers.map(member => {
                     const isIncluded = includedMembers[member.id];
                     return (
                       <View key={`exm-${member.id}`} style={[styles.splitUserRow, !isIncluded && styles.splitUserRowDisabled]}>
                         <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', flex: 1}} onPress={() => setIncludedMembers(p => ({...p, [member.id]: !p[member.id]}))}>
                            <View style={isIncluded ? styles.checkCircleActive : styles.checkCircleInactive}>
                              {isIncluded ? <CheckCircle2 color="#FFC800" size={16} /> : <Circle color="#D4D4D4" size={16} />}
                            </View>
                            <Text style={[styles.splitUserName, !isIncluded && {textDecorationLine: 'line-through'}]}>{member.name}</Text>
                         </TouchableOpacity>
                         <Text style={[styles.splitUserAmount, !isIncluded && {color: '#525252'}]}>₫{formatCurrency(getCalculatedSplit(member.id).toString())}</Text>
                       </View>
                     );
                   })}
                 </View>
              </View>
            )}

            <View style={{ height: 60 }} />
          </View>

          {/* Sticky Confirm Button */}
          <View style={{ position: 'absolute', bottom: 30, right: 24 }}>
            <TouchableOpacity 
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC800', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC800', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 12 }}
              onPress={handlePost}
            >
               <Check color="#1C1917" size={32} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FULLSCREEN IMAGE VIEWER MODAL */}
      <Modal visible={viewingImageIndex !== null} transparent={true} animationType="fade" onRequestClose={() => setViewingImageIndex(null)}>
         <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
            {viewingImageIndex !== null && images[viewingImageIndex] && (
               <Image 
                 source={{ uri: images[viewingImageIndex] }} 
                 style={{ width: '100%', height: '80%', resizeMode: 'contain' }} 
               />
            )}
            
            {/* Top Bar for Viewer */}
            <SafeAreaView style={{ position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
               <TouchableOpacity onPress={() => setViewingImageIndex(null)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 24 }}>
                  <X size={24} color="#FFF" />
               </TouchableOpacity>
               
               <TouchableOpacity 
                 onPress={() => {
                   if (viewingImageIndex !== null) {
                     setImages(prev => prev.filter((_, i) => i !== viewingImageIndex));
                     setViewingImageIndex(null);
                   }
                 }} 
                 style={{ backgroundColor: 'rgba(239,68,68,0.8)', padding: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}
               >
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>DELETE</Text>
                  <X size={18} color="#FFF" />
               </TouchableOpacity>
            </SafeAreaView>
         </View>
      </Modal>

    </Modal>
  );
}


const styles = StyleSheet.create({
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  pipContainer: { position: 'absolute', width: 90, height: 120, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  pipImage: { width: '100%', height: '100%' },
  expenseToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E5E5E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  paidByActivePill: { backgroundColor: '#1C1917', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByActiveText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  paidByInactivePill: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByInactiveText: { color: '#8C8C8C', fontSize: 13, fontWeight: '800' },
  membersList: { gap: 12 },
  splitUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFC800' },
  splitUserRowDisabled: { borderColor: '#F0F0F0' },
  checkCircleActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkCircleInactive: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#F5F5F5' },
  splitUserName: { fontSize: 15, fontWeight: '800', color: '#1C1917' },
  splitUserAmount: { fontSize: 16, fontWeight: '900', color: '#FDE047', textAlign: 'right' },
});
