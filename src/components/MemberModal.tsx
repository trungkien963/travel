import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { Member } from '../types/expense';

const { height } = Dimensions.get('window');

interface MemberModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  initialMember?: Member | null;
}

export function MemberModal({ visible, onClose, onSave, initialMember }: MemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialMember) {
        setName(initialMember.name || '');
        setEmail(initialMember.email || '');
        setPhone(initialMember.phone || '');
      } else {
        setName('');
        setEmail('');
        setPhone('');
      }
    }
  }, [visible, initialMember]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for the member.');
      return;
    }
    
    onSave({
      id: initialMember?.id || 'm' + Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      isMe: initialMember?.isMe, // Preserve if editing the Host themselves
    });
    
    // Close & reset handled by parent / effect
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{initialMember ? 'Edit Member' : 'Add New Member'}</Text>
              <TouchableOpacity onPress={onClose}><X size={24} color="#A8A29E" /></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="e.g. John Doe" 
              placeholderTextColor="#D4D4D4" 
              value={name} 
              onChangeText={setName} 
            />

            <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="e.g. john@example.com" 
              placeholderTextColor="#D4D4D4" 
              keyboardType="email-address"
              autoCapitalize="none"
              value={email} 
              onChangeText={setEmail} 
            />

            <Text style={styles.fieldLabel}>PHONE NUMBER (OPTIONAL)</Text>
            <TextInput 
              style={[styles.textInput, {marginBottom: 40}]} 
              placeholder="e.g. +84 123 456 789" 
              placeholderTextColor="#D4D4D4" 
              keyboardType="phone-pad"
              value={phone} 
              onChangeText={setPhone} 
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{initialMember ? 'Save Changes' : 'Add Member'}</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentWrapper: { width: '100%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917' },
  
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#A8A29E', letterSpacing: 1, marginBottom: 12 },
  textInput: { backgroundColor: '#FBFBFB', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1C1917', marginBottom: 24 },
  
  saveBtn: { backgroundColor: '#FFC800', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
