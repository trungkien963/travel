import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StyleSheet, Image, Alert } from 'react-native';
import { Plus, X, Calendar as CalendarIcon, ArrowLeft, Mail, UserPlus, Trash2, ChevronRight, MapPin, Search, Image as ImageIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTravelStore } from '../../src/store/useTravelStore';
import { useLocationSearch, LocationResult } from '../../src/hooks/useLocationSearch';
import { supabase } from '../../src/lib/supabase';

export default function MyTripsScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });
  }, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const handleImageSelection = () => {
    Alert.alert(
      "Cover Image",
      "Set the vibe for your trip!",
      [
        {
          text: "Snap a Photo",
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'We need camera access to snap a photo.');
                return;
              }
              let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });
              if (!result.canceled) {
                setCoverImage(result.assets[0].uri);
              }
            } catch (error: any) {
              Alert.alert('Camera Error', error?.message || 'Camera is not available on this device/simulator.');
            }
          }
        },
        {
          text: "Choose from Camera Roll",
          onPress: async () => {
            try {
              let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });
              if (!result.canceled) {
                setCoverImage(result.assets[0].uri);
              }
            } catch (error: any) {
              Alert.alert('Gallery Error', error?.message || 'Cannot access photo gallery.');
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Location Autocomplete
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const { query, setQuery, results, isSearching } = useLocationSearch();

  const { trips, addTrip } = useTravelStore();
  
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
          {trips.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#A8A29E', fontSize: 16 }}>No trips yet. Start an adventure!</Text>
            </View>
          ) : (
            trips.map(t => (
              <TouchableOpacity 
                key={t.id}
                style={styles.genzCard}
                activeOpacity={0.95}
                onPress={() => router.push(`/trip/${t.id}`)}
              >
                <Image 
                  source={{ uri: t.coverImage || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000' }} 
                  style={styles.genzCardImage}
                />
                
                <View style={styles.genzCardTopRight}>
                   <View style={styles.statusBadge}>
                     <MapPin size={12} color="#1C1917" />
                     <Text style={styles.statusBadgeText}>
                        {new Date(t.startDate) > new Date() ? 'UPCOMING' : 'ONGOING'}
                     </Text>
                   </View>
                </View>

                {/* Frosted White Info Panel */}
                <View style={styles.glassPanel}>
                   <View style={{ flex: 1, paddingRight: 16 }}>
                     <Text style={styles.genzTitle}>{t.title}</Text>
                     <View style={styles.genzMetaRow}>
                       <CalendarIcon size={14} color="#78716C" />
                       <Text style={styles.genzDates}>{t.startDate} - {t.endDate}</Text>
                     </View>
                   </View>
                   <View style={styles.genzAvatars}>
                     {t.members && t.members.slice(0, 3).map((m: any, idx: number) => (
                       <View key={m.id} style={[styles.genzAvatarCircle, { marginLeft: idx > 0 ? -12 : 0, zIndex: 10 - idx }]}>
                         {m.avatar ? (
                           <Image source={{ uri: m.avatar }} style={styles.avatarImage} />
                         ) : (
                           <View style={{width: '100%', height: '100%', backgroundColor: '#FFC800', alignItems: 'center', justifyContent: 'center'}}>
                             <Text style={{color: '#1C1917', fontSize: 12, fontWeight: 'bold'}}>{m.name.charAt(0).toUpperCase()}</Text>
                           </View>
                         )}
                       </View>
                     ))}
                     {t.members && t.members.length === 0 && (
                       <View style={styles.genzAvatarCircle}>
                         <View style={{width: '100%', height: '100%', backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center'}}>
                            <Text style={{color: '#A8A29E', fontSize: 10, fontWeight: 'bold'}}>ME</Text>
                         </View>
                       </View>
                     )}
                   </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
                  {/* Huge Edge-to-Edge Cover Image Header */}
                  <TouchableOpacity 
                    onPress={handleImageSelection}
                    className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden items-center justify-center mb-6 relative"
                  >
                    {coverImage ? (
                      <>
                        <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} />
                        <View className="absolute bottom-3 right-3 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center">
                          <ImageIcon size={14} color="#FFF" />
                          <Text className="text-white text-xs font-bold ml-1">Retake</Text>
                        </View>
                      </>
                    ) : (
                      <View className="items-center">
                        <View className="w-14 h-14 bg-white/80 rounded-full items-center justify-center shadow-sm mb-2">
                          <ImageIcon size={28} color="#FFC800" />
                        </View>
                        <Text className="text-base font-bold text-text">Add a Vibe Check</Text>
                        <Text className="text-sm text-muted">Tap to set trip cover</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Borderless Title Field */}
                  <View className="mb-6 border-b border-gray-100 pb-2">
                    <TextInput 
                      placeholder="Where to next?"
                      placeholderTextColor="#D4D4D4"
                      className="text-4xl font-black text-text tracking-tighter"
                      value={tripTitle}
                      onChangeText={setTripTitle}
                    />
                  </View>

                  {/* Seamless Destination Search */}
                  <View className="mb-6 border-b border-gray-100 pb-4">
                    {selectedLocation ? (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <MapPin size={24} color="#1C1917" className="mr-3" />
                          <View>
                            <Text className="text-xl font-bold text-text tracking-tight">{selectedLocation.name}</Text>
                            <Text className="text-sm text-muted">{selectedLocation.city}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => { setSelectedLocation(null); setQuery(''); }} className="bg-gray-100 p-2 rounded-full">
                           <X size={18} color="#1C1917" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row items-center">
                          <Search size={22} color="#D4D4D4" className="mr-3" />
                          <TextInput
                            className="flex-1 text-xl font-bold text-text tracking-tight"
                            placeholder="Search city..."
                            placeholderTextColor="#D4D4D4"
                            value={query}
                            onChangeText={setQuery}
                          />
                        </View>
                        
                        {isSearching && <Text className="text-sm text-text font-medium mt-3 ml-8">Searching Map...</Text>}
                        
                        {results.length > 0 && (
                          <View className="mt-3 ml-8">
                            {results.map((r) => (
                              <TouchableOpacity 
                                key={r.placeId} 
                                className="py-3 border-b border-gray-50"
                                onPress={() => setSelectedLocation(r)}
                              >
                                <Text className="text-base font-bold text-text">{r.name}</Text>
                                <Text className="text-xs text-muted mt-0.5">{r.address}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Bubble Dates Selection */}
                  <View className="flex-row justify-between mb-8 gap-4">
                    <TouchableOpacity 
                      className="flex-1 bg-gray-50 rounded-2xl p-4 items-center border border-gray-100 shadow-sm"
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">From</Text>
                      <Text className="text-lg font-black text-text">{startDate.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 bg-gray-50 rounded-2xl p-4 items-center border border-gray-100 shadow-sm"
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">To</Text>
                      <Text className="text-lg font-black text-text">{endDate.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Android Date Pickers */}
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


                  {/* Primary Action Button */}
                  <TouchableOpacity 
                    className="bg-[#FFC800] py-4 rounded-2xl items-center shadow-sm"
                    onPress={handleNext}
                  >
                    <Text className="text-[#1C1917] font-bold text-base">Next: Add Members</Text>
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
                       <View className="flex-row flex-wrap gap-2 items-center">
                         {/* Owner Badge */}
                         <View className="bg-background border border-[#FFC800] rounded-full px-3 py-2 flex-row items-center gap-2">
                           <View className="bg-[#FFC800] w-6 h-6 rounded-full items-center justify-center">
                              <Text className="text-[10px] text-white font-black uppercase">ME</Text>
                           </View>
                           <Text className="text-sm font-semibold text-text">You (Owner)</Text>
                         </View>

                         {members.length === 0 ? (
                           <Text className="text-sm text-muted italic ml-1">No other members added.</Text>
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
                    className="bg-[#FFC800] py-4 rounded-2xl items-center shadow-sm"
                    onPress={() => {
                       const newTripId = 't' + Date.now().toString();
                       const ownerMember = {
                         id: currentUser?.id || 'm1',
                         name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Me',
                         email: currentUser?.email,
                         isMe: true,
                         avatar: currentUser?.user_metadata?.avatar_url
                       };

                       const guestMembers = members.map((email, idx) => ({
                         id: `guest-${idx}`,
                         name: email.split('@')[0],
                         email: email,
                         isMe: false
                       }));

                       addTrip({
                         id: newTripId,
                         title: tripTitle || 'Untitled Trip',
                         coverImage: coverImage || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000',
                         locationName: selectedLocation?.name,
                         locationCity: selectedLocation?.city,
                         startDate: startDate.toISOString().split('T')[0],
                         endDate: endDate.toISOString().split('T')[0],
                         ownerId: ownerMember.id,
                         members: [ownerMember, ...guestMembers],
                         isPrivate: true
                       });
                       setModalVisible(false);
                       setStep(1);
                       setMembers([]);
                       setTripTitle('');
                       // Dừng router.push() để giữ nguyên màn hình My Trips
                       // router.push(`/trip/${newTripId}`);
                    }}
                  >
                    <Text className="text-[#1C1917] font-bold text-base">Create Adventure</Text>
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
