import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { X, Image as ImageIcon, Camera as CameraIcon, CheckCircle2, Circle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Expense, SplitType } from '../types/expense';
import { MOCK_MEMBERS } from '../constants/mockData';

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
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  
  const [paidBy, setPaidBy] = useState('m1'); 
  const [splitType, setSplitType] = useState<SplitType>('EQUALLY');
  
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  useEffect(() => {
    if (visible) {
      if (initialExpense) {
        setExpenseAmount(initialExpense.amount.toString());
        setExpenseDesc(initialExpense.desc);
        setReceiptImages(initialExpense.receipts || (initialExpense.receipt ? [initialExpense.receipt] : []));
        setPaidBy(initialExpense.payerId);
        
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
        setReceiptImages([]);
        setSplitType('EQUALLY');
        setPaidBy('m1');
        setCustomSplits({});
        setIncludedMembers(Object.fromEntries(tripMembers.map(m => [m.id, true])));
      }
    }
  }, [visible, initialExpense, tripMembers]);

  const pickImage = async (fromCamera: boolean = false) => {
    try {
      if (fromCamera) {
        if (!cameraPermission?.granted) {
          const p = await requestCameraPermission();
          if (!p.granted) {
            Alert.alert("Permission required", "Camera permission is needed to snap a receipt.");
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) { setReceiptImages([...receiptImages, result.assets[0].uri]); }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled) { 
          setReceiptImages([...receiptImages, ...result.assets.map(a => a.uri)]); 
        }
      }
    } catch (error) {
      Alert.alert("Camera Unavailable", "Cannot open the camera on this device or simulator.");
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
      date: initialExpense?.date || new Date().toLocaleDateString('en-GB'),
      splits: splitsBreakdown,
      receipts: receiptImages,
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{initialExpense ? 'Edit Expense' : 'Log New Expense'}</Text>
              <TouchableOpacity onPress={onClose}><X size={24} color="#A8A29E" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
               <Text style={styles.fieldLabel}>RECEIPTS / PHOTOS</Text>
               
               {receiptImages.length > 0 && (
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                    {receiptImages.map((uri, idx) => (
                      <View key={idx} style={{marginRight: 12, position: 'relative'}}>
                         <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                         <TouchableOpacity 
                           style={styles.removeImageBtn}
                           onPress={() => setReceiptImages(receiptImages.filter((_, i) => i !== idx))}
                         >
                           <X size={12} color="#FFF" />
                         </TouchableOpacity>
                      </View>
                    ))}
                 </ScrollView>
               )}

               <View style={{flexDirection: 'row', gap: 12, marginBottom: 32}}>
                 <TouchableOpacity style={styles.photoUploadArea} onPress={() => pickImage(false)}>
                     <ImageIcon size={28} color="#D4D4D4" /><Text style={styles.uploadText}>Library</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.photoUploadArea} onPress={() => pickImage(true)}>
                    <CameraIcon size={28} color="#D4D4D4" /><Text style={styles.uploadText}>Camera</Text>
                 </TouchableOpacity>
               </View>

               <Text style={styles.fieldLabel}>DESCRIPTION</Text>
               <TextInput style={styles.textInput} placeholder="What was this for?" placeholderTextColor="#D4D4D4" value={expenseDesc} onChangeText={setExpenseDesc} />

               <Text style={styles.fieldLabel}>AMOUNT</Text>
               <View style={styles.amountRow}>
                  <View style={styles.currencyPill}><Text style={styles.currencyText}>VND</Text></View>
                  <TextInput 
                    style={styles.amountInput} 
                    keyboardType="numeric" 
                    placeholder="0"
                    placeholderTextColor="#A8A29E"
                    value={formatCurrency(expenseAmount)} 
                    onChangeText={handleAmountChange} 
                  />
               </View>

               <Text style={styles.fieldLabel}>PAID BY</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, paddingBottom: 4 }}>
                  {tripMembers.map(member => (
                    <TouchableOpacity 
                      key={member.id} 
                      style={paidBy === member.id ? styles.paidByActivePill : styles.paidByInactivePill}
                      onPress={() => setPaidBy(member.id)}
                    >
                      <Text style={paidBy === member.id ? styles.paidByActiveText : styles.paidByInactiveText}>
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>

               <View style={styles.splitBetweenRow}>
                  <Text style={styles.fieldLabel}>SPLIT BETWEEN (INVOLVED)</Text>
                  <View style={styles.splitToggleArea}>
                     {(['EQUALLY', 'PERCENT', 'FIXED'] as const).map(type => (
                       <TouchableOpacity 
                         key={type}
                         onPress={() => setSplitType(type)}
                         style={splitType === type ? styles.splitToggleActive : styles.splitToggleInactive}
                       >
                         <Text style={splitType === type ? styles.splitToggleActiveText : styles.splitToggleInactiveText}>
                           {type === 'EQUALLY' ? 'Equally' : type === 'PERCENT' ? '%' : 'Fixed'}
                         </Text>
                       </TouchableOpacity>
                     ))}
                  </View>
               </View>

               <View style={styles.membersList}>
                 {tripMembers.map(member => {
                   const isIncluded = includedMembers[member.id];
                   return (
                     <View key={`split-${member.id}`} style={[styles.splitUserRow, !isIncluded && styles.splitUserRowDisabled]}>
                       <TouchableOpacity style={styles.splitUserLeft} onPress={() => toggleMemberInclusion(member.id)} activeOpacity={0.7}>
                          <View style={isIncluded ? styles.checkCircleActive : styles.checkCircleInactive}>
                            {isIncluded ? <CheckCircle2 color="#059669" size={16} /> : <Circle color="#D4D4D4" size={16} />}
                          </View>
                          <Text style={[styles.splitUserName, !isIncluded && {color: '#A8A29E', textDecorationLine: 'line-through'}]} numberOfLines={1}>
                            {member.name}
                          </Text>
                       </TouchableOpacity>
                       
                       <View style={{alignItems: 'flex-end'}}>
                         {renderSplitInputs(member.id)}
                         <Text style={[styles.splitUserAmount, !isIncluded && {color: '#D4D4D4'}]}>
                           ₫{formatCurrency(getCalculatedSplit(member.id).toString())}
                         </Text>
                       </View>
                     </View>
                   );
                 })}
               </View>

               <TouchableOpacity style={styles.createExpenseBtn} onPress={handleSave}>
                 <Text style={styles.createExpenseBtnText}>{initialExpense ? 'Save Edits' : 'Create Expense'} (₫{formatCurrency(expenseAmount)})</Text>
               </TouchableOpacity>

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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917' },
  
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#A8A29E', letterSpacing: 1, marginBottom: 12 },
  photoUploadArea: { flex: 1, height: 100, borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  uploadText: { color: '#A8A29E', fontSize: 12, fontWeight: '700', marginTop: 8 },
  removeImageBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
  
  textInput: { backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1C1917', marginBottom: 32 },
  
  amountRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  currencyPill: { backgroundColor: '#FBFBFB', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  currencyText: { color: '#059669', fontWeight: '800', fontSize: 16 },
  amountInput: { flex: 1, backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16, fontSize: 18, fontWeight: '800', color: '#1C1917' },

  paidByActivePill: { backgroundColor: '#1C1917', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByActiveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  paidByInactivePill: { backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByInactiveText: { color: '#A8A29E', fontSize: 13, fontWeight: '800' },

  splitBetweenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  splitToggleArea: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 100, padding: 4 },
  splitToggleActive: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
  splitToggleActiveText: { color: '#1C1917', fontSize: 11, fontWeight: '800' },
  splitToggleInactive: { paddingHorizontal: 12, paddingVertical: 6 },
  splitToggleInactiveText: { color: '#A8A29E', fontSize: 11, fontWeight: '800' },

  membersList: { gap: 12, marginBottom: 32 },
  splitUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#059669', padding: 16, borderRadius: 16 },
  splitUserRowDisabled: { borderColor: '#F0F0F0', backgroundColor: '#FFFFFF' },
  splitUserLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkCircleActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkCircleInactive: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  splitUserName: { fontSize: 14, fontWeight: '800', color: '#1C1917', flex: 0.9 },
  splitUserAmount: { fontSize: 16, fontWeight: '900', color: '#059669', marginTop: 4, textAlign: 'right' },
  
  customSplitInput: { width: 60, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#D4D4D4', fontSize: 16, fontWeight: '800', color: '#1C1917', paddingVertical: 2 },

  createExpenseBtn: { backgroundColor: '#059669', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  createExpenseBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
