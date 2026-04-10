import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { Plus, X, Calendar as CalendarIcon, ArrowLeft, Mail, UserPlus, Trash2, ChevronRight, MapPin } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyTripsScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // Wizard States
  const [step, setStep] = useState<1 | 2>(1);
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');

  const handleNext = () => {
    setStep(2);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-16 pb-4 px-6 flex-row justify-between items-start bg-background">
        <View>
          <Text className="text-4xl font-extrabold text-text mb-1">My Trips</Text>
          <Text className="text-base text-muted font-medium">Your upcoming and past adventures.</Text>
        </View>
        <TouchableOpacity 
          style={{ backgroundColor: '#FFC800', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFC800', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
          onPress={() => {
             setStep(1);
             setModalVisible(true);
          }}
        >
          <Plus size={28} color="#1C1917" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Trip List */}
        {/* Trip List - Next Gen Style */}
        <View style={{ gap: 24, marginTop: 16 }}>
          
          {/* Card 1: Summer in Bali */}
          <TouchableOpacity 
            style={styles.genzCard}
            activeOpacity={0.95}
            onPress={() => router.push('/trip/1')}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.genzCardImage}
            />
            
            <View style={styles.genzCardTopRight}>
               <View style={styles.statusBadge}>
                 <MapPin size={12} color="#1C1917" />
                 <Text style={styles.statusBadgeText}>UPCOMING</Text>
               </View>
            </View>

            {/* Frosted White Info Panel */}
            <View style={styles.glassPanel}>
               <View style={{ flex: 1, paddingRight: 16 }}>
                 <Text style={styles.genzTitle}>Summer in Bali</Text>
                 <View style={styles.genzMetaRow}>
                   <CalendarIcon size={14} color="#78716C" />
                   <Text style={styles.genzDates}>Apr 9 - Apr 10, 2026</Text>
                 </View>
               </View>
               <View style={styles.genzAvatars}>
                 <View style={styles.genzAvatarCircle}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }} style={styles.avatarImage} />
                 </View>
               </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Demo */}
          <TouchableOpacity 
            style={styles.genzCard}
            activeOpacity={0.95}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.genzCardImage}
            />
            
            <View style={styles.glassPanel}>
               <View style={{ flex: 1, paddingRight: 16 }}>
                 <Text style={styles.genzTitle}>Demo Trip</Text>
                 <View style={styles.genzMetaRow}>
                   <CalendarIcon size={14} color="#78716C" />
                   <Text style={styles.genzDates}>Dates TBD</Text>
                 </View>
               </View>
               <View style={styles.genzAvatars}>
                 <View style={[styles.genzAvatarCircle, { zIndex: 2 }]}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' }} style={styles.avatarImage} />
                 </View>
                 <View style={[styles.genzAvatarCircle, styles.genzAvatarMore, { zIndex: 1 }]}>
                    <Text style={styles.genzAvatarText}>+3</Text>
                 </View>
               </View>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Centered Modal for New Adventure */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-4">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            className="w-full"
          >
            <View className="bg-surface w-full rounded-[32px] p-6 shadow-lg">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center gap-3">
                  {step === 2 && (
                    <TouchableOpacity 
                      className="w-8 h-8 rounded-full bg-background items-center justify-center"
                      onPress={() => setStep(1)}
                    >
                      <ArrowLeft size={18} color="#1C1917" />
                    </TouchableOpacity>
                  )}
                  <Text className="text-2xl font-bold text-text">
                    {step === 1 ? 'New Adventure' : 'Invite Crew'}
                  </Text>
                </View>

                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-background items-center justify-center"
                  onPress={() => setModalVisible(false)}
                >
                  <X size={18} color="#1C1917" />
                </TouchableOpacity>
              </View>

              {step === 1 ? (
                <>
                  {/* Trip Title Field */}
                  <View className="mb-5">
                    <Text className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Trip Title</Text>
                    <View className="bg-background rounded-2xl px-4 py-4 border border-[#F0F0F0]">
                      <TextInput 
                        placeholder="e.g. Summer in Bali"
                        placeholderTextColor="#A8A29E"
                        className="text-base text-text font-medium"
                      />
                    </View>
                  </View>

                  {/* Start & End Dates */}
                  <View className="flex-row gap-4 mb-8">
                    {/* Start Date */}
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Start Date</Text>
                      <TouchableOpacity 
                        className="bg-background rounded-2xl px-4 py-4 border border-[#F0F0F0] flex-row items-center justify-between"
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Text className="text-base text-text font-medium">
                          {startDate.toLocaleDateString('en-GB')}
                        </Text>
                        <CalendarIcon size={18} color="#A8A29E" />
                      </TouchableOpacity>
                      
                      {/* Android inline modal */}
                      {showStartPicker && Platform.OS === 'android' && (
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) => {
                            setShowStartPicker(false);
                            if (date) setStartDate(date);
                          }}
                        />
                      )}
                      
                      {/* iOS Bottom Sheet style modal for date picker */}
                      {showStartPicker && Platform.OS === 'ios' && (
                        <Modal transparent animationType="slide" visible={showStartPicker}>
                          <View className="flex-1 justify-end bg-black/40">
                            <View className="bg-surface rounded-t-3xl p-6 pb-10">
                               <View className="flex-row justify-between items-center mb-4">
                                 <Text className="text-xl font-bold text-text">Select Start Date</Text>
                                 <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                                   <Text className="text-primary font-bold text-base">Done</Text>
                                 </TouchableOpacity>
                               </View>
                               <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="spinner"
                                textColor="#1C1917"
                                onChange={(event, date) => {
                                  if (date) setStartDate(date);
                                }}
                              />
                            </View>
                          </View>
                        </Modal>
                      )}
                    </View>

                    {/* End Date */}
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">End Date</Text>
                      <TouchableOpacity 
                        className="bg-background rounded-2xl px-4 py-4 border border-[#F0F0F0] flex-row items-center justify-between"
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Text className="text-base text-text font-medium">
                          {endDate.toLocaleDateString('en-GB')}
                        </Text>
                        <CalendarIcon size={18} color="#A8A29E" />
                      </TouchableOpacity>

                      {/* Android inline modal */}
                      {showEndPicker && Platform.OS === 'android' && (
                        <DateTimePicker
                          value={endDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) => {
                            setShowEndPicker(false);
                            if (date) setEndDate(date);
                          }}
                        />
                      )}
                      
                      {/* iOS Bottom Sheet style modal for date picker */}
                      {showEndPicker && Platform.OS === 'ios' && (
                        <Modal transparent animationType="slide" visible={showEndPicker}>
                          <View className="flex-1 justify-end bg-black/40">
                            <View className="bg-surface rounded-t-3xl p-6 pb-10">
                               <View className="flex-row justify-between items-center mb-4">
                                 <Text className="text-xl font-bold text-text">Select End Date</Text>
                                 <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                                   <Text className="text-primary font-bold text-base">Done</Text>
                                 </TouchableOpacity>
                               </View>
                               <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="spinner"
                                textColor="#1C1917"
                                onChange={(event, date) => {
                                  if (date) setEndDate(date);
                                }}
                              />
                            </View>
                          </View>
                        </Modal>
                      )}
                    </View>
                  </View>

                  {/* Primary Action Button */}
                  <TouchableOpacity 
                    className="bg-primary py-4 rounded-2xl items-center shadow-sm"
                    onPress={handleNext}
                  >
                    <Text className="text-white font-bold text-base">Next: Add Members</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Step 2: Add Members UI */}
                  <Text className="text-sm text-muted mb-4 font-medium">
                    Invite travel companions via email to share expenses and memories.
                  </Text>

                  {/* Input Field */}
                  <View className="mb-2">
                    <View className={`bg-background rounded-2xl px-4 py-1 border flex-row items-center ${emailError ? 'border-red-400' : 'border-[#F0F0F0]'}`}>
                      <Mail size={18} color={emailError ? "#F87171" : "#A8A29E"} />
                      <TextInput 
                        placeholder="friend@email.com"
                        placeholderTextColor="#A8A29E"
                        className="text-base text-text font-medium flex-1 h-12 ml-3"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={emailInput}
                        onChangeText={(t) => {
                           setEmailInput(t);
                           if (emailError) setEmailError('');
                        }}
                        onSubmitEditing={handleAddMember}
                      />
                      <TouchableOpacity 
                         className="bg-primary/10 w-9 h-9 rounded-xl items-center justify-center ml-2"
                         onPress={handleAddMember}
                      >
                         <Plus size={18} color="#FFC800" />
                      </TouchableOpacity>
                    </View>
                    {/* Error Prompt */}
                    {!!emailError && (
                      <Text className="text-red-500 text-xs mt-2 ml-1 font-semibold">{emailError}</Text>
                    )}
                  </View>

                  {/* Member List */}
                  <View className="h-32 mt-4 mb-6">
                    <ScrollView showsVerticalScrollIndicator={false}>
                       <View className="flex-row flex-wrap gap-2">
                         {members.length === 0 ? (
                           <Text className="text-sm text-muted italic mt-2 ml-1">No members added yet.</Text>
                         ) : (
                           members.map((email, idx) => (
                             <View key={idx} className="bg-background border border-[#E5E5E5] rounded-full px-3 py-2 flex-row items-center gap-2">
                               <View className="bg-primary/20 w-6 h-6 rounded-full items-center justify-center">
                                  <Text className="text-[10px] text-primary font-black uppercase">{email.substring(0, 1)}</Text>
                               </View>
                               <Text className="text-sm font-semibold text-text">{email}</Text>
                               <TouchableOpacity onPress={() => removeMember(email)} className="ml-1 p-1 bg-[#F0F0F0] rounded-full">
                                 <X size={12} color="#1C1917" />
                               </TouchableOpacity>
                             </View>
                           ))
                         )}
                       </View>
                    </ScrollView>
                  </View>

                  {/* Primary Action Button */}
                  <TouchableOpacity 
                    className="bg-primary py-4 rounded-2xl items-center shadow-sm"
                    onPress={() => {
                       // Logic to save trip and members
                       setModalVisible(false);
                       setStep(1);
                       setMembers([]);
                       // Navigate directly to the Trip detail screen
                       router.push('/trip/1');
                    }}
                  >
                    <Text className="text-white font-bold text-base">Create Adventure</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  genzCard: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  genzCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  genzCardTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 0, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: 1,
  },
  glassPanel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  genzTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1917',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  genzMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genzDates: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
  },
  genzAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genzAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF', // Light border for elegant look
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  genzAvatarMore: {
    backgroundColor: '#FFC800',
    marginLeft: -10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genzAvatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1C1917',
  },
});
