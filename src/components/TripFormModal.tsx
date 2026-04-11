import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { Plus, X, Calendar as CalendarIcon, ArrowLeft, Mail, Image as ImageIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaToSupabase } from '../lib/supabase';

interface TripFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (tripData: any) => void;
  initialData?: any; // If provided, we are in Edit mode
}

export function TripFormModal({ visible, onClose, onSave, initialData }: TripFormModalProps) {
  const isEditing = !!initialData;
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1473496169904-6a58eb22bf2f?q=80&w=1000');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Hydrate form when initialData changes or modal opens
  useEffect(() => {
    if (visible && initialData) {
      setTitle(initialData.title || '');
      setCoverImage(initialData.coverImage || 'https://images.unsplash.com/photo-1473496169904-6a58eb22bf2f?q=80&w=1000');
      
      const parseDateString = (dateStr: string) => {
        if (!dateStr) return new Date();
        const parts = dateStr.trim().split(" ");
        if (parts.length === 2 || parts.length === 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIndex = months.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
            const day = parseInt(parts[1], 10);
            if (monthIndex !== -1 && !isNaN(day)) {
                return new Date(new Date().getFullYear(), monthIndex, day);
            }
        }
        let d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
      };

      setStartDate(parseDateString(initialData.startDate));
      setEndDate(parseDateString(initialData.endDate));
      if (initialData.members && Array.isArray(initialData.members)) {
        setMembers(initialData.members.map((m: any) => m.name || m.email || "Unknown"));
      } else {
        setMembers(['You (Edric)']);
      }
    } else if (visible && !initialData) {
      // Reset form
      setTitle('');
      setCoverImage('https://images.unsplash.com/photo-1473496169904-6a58eb22bf2f?q=80&w=1000');
      setStartDate(new Date());
      setEndDate(new Date());
      setMembers(['You (Edric)']);
      setStep(1);
    }
  }, [visible, initialData]);

  const formatDateDisplay = (d: Date) => {
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString('en-GB'); // Fallback to DD/MM/YYYY
    }
    return d.toLocaleDateString('en-GB'); // Returns DD/MM/YYYY
  };

  const handleImageSelection = () => {
    Alert.alert(
      "Cover Image",
      "Set the vibe for your trip!",
      [
        {
          text: "Snap a Photo",
          onPress: async () => {
             const { status } = await ImagePicker.requestCameraPermissionsAsync();
             if (status !== 'granted') return Alert.alert('Permission needed', 'We need camera access.');
             let result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
             });
             if (!result.canceled) setCoverImage(result.assets[0].uri);
          }
        },
        {
          text: "Choose from Camera Roll",
          onPress: async () => {
             let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
             });
             if (!result.canceled) setCoverImage(result.assets[0].uri);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let finalCoverUrl = coverImage;
    if (coverImage.startsWith('file://')) {
       try {
         finalCoverUrl = await uploadMediaToSupabase(coverImage);
       } catch (e) {
         Alert.alert('Upload Failed', 'Could not upload cover image. Proceeding with existing.');
       }
    }
    
    onSave({
      title,
      coverImage: finalCoverUrl,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      members
    });
    setIsSaving(false);
    onClose();
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddMember = () => {
    setEmailError('');
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Invalid email format.');
      return;
    }
    if (members.includes(trimmedEmail)) {
      setEmailError('Email already added.');
      return;
    }

    setMembers([trimmedEmail, ...members]);
    setEmailInput('');
  };

  const removeMember = (emailToRemove: string) => {
    setMembers(members.filter(email => email !== emailToRemove));
  };

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, padding: 24, paddingTop: Platform.OS === 'ios' ? 24 : 48 }}>
          {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {step === 2 && (
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }} onPress={() => setStep(1)}>
                    <ArrowLeft size={18} color="#1C1917" />
                  </TouchableOpacity>
                )}
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#1C1917' }}>
                  {isEditing ? (step === 1 ? 'Edit Adventure' : 'Edit Crew') : (step === 1 ? 'New Adventure' : 'Invite Crew')}
                </Text>
              </View>
              <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
                <X size={18} color="#1C1917" />
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Cover Image */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Cover Image</Text>
                  <TouchableOpacity onPress={handleImageSelection} style={{ width: '100%', height: 140, borderRadius: 16, backgroundColor: '#F5F5F5', overflow: 'hidden', position: 'relative' }}>
                    <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} />
                    <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(28,25,23,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                       <ImageIcon size={14} color="#FFF" />
                       <Text style={{color: '#FFF', fontSize: 12, fontWeight: '700'}}>Edit Cover</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Trip Title</Text>
                  <View style={{ backgroundColor: '#FBFBFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0' }}>
                    <TextInput 
                      placeholder="e.g. Summer in Bali"
                      placeholderTextColor="#A8A29E"
                      style={{ fontSize: 16, color: '#1C1917', fontWeight: '600' }}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                </View>

                {/* Dates */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Start Date</Text>
                    <TouchableOpacity style={{ backgroundColor: '#FBFBFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => setShowStartPicker(true)}>
                      <Text style={{ fontSize: 16, color: '#1C1917', fontWeight: '600' }}>{formatDateDisplay(startDate)}</Text>
                      <CalendarIcon size={18} color="#A8A29E" />
                    </TouchableOpacity>
                    {showStartPicker && Platform.OS === 'android' && (
                      <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />
                    )}
                    {showStartPicker && Platform.OS === 'ios' && (
                      <Modal transparent animationType="slide">
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                              <Text style={{ fontSize: 20, fontWeight: '800' }}>Start Date</Text>
                              <TouchableOpacity onPress={() => setShowStartPicker(false)}><Text style={{ color: '#FFC800', fontWeight: '800', fontSize: 16 }}>Done</Text></TouchableOpacity>
                            </View>
                            <DateTimePicker value={startDate} mode="date" display="spinner" textColor="#1C1917" onChange={(e, d) => { if(d) setStartDate(d); }} />
                          </View>
                        </View>
                      </Modal>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#A8A29E', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>End Date</Text>
                    <TouchableOpacity style={{ backgroundColor: '#FBFBFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => setShowEndPicker(true)}>
                      <Text style={{ fontSize: 16, color: '#1C1917', fontWeight: '600' }}>{formatDateDisplay(endDate)}</Text>
                      <CalendarIcon size={18} color="#A8A29E" />
                    </TouchableOpacity>
                    {showEndPicker && Platform.OS === 'android' && (
                      <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />
                    )}
                    {showEndPicker && Platform.OS === 'ios' && (
                      <Modal transparent animationType="slide">
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                              <Text style={{ fontSize: 20, fontWeight: '800' }}>End Date</Text>
                              <TouchableOpacity onPress={() => setShowEndPicker(false)}><Text style={{ color: '#FFC800', fontWeight: '800', fontSize: 16 }}>Done</Text></TouchableOpacity>
                            </View>
                            <DateTimePicker value={endDate} mode="date" display="spinner" textColor="#1C1917" onChange={(e, d) => { if(d) setEndDate(d); }} />
                          </View>
                        </View>
                      </Modal>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={{ backgroundColor: '#FFC800', padding: 16, borderRadius: 16, alignItems: 'center' }} onPress={handleNext}>
                  <Text style={{ color: '#1C1917', fontWeight: '800', fontSize: 16 }}>Next: Crew Selection</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 14, color: '#78716C', fontWeight: '600', marginBottom: 16 }}>
                  Invite travel companions via email to share expenses and memories.
                </Text>
                
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBFBFB', borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: emailError ? '#DC2626' : '#F0F0F0' }}>
                    <Mail size={18} color={emailError ? "#DC2626" : "#A8A29E"} />
                    <TextInput 
                      placeholder="friend@email.com"
                      placeholderTextColor="#A8A29E"
                      style={{ flex: 1, height: 48, marginLeft: 12, fontSize: 16, color: '#1C1917', fontWeight: '600' }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={emailInput}
                      onChangeText={(t) => { setEmailInput(t); if(emailError) setEmailError(''); }}
                      onSubmitEditing={handleAddMember}
                    />
                    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 200, 0, 0.2)', alignItems: 'center', justifyContent: 'center' }} onPress={handleAddMember}>
                      <Plus size={18} color="#FFC800" />
                    </TouchableOpacity>
                  </View>
                  {!!emailError && <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 8, fontWeight: '600' }}>{emailError}</Text>}
                </View>

                <View style={{ height: 120, marginBottom: 24 }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {members.length === 0 ? (
                        <Text style={{ fontSize: 14, color: '#A8A29E', fontStyle: 'italic', marginTop: 8 }}>No members added yet.</Text>
                      ) : (
                        members.map((email, idx) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 12 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,200,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: '#FFC800', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{email.substring(0,1)}</Text>
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1917' }}>{email}</Text>
                            <TouchableOpacity onPress={() => removeMember(email)} style={{ backgroundColor: '#F5F5F5', padding: 4, borderRadius: 12 }}>
                              <X size={12} color="#1C1917" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
                </View>
                
                <TouchableOpacity disabled={isSaving} style={{ backgroundColor: '#FFC800', padding: 16, borderRadius: 16, alignItems: 'center' }} onPress={handleSave}>
                  <Text style={{ color: '#1C1917', fontWeight: '800', fontSize: 16 }}>{isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Adventure')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
    </Modal>
  );
}
