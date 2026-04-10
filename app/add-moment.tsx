import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, Image, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, RefreshCcw, Zap, ChevronDown, Check, Receipt, CheckCircle2, Circle, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MOCK_MEMBERS, MOCK_TRIPS } from '../src/constants/mockData';
import { SplitType } from '../src/types/expense';

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
  const [isExpenseMode, setIsExpenseMode] = useState(false);
  
  // Expense States
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState('m1'); 
  const [splitType, setSplitType] = useState<SplitType>('EQUALLY');
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  
  // Trip Selection Logic
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showTripSelector, setShowTripSelector] = useState(false);

  // Camera States
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isDualMode, setIsDualMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    // Initialize included members for expenses
    setIncludedMembers(Object.fromEntries(MOCK_MEMBERS.map(m => [m.id, true])));
    
    // Auto-select trip (Current Date logic)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    
    // 1. Find ongoing
    const ongoingTrip = MOCK_TRIPS.find(t => t.startDate <= todayStr && t.endDate >= todayStr);
    if (ongoingTrip) {
      setSelectedTripId(ongoingTrip.id);
    } else {
      // 2. Find closest
      let closestId = MOCK_TRIPS[0]?.id;
      let minDiff = Infinity;
      MOCK_TRIPS.forEach(t => {
         const tDate = new Date(t.startDate);
         const diff = Math.abs(todayDate.getTime() - tDate.getTime());
         if (diff < minDiff) {
            minDiff = diff;
            closestId = t.id;
         }
      });
      if (closestId) setSelectedTripId(closestId);
    }
  }, [cameraPermission]);

  const selectedTrip = MOCK_TRIPS.find(t => t.id === selectedTripId);

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
        setFacing(current => (current === 'back' ? 'front' : 'back'));
        await new Promise(r => setTimeout(r, 600));
        const photo2 = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setImages([photo1.uri, photo2.uri]);
      } else {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setImages([photo.uri]);
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
        setImages(result.assets.map(a => a.uri)); 
      }
    } catch (error) {
      Alert.alert("Unavailable", "Cannot open library.");
    }
  };

  const handlePost = () => {
    if (!selectedTripId) {
      Alert.alert("Error", "Please select a trip first.");
      return;
    }
    if (isExpenseMode && !expenseAmount) {
      Alert.alert("Missing Amount", "Please enter valid amount to create an expense.");
      return;
    }
    
    // Simulate successful save
    Alert.alert("Success", "Moment added successfully!", [
       {text: "OK", onPress: () => router.back()}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* TOP CAMERA / IMAGE SECTION (Split Screen) */}
      <View style={styles.cameraSection}>
        {images.length > 0 ? (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: images[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            {images.length > 1 && (
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
          <TouchableOpacity onPress={() => images.length > 0 ? setImages([]) : router.back()} style={styles.iconCircle}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          {!images.length && (
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
        </SafeAreaView>

        {/* Bottom Controls Overlay (Shutter) */}
        <View style={styles.shutterContainer}>
          {images.length > 0 ? (
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
             <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900' }}>Add Details</Text>
             <TouchableOpacity 
               style={[styles.expenseToggleBtn, isExpenseMode && {backgroundColor: '#F59E0B'}]} 
               onPress={() => setIsExpenseMode(!isExpenseMode)}
             >
               <Receipt size={16} color={isExpenseMode ? '#000' : '#FFF'} />
               <Text style={{color: isExpenseMode ? '#000' : '#FFF', fontWeight: '800', fontSize: 12}}>
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
               {MOCK_TRIPS.map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.tripDropdownItem, selectedTripId === t.id && {backgroundColor: 'rgba(255,200,0,0.1)'}]}
                    onPress={() => { setSelectedTripId(t.id); setShowTripSelector(false); }}
                  >
                    <Text style={[styles.tripDropdownTitle, selectedTripId === t.id && {color: '#FFC800'}]}>{t.title}</Text>
                    <Text style={styles.tripDropdownDates}>{t.startDate}</Text>
                  </TouchableOpacity>
               ))}
            </View>
          )}

          {/* Content Input */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
             <Text style={[styles.fieldLabel, { color: '#8C8C8C' }]}>What was this for?</Text>
             <TextInput
               style={{ fontSize: 18, fontWeight: '600', color: '#1C1917', minHeight: 40 }}
               placeholder="E.g., Dinner at the bay"
               placeholderTextColor="#D0D0D0"
               multiline
               value={content}
               onChangeText={setContent}
             />
          </View>

          {isExpenseMode && (
            <View style={{ backgroundColor: '#292524', borderRadius: 32, padding: 20, marginBottom: 16 }}>
               <Text style={[styles.fieldLabel, {color: '#A8A29E'}]}>Total Price</Text>
               <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>₫</Text>
                  <TextInput 
                    style={styles.amountInput}
                    keyboardType="numeric" 
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={formatCurrency(expenseAmount)} 
                    onChangeText={(v) => setExpenseAmount(v.replace(/[^0-9]/g, ''))} 
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

        </ScrollView>

        {/* Sticky Confirm Button */}
        <View style={styles.stickyConfirmWrapper}>
          <TouchableOpacity 
            style={styles.stickyConfirmBtn}
            onPress={handlePost}
          >
             <Check color="#1C1917" size={32} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1917' },
  cameraSection: { height: '55%', width: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
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

  expenseToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, color: '#A8A29E', textTransform: 'uppercase' },
  
  tripSelectorBtn: { backgroundColor: '#292524', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tripIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,200,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  tripSelectorTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  tripSelectorSubtitle: { color: '#A8A29E', fontSize: 12, fontWeight: '600' },
  tripDropdown: { backgroundColor: '#292524', borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tripDropdownItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  tripDropdownTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  tripDropdownDates: { color: '#A8A29E', fontSize: 12, fontWeight: '600' },

  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 20 },
  currencySymbol: { fontSize: 24, fontWeight: '900', color: '#F59E0B', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '900', color: '#FFF' },
  
  paidByActivePill: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByActiveText: { color: '#000', fontSize: 13, fontWeight: '800' },
  paidByInactivePill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByInactiveText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  
  membersList: { gap: 12 },
  splitUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FFC800' },
  splitUserRowDisabled: { borderColor: 'transparent' },
  checkCircleActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkCircleInactive: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  splitUserName: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  splitUserAmount: { fontSize: 16, fontWeight: '900', color: '#FDE047', textAlign: 'right' },

  stickyConfirmWrapper: { position: 'absolute', bottom: 30, right: 24 },
  stickyConfirmBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC800', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC800', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 12 }
});
