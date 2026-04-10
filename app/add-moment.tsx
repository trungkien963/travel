import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Repeat, Image as ImageIcon, Check, Camera as CameraIcon } from 'lucide-react-native';

export default function AddMomentScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMode, setSplitMode] = useState<'equally' | 'custom'>('equally');

  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = React.useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync();
      if (data && data.uri) {
        setPhoto(data.uri);
      }
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F3E9]">
        <Text className="text-center mb-4">We need your permission to show the camera</Text>
        <TouchableOpacity className="bg-primary px-6 py-3 rounded-full" onPress={requestPermission}>
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1C1917]">
      {/* Top Camera Section */}
      <View className="relative h-[55%] w-full rounded-b-[40px] overflow-hidden bg-black">
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
        ) : (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        )}

        {/* Clean overlay */}
        <View className="absolute inset-0 bg-black/10" pointerEvents="none" />
        
        {/* Top Controls */}
        <View className="absolute top-14 w-full flex-row justify-between px-6">
          <TouchableOpacity 
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          {!photo && (
            <View className="flex-row gap-4">
              <TouchableOpacity 
                className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
              >
                <ImageIcon color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
                onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
              >
                <Repeat color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Capture / Retake Button Overlay */}
        <View className="absolute bottom-8 self-center">
          {photo ? (
            <TouchableOpacity 
              className="bg-black/60 px-6 py-3 rounded-full backdrop-blur-md"
              onPress={() => setPhoto(null)}
            >
              <Text className="text-white font-bold tracking-widest uppercase">Retake</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              className="w-20 h-20 rounded-full border-4 border-white/80 items-center justify-center"
              onPress={takePicture}
            >
               <View className="w-16 h-16 rounded-full bg-white opacity-80" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Expense Sheet */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-white font-bold text-3xl mb-8">Add Details</Text>

        {/* Amount Input */}
        <View className="bg-white rounded-[32px] p-6 mb-4 shadow-sm relative">
           <Text className="text-[#8C8C8C] text-sm font-semibold mb-2 uppercase tracking-widest">Total Price</Text>
           <View className="flex-row items-center border-b border-gray-100 pb-2">
             <Text className="text-3xl font-bold text-[#1E1E1E] mr-1">$</Text>
             <TextInput 
               className="text-4xl font-bold text-[#1E1E1E] flex-1 h-16"
               keyboardType="decimal-pad"
               placeholder="0.00"
               placeholderTextColor="#D0D0D0"
               value={amount}
               onChangeText={setAmount}
             />
           </View>
        </View>

        {/* Description Input */}
        <View className="bg-white rounded-[32px] p-6 mb-4">
           <Text className="text-[#8C8C8C] text-sm font-semibold mb-2 uppercase tracking-widest">What was this for?</Text>
           <TextInput 
              className="text-lg text-[#1E1E1E] h-12 border-b border-gray-100"
              placeholder="E.g., Dinner at the bay"
              value={description}
              onChangeText={setDescription}
           />
        </View>

        {/* Split Logic */}
        <View className="bg-white rounded-[32px] p-6 mb-8 flex-row justify-between items-center">
           <View>
             <Text className="text-[#8C8C8C] text-sm font-semibold mb-1 uppercase tracking-widest">Split Mode</Text>
             <Text className="text-lg font-bold text-[#1E1E1E]">{splitMode === 'equally' ? 'Split Equally' : 'Custom Split'}</Text>
           </View>
            <TouchableOpacity 
             className="bg-[#059669]/10 px-4 py-2 rounded-full"
             onPress={() => setSplitMode(s => s === 'equally' ? 'custom' : 'equally')}
           >
             <Text className="text-[#059669] font-bold">Change</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Confirm Button */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity className="w-16 h-16 rounded-full bg-[#059669] items-center justify-center shadow-lg">
           <Check color="#FFFFFF" size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
