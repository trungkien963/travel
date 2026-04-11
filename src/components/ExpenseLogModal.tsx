import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, SafeAreaView } from 'react-native';
import { X, Image as ImageIcon, Camera as CameraIcon, CheckCircle2, Circle, RefreshCcw, Zap, Coffee, Car, Home, Ticket, ShoppingBag, Folder, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Expense, SplitType, ExpenseCategory, CATEGORY_COLORS } from '../types/expense';


export const getCategoryIcon = (category?: string, size = 20, color = "#FFF") => {
  switch (category) {
    case 'FOOD': return <Coffee size={size} color={color} />;
    case 'TRANSPORT': return <Car size={size} color={color} />;
    case 'HOTEL': return <Home size={size} color={color} />;
    case 'ACTIVITIES': return <Ticket size={size} color={color} />;
    case 'SHOPPING': return <ShoppingBag size={size} color={color} />;
    case 'OTHER':
    default: return <Folder size={size} color={color} />;
  }
};

const { height } = Dimensions.get('window');

interface ExpenseLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
  tripMembers: Member[];
}

const formatCurrency = (val: string) => {
  if (!val) return '0';
  return parseInt(val, 10).toLocaleString('en-US');
};

export function ExpenseLogModal({ visible, onClose, onSave, initialExpense, tripMembers }: ExpenseLogModalProps) {
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('OTHER');
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  
  const [paidBy, setPaidBy] = useState('m1'); 
  const [splitType, setSplitType] = useState<SplitType>('EQUALLY');
  
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  
  // Camera States
  const [isCapturingReceipt, setIsCapturingReceipt] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      if (initialExpense) {
        setExpenseAmount(initialExpense.amount.toString());
        setExpenseDesc(initialExpense.desc);
        setExpenseCategory(initialExpense.category || 'OTHER');
        setReceiptImages(initialExpense.receipts || (initialExpense.receipt ? [initialExpense.receipt] : []));
        setPaidBy(initialExpense.payerId);
        setIsCapturingReceipt(false);
        
        setSplitType('FIXED');
        const newIncluded: Record<string, boolean> = {};
        const newCustoms: Record<string, string> = {};
        tripMembers.forEach(m => {
           const amt = initialExpense.splits?.[m.id] || 0;
           newIncluded[m.id] = amt > 0;
           newCustoms[m.id] = amt.toString();
        });
        setIncludedMembers(newIncluded);
        setCustomSplits(newCustoms);
      } else {
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseCategory('OTHER');
        setReceiptImages([]);
        setSplitType('EQUALLY');
        setPaidBy('m1');
        setCustomSplits({});
        setIncludedMembers(Object.fromEntries(tripMembers.map(m => [m.id, true])));
        
        // Default to Camera mode when creating new
        setIsCapturingReceipt(true);
        if (!cameraPermission?.granted) {
          requestCameraPermission();
        }
      }
    }
  }, [visible, initialExpense, tripMembers]);

  const toggleCameraFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));
  const toggleFlash = () => setFlash(current => (current === 'off' ? 'on' : 'off'));

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setReceiptImages([photo.uri]);
      setIsCapturingReceipt(false);
    } catch (e) {
      Alert.alert("Error", "Could not take picture.");
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
        setReceiptImages(result.assets.map(a => a.uri)); 
        setIsCapturingReceipt(false);
      }
    } catch (error) {
      Alert.alert("Camera Unavailable", "Cannot open library.");
    }
  };

  const handleAmountChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setExpenseAmount(numeric);
  };

  const toggleMemberInclusion = (memberId: string) => {
    setIncludedMembers(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const getCalculatedSplit = (memberId: string) => {
    const total = parseInt(expenseAmount || '0', 10);
    const includedCount = Object.values(includedMembers).filter(Boolean).length;
    
    if (!includedMembers[memberId] || includedCount === 0 || total === 0) return 0;

    if (splitType === 'EQUALLY') {
      return Math.round(total / includedCount);
    }
    if (splitType === 'PERCENT') {
      const p = parseFloat(customSplits[memberId] || '0');
      return Math.round((total * p) / 100);
    }
    if (splitType === 'FIXED') {
      return parseInt(customSplits[memberId] || '0', 10);
    }
    return 0;
  };

  const handleSave = () => {
    if (!expenseAmount || !expenseDesc) {
      Alert.alert('Missing Info', 'Please enter description and amount.');
      return;
    }
    const splitsBreakdown: Record<string, number> = {};
    tripMembers.forEach(m => {
      splitsBreakdown[m.id] = getCalculatedSplit(m.id);
    });

    const expense: Expense = {
      id: initialExpense?.id || Date.now().toString(),
      desc: expenseDesc,
      amount: parseInt(expenseAmount, 10),
      payerId: paidBy,
      date: initialExpense?.date || new Date().toISOString().split('T')[0],
      splits: splitsBreakdown,
      receipts: receiptImages,
      category: expenseCategory,
    };
    onSave(expense);
  };

  const renderSplitInputs = (memberId: string) => {
    if (splitType === 'EQUALLY' || !includedMembers[memberId]) return null;
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <TextInput 
          style={styles.customSplitInput}
          placeholder="0"
          placeholderTextColor="#D4D4D4"
          keyboardType="numeric"
          value={customSplits[memberId] || ''}
          onChangeText={(v) => {
            const numeric = v.replace(/[^0-9]/g, '');
            setCustomSplits(prev => ({...prev, [memberId]: numeric}));
          }}
        />
        <Text style={{fontWeight: '800', marginLeft: 4, color: '#A8A29E', fontSize: 13}}>
          {splitType === 'PERCENT' ? '%' : 'VND'}
        </Text>
      </View>
    );
  };

if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#1C1917' }}>
        {/* TOP CAMERA / IMAGE SECTION (Split Screen) */}
        <View style={{ height: '55%', width: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', backgroundColor: '#000', position: 'relative' }}>
          
          {receiptImages.length > 0 ? (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: receiptImages[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              {receiptImages.length > 1 && (
                <View style={[styles.pipContainer, { top: 100, left: 24 }]}>
                  <Image source={{ uri: receiptImages[1] }} style={styles.pipImage} />
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
            <TouchableOpacity onPress={() => receiptImages.length > 0 ? setReceiptImages([]) : onClose()} style={styles.iconCircle}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            {!receiptImages.length && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.iconCircle} onPress={pickImage}>
                  <ImageIcon color="#FFF" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={toggleCameraFacing}>
                  <RefreshCcw color="#FFF" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>

          {/* Bottom Controls Overlay (Shutter) */}
          <View style={{ position: 'absolute', bottom: 30, alignSelf: 'center' }}>
            {receiptImages.length > 0 ? (
              <TouchableOpacity style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 }} onPress={() => setReceiptImages([])}>
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 24 }}>Log Expense</Text>

            {/* AMOUNT CARD */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
               <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Total Price</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#1C1917', marginRight: 8 }}>₫</Text>
                  <TextInput 
                    style={{ flex: 1, fontSize: 32, fontWeight: '900', color: '#1C1917' }}
                    keyboardType="numeric" 
                    placeholder="0"
                    placeholderTextColor="#D0D0D0"
                    value={formatCurrency(expenseAmount)} 
                    onChangeText={(v) => setExpenseAmount(v.replace(/[^0-9]/g, ''))} 
                  />
               </View>
            </View>

            {/* DESC CARD */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
               <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>What was this for?</Text>
               <TextInput
                 style={{ fontSize: 18, fontWeight: '600', color: '#1C1917', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }}
                 placeholder="E.g., Dinner at the bay"
                 placeholderTextColor="#D0D0D0"
                 value={expenseDesc}
                 onChangeText={setExpenseDesc}
               />
               
               <Text style={{ color: '#8C8C8C', fontSize: 12, fontWeight: '800', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Category</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                 {Object.keys(CATEGORY_COLORS).map((cat) => {
                   const isActive = expenseCategory === cat;
                   const color = CATEGORY_COLORS[cat as ExpenseCategory];
                   return (
                     <TouchableOpacity 
                       key={cat} 
                       onPress={() => setExpenseCategory(cat as ExpenseCategory)}
                       style={[styles.categoryPill, isActive ? {backgroundColor: color, borderColor: color} : {}]}
                     >
                       {getCategoryIcon(cat, 16, isActive ? '#FFF' : color)}
                       <Text style={[styles.categoryPillText, isActive ? {color: '#FFF'} : {color: '#1C1917'}]}>{cat}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </ScrollView>
            </View>

            {/* SPLIT CARD */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginBottom: 16 }}>
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
                       <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', flex: 1}} onPress={() => toggleMemberInclusion(member.id)}>
                          <View style={isIncluded ? styles.checkCircleActive : styles.checkCircleInactive}>
                            {isIncluded ? <CheckCircle2 color="#FFC800" size={16} /> : <Circle color="#D4D4D4" size={16} />}
                          </View>
                          <Text style={[styles.splitUserName, !isIncluded && {textDecorationLine: 'line-through'}]}>{member.name}</Text>
                       </TouchableOpacity>
                       <Text style={[styles.splitUserAmount, !isIncluded && {color: '#D4D4D4'}]}>₫{formatCurrency(getCalculatedSplit(member.id).toString())}</Text>
                     </View>
                   );
                 })}
               </View>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>

          {/* Sticky Confirm Button */}
          <View style={{ position: 'absolute', bottom: 30, right: 24 }}>
            <TouchableOpacity 
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC800', alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC800', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 12 }}
              onPress={handleSave}
            >
               <Check color="#1C1917" size={32} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  pipContainer: { position: 'absolute', width: 90, height: 120, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  pipImage: { width: '100%', height: '100%' },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 12, gap: 6 },
  categoryPillText: { fontSize: 12, fontWeight: '800' },
  
  paidByActivePill: { backgroundColor: '#1C1917', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByActiveText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  paidByInactivePill: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByInactiveText: { color: '#A8A29E', fontSize: 13, fontWeight: '800' },
  
  membersList: { gap: 12 },
  splitUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBFBFB', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  splitUserRowDisabled: { borderColor: 'transparent', backgroundColor: '#FFF' },
  checkCircleActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkCircleInactive: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#F0F0F0' },
  splitUserName: { fontSize: 15, fontWeight: '800', color: '#1C1917' },
  splitUserAmount: { fontSize: 16, fontWeight: '900', color: '#FFC800', textAlign: 'right' },
});
