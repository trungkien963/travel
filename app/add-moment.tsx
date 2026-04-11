import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, Image, SafeAreaView, ScrollView, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Image as ImageIcon, RefreshCcw, Zap, ChevronDown, Check, Receipt, CheckCircle2, Circle, MapPin, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MOCK_MEMBERS } from '../src/constants/mockData';
import { useTravelStore } from '../src/store/useTravelStore';
import { SplitType } from '../src/types/expense';
import { useLocationSearch, LocationResult } from '../src/hooks/useLocationSearch';
import { Search } from 'lucide-react-native';

const { height, width } = Dimensions.get('window');

const formatCurrency = (val: string) => {
  if (!val) return '0';
  return parseInt(val, 10).toLocaleString('en-US');
};

export default function AddMomentScreen() {
  const router = useRouter();
  
  // Content & Modes
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location feature
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const { query, setQuery, results, isSearching } = useLocationSearch();
  
  const { trips, addExpense, addPost, currentUserId, currentUserProfile } = useTravelStore();
  
  const currentTrip = trips.find(t => t.id === tripId);
  const tripMembers = currentTrip?.members || MOCK_MEMBERS;
  
  // Expense States
  const [isExpenseMode, setIsExpenseMode] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId || tripMembers[0]?.id); 
  const [splitType, setSplitType] = useState<SplitType>('EQUALLY');
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  
  // Trip Selection Logic
  const [selectedTripId, setSelectedTripId] = useState<string | null>(tripId || null);
  const [showTripSelector, setShowTripSelector] = useState(false);

  // Camera States
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

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    // Initialize included members for expenses
    setIncludedMembers(Object.fromEntries(tripMembers.map(m => [m.id, true])));
    
    // Auto-select trip (Current Date logic)
    if (!selectedTripId) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDate = new Date(todayStr);
      const ongoingTrip = trips.find(t => t.startDate <= todayStr && t.endDate >= todayStr);
      if (ongoingTrip) {
        setSelectedTripId(ongoingTrip.id);
      } else if (trips.length > 0) {
        let closestId = trips[0]?.id;
        let minDiff = Infinity;
        trips.forEach(t => {
           const tDate = new Date(t.startDate);
           const diff = Math.abs(todayDate.getTime() - tDate.getTime());
           if (diff < minDiff) {
              minDiff = diff;
              closestId = t.id;
           }
        });
        if (closestId) setSelectedTripId(closestId);
      }
    }
  }, [cameraPermission, trips]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const toggleCameraFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));
  const toggleFlash = () => setFlash(current => (current === 'off' ? 'on' : 'off'));

  const getCalculatedSplit = (memberId: string) => {
    const total = parseInt(expenseAmount || '0', 10);
    const includedCount = Object.values(includedMembers).filter(Boolean).length;
    if (!includedMembers[memberId] || includedCount === 0 || total === 0) return 0;
    return Math.round(total / includedCount);
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      if (isDualMode) {
        const photo1 = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setIsFlipping(true);
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        await new Promise(r => setTimeout(r, 800));
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

  const handlePost = async () => {
    if (!selectedTripId) {
      Alert.alert("Error", "Please select a trip first.");
      return;
    }
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isExpenseMode) {
      if (!expenseAmount) {
        setIsSubmitting(false);
        Alert.alert("Missing Amount", "Please enter valid amount to create an expense.");
        return;
      }
      addExpense({
        id: 'e' + Date.now().toString(),
        tripId: selectedTripId,
        desc: content || 'Untitled Expense',
        amount: parseInt(expenseAmount.replace(/,/g, ''), 10) || 0,
        payerId: paidBy || currentUserId || 'm1',
        date: new Date().toISOString().split('T')[0],
        category: 'OTHER',
        splits: {}
      });
      router.replace({ pathname: '/trip/[id]', params: { id: selectedTripId, tab: 'EXPENSES' } });
    } else {
      if (!content && images.length === 0) {
        setIsSubmitting(false);
        Alert.alert("Missing Input", "Add a photo or write something.");
        return;
      }
      
      const currentTrip = trips.find(t => t.id === selectedTripId);
      const userMember = currentTrip?.members.find(m => m.id === currentUserId);
      const postAuthorName = currentUserProfile?.name || userMember?.name || 'Traveler';
      const postAuthorAvatar = currentUserProfile?.avatar || userMember?.avatar || undefined;
      
      addPost({
        id: 'p' + Date.now().toString(),
        tripId: selectedTripId,
        authorId: currentUserId || 'm1',
        authorName: postAuthorName,
        authorAvatar: postAuthorAvatar,
        content: content,
        images: images,
        isDual: isDualMode,
        locationName: selectedLocation?.name,
        locationCity: selectedLocation?.city,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        hasLiked: false,
        comments: []
      });
      // Redirect to trip detail with Social Tab opened
      router.replace({ pathname: '/trip/[id]', params: { id: selectedTripId, tab: 'SOCIAL' } });
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView ref={scrollViewRef} bounces={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* TOP CAMERA / IMAGE SECTION (Split Screen) */}
      <View style={styles.cameraSection}>
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
            <View style={styles.noCameraView}>
               <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Camera Permission Denied</Text>
            </View>
          )
        )}

        <View style={styles.cameraOverlayDarken} pointerEvents="none" />

        {/* Top Controls Overlay */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity onPress={() => {
              if (isAddingMore) {
                setIsAddingMore(false);
              } else if (images.length > 0 || content) {
                Alert.alert("Discard Moment?", "If you go back, your edits will be lost.", [
                  { text: "Keep Editing", style: "cancel" },
                  { text: "Discard", style: "destructive", onPress: () => router.back() }
                ]);
              } else {
                router.back();
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
        <View style={styles.shutterContainer}>
          {(images.length > 0 && !isAddingMore) ? (
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setImages([])}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          ) : (
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
               <TouchableOpacity style={styles.flashBadge} onPress={toggleFlash}>
                  <Zap size={18} color={flash === 'on' ? "#F59E0B" : "#FFF"} fill={flash === 'on' ? "#F59E0B" : "transparent"} />
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.shutterRing} onPress={takePicture}>
                  <View style={styles.shutterInner} />
               </TouchableOpacity>
               <View style={{ width: 44 }} />
             </View>
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
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
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

          {/* TRIP SELECTOR (Global Screen Context) */}
          <Text style={styles.fieldLabel}>SAVE TO TRIP</Text>
          <TouchableOpacity 
             style={styles.tripSelectorBtn}
             onPress={() => setShowTripSelector(!showTripSelector)}
             activeOpacity={0.8}
          >
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.tripIconCircle}>
                  <MapPin size={18} color="#FFC800" />
                </View>
                <View>
                  <Text style={styles.tripSelectorTitle}>{selectedTrip ? selectedTrip.title : 'Select a Trip'}</Text>
                  <Text style={styles.tripSelectorSubtitle}>{selectedTrip ? `${new Date(selectedTrip.startDate).toLocaleDateString('en-GB')}` : 'Requires selection'}</Text>
                </View>
             </View>
             <ChevronDown size={20} color="#A8A29E" />
          </TouchableOpacity>

          {showTripSelector && (
            <View style={styles.tripDropdown}>
               {trips.map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.tripDropdownItem, selectedTripId === t.id && {backgroundColor: 'rgba(255,200,0,0.1)'}]}
                    onPress={() => { setSelectedTripId(t.id); setShowTripSelector(false); }}
                  >
                    <Text style={[styles.tripDropdownTitle, selectedTripId === t.id && {color: '#FFC800'}]}>{t.title}</Text>
                    <Text style={styles.tripDropdownDates}>{t.startDate}</Text>
                  </TouchableOpacity>
               ))}
               {trips.length === 0 && (
                  <View style={{ padding: 16 }}>
                    <Text style={{ color: '#A8A29E' }}>No trips available.</Text>
                  </View>
               )}
            </View>
          )}

          {/* Content Input */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16 }}>
             <Text style={[styles.fieldLabel, { color: '#8C8C8C' }]}>What was this for?</Text>
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

          {/* Location Search Input (Free Nominatim API) */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16 }}>
             <Text style={[styles.fieldLabel, { color: '#8C8C8C' }]}>Location (Tag)</Text>
             {selectedLocation ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1917' }}>📍 {selectedLocation.name}</Text>
                    <Text style={{ fontSize: 13, color: '#A8A29E', marginTop: 2 }}>{selectedLocation.city}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedLocation(null); setQuery(''); }}>
                     <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
             ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8, marginTop: 4 }}>
                    <Search size={18} color="#A8A29E" style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#1C1917' }}
                      placeholder="Search on OpenStreetMap..."
                      placeholderTextColor="#D0D0D0"
                      value={query}
                      onChangeText={setQuery}
                      onFocus={() => scrollViewRef.current?.scrollTo({ y: height * 0.55, animated: true })}
                    />
                  </View>
                  
                  {isSearching && <Text style={{ color: '#A8A29E', fontSize: 12, marginTop: 8 }}>Searching OSM...</Text>}
                  
                  {results.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      {results.map((r) => (
                        <TouchableOpacity 
                          key={r.placeId} 
                          style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F4' }}
                          onPress={() => setSelectedLocation(r)}
                        >
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C1917' }}>{r.name}</Text>
                          <Text style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>{r.address}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
             )}
          </View>

          {isExpenseMode && (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16 }}>
               <Text style={[styles.fieldLabel, {color: '#8C8C8C'}]}>Total Price</Text>
               <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>₫</Text>
                  <TextInput 
                    style={styles.amountInput}
                    keyboardType="numeric" 
                    placeholder="0"
                    placeholderTextColor="#D0D0D0"
                    value={formatCurrency(expenseAmount)} 
                    onChangeText={(v) => setExpenseAmount(v.replace(/[^0-9]/g, ''))} 
                    onFocus={() => scrollViewRef.current?.scrollTo({ y: height * 0.55, animated: true })}
                  />
               </View>

               <Text style={[styles.fieldLabel, { color: '#A8A29E' }]}>PAID BY</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                  {MOCK_MEMBERS.map(member => (
                    <TouchableOpacity 
                      key={member.id} 
                      style={paidBy === member.id ? styles.paidByActivePill : styles.paidByInactivePill}
                      onPress={() => setPaidBy(member.id)}
                    >
                      <Text style={paidBy === member.id ? styles.paidByActiveText : styles.paidByInactiveText}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>

               <Text style={[styles.fieldLabel, { color: '#A8A29E' }]}>SPLIT EQUALLY</Text>
               <View style={styles.membersList}>
                 {MOCK_MEMBERS.map(member => {
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

        </View>
        {/* Sticky Confirm Button */}
        <View style={styles.stickyConfirmWrapper}>
          <TouchableOpacity 
            style={styles.stickyConfirmBtn}
            onPress={handlePost}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={{ color: '#1C1917', fontSize: 13, fontWeight: '800' }}>Wait...</Text>
            ) : (
              <Check color="#1C1917" size={24} strokeWidth={3} />
            )}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  cameraSection: { height: height * 0.55, width: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  noCameraView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1917' },
  cameraOverlayDarken: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  topControls: { position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  pipContainer: { position: 'absolute', width: 90, height: 120, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  pipImage: { width: '100%', height: '100%' },
  
  shutterContainer: { position: 'absolute', bottom: 30, alignSelf: 'center' },
  shutterRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', opacity: 0.8 },
  retakeBtn: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  retakeText: { color: '#FFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  flashBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  expenseToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E5E5E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, color: '#8C8C8C', textTransform: 'uppercase' },
  
  tripSelectorBtn: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  tripIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,200,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  tripSelectorTitle: { color: '#1C1917', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  tripSelectorSubtitle: { color: '#8C8C8C', fontSize: 12, fontWeight: '600' },
  tripDropdown: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  tripDropdownItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tripDropdownTitle: { color: '#1C1917', fontSize: 15, fontWeight: '700' },
  tripDropdownDates: { color: '#8C8C8C', fontSize: 12, fontWeight: '600' },

  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12, marginBottom: 20 },
  currencySymbol: { fontSize: 24, fontWeight: '900', color: '#F59E0B', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '900', color: '#1C1917' },
  
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

  stickyConfirmWrapper: { position: 'absolute', bottom: 30, right: 24 },
  stickyConfirmBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC800', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC800', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 12 }
});
