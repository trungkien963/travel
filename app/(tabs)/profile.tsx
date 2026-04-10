import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Settings, Shield, HelpCircle, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background">
       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 120 }}>
          
          {/* Header & User Identity */}
          <View className="flex-row items-center mb-10">
             <View className="w-24 h-24 rounded-[32px] bg-surface shadow-sm border border-[#E5E5E5] overflow-hidden mr-5">
               <Image 
                 source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3276&auto=format&fit=crop' }} 
                 className="w-full h-full"
               />
             </View>
             <View className="flex-1 justify-center">
               <Text className="text-2xl font-bold text-text mb-1">Jane Doe</Text>
               <Text className="text-sm text-muted mb-4 font-medium">jane@example.com</Text>
               <TouchableOpacity className="bg-surface border border-[#E5E5E5] px-5 py-2.5 rounded-full self-start shadow-sm">
                 <Text className="text-text font-bold text-xs uppercase tracking-wider">Edit Profile</Text>
               </TouchableOpacity>
             </View>
          </View>

          {/* Travel Stats Section */}
          <Text className="text-xs font-bold text-muted uppercase tracking-widest pl-2 mb-3">Travel Stats</Text>
          <View className="flex-row gap-3 mb-10">
             <View className="flex-1 bg-surface rounded-3xl p-5 items-center border border-[#F0F0F0] shadow-sm">
               <Text className="text-3xl font-black text-text mb-1">12</Text>
               <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Trips</Text>
             </View>
             <View className="flex-1 bg-surface rounded-3xl p-5 items-center border border-[#F0F0F0] shadow-sm">
               <Text className="text-3xl font-black text-primary mb-1">5</Text>
               <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Countries</Text>
             </View>
             <View className="flex-1 bg-surface rounded-3xl p-5 items-center border border-[#F0F0F0] shadow-sm">
               <Text className="text-3xl font-black text-text mb-1">142</Text>
               <Text className="text-[10px] font-bold text-muted uppercase tracking-widest">Moments</Text>
             </View>
          </View>

          {/* Account Settings Section */}
          <Text className="text-xs font-bold text-muted uppercase tracking-widest pl-2 mb-3">Account Settings</Text>
          <View className="bg-surface rounded-[32px] border border-[#F0F0F0] shadow-sm mb-10 overflow-hidden">
             <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#F0F0F0]">
                <View className="flex-row items-center gap-4">
                  <Settings size={22} color="#1C1917" />
                  <Text className="text-base font-bold text-text">Preferences</Text>
                </View>
                <ChevronRight size={20} color="#E5E5E5" />
             </TouchableOpacity>

             <TouchableOpacity className="flex-row items-center justify-between p-5 border-b border-[#F0F0F0]">
                <View className="flex-row items-center gap-4">
                  <Shield size={22} color="#1C1917" />
                  <Text className="text-base font-bold text-text">Privacy & Security</Text>
                </View>
                <ChevronRight size={20} color="#E5E5E5" />
             </TouchableOpacity>

             <TouchableOpacity className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <HelpCircle size={22} color="#1C1917" />
                  <Text className="text-base font-bold text-text">Help Center</Text>
                </View>
                <ChevronRight size={20} color="#E5E5E5" />
             </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity className="items-center py-2">
            <Text className="text-muted font-bold text-base">Sign Out</Text>
          </TouchableOpacity>

       </ScrollView>
    </View>
  );
}
