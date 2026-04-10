import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { Plus, X, Calendar as CalendarIcon, ArrowLeft, Mail, UserPlus, Trash2, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

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
          className="bg-primary w-14 h-14 rounded-2xl items-center justify-center shadow-sm"
          onPress={() => {
             setStep(1);
             setModalVisible(true);
          }}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Trip List */}
        <View className="gap-6 mt-4">
          {/* Card 1: Summer in Bali */}
          <TouchableOpacity 
            className="bg-surface rounded-3xl p-3 flex-row items-center border border-[#F0F0F0] shadow-sm"
            onPress={() => router.push('/trip/1')}
          >
            <View className="w-[84px] h-[84px] rounded-2xl overflow-hidden mr-4">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop' }} 
                className="w-full h-full"
              />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-lg font-bold text-text mb-1">Summer in Bali</Text>
              <View className="flex-row items-center gap-1.5 mb-2">
                <CalendarIcon size={12} color="#A8A29E" />
                <Text className="text-xs text-muted font-medium">Apr 9 - Apr 10</Text>
              </View>
              <View className="w-6 h-6 rounded-full bg-[#F0F0F0] items-center justify-center overflow-hidden border border-[#E5E5E5]">
                 <Text className="text-[12px]">👨‍💼</Text>
              </View>
            </View>
            <View className="pr-3">
              <ChevronRight size={20} color="#D4D4D4" />
            </View>
          </TouchableOpacity>

          {/* Card 2: Demo */}
          <TouchableOpacity 
            className="bg-surface rounded-3xl p-3 flex-row items-center border border-[#F0F0F0] shadow-sm"
          >
            <View className="w-[84px] h-[84px] rounded-2xl overflow-hidden mr-4">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1544485541-11d40a02a8e8?q=80&w=1000&auto=format&fit=crop' }} 
                className="w-full h-full"
              />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-lg font-bold text-text mb-1">Demo</Text>
              <View className="flex-row items-center gap-1.5 mb-2">
                <CalendarIcon size={12} color="#A8A29E" />
                <Text className="text-xs text-muted font-medium">N/A - N/A</Text>
              </View>
              <View className="w-6 h-6 rounded-full bg-[#F0F0F0] items-center justify-center overflow-hidden border border-[#E5E5E5]">
                 <Text className="text-[12px]">👩‍💼</Text>
              </View>
            </View>
            <View className="pr-3">
              <ChevronRight size={20} color="#D4D4D4" />
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
                         <Plus size={18} color="#059669" />
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
