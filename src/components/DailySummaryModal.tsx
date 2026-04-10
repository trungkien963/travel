import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, TouchableOpacity, Image, ScrollView, Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { X, Calendar as CalendarIcon, Image as ImageIcon, Receipt } from 'lucide-react-native';
import { Expense } from '../types/expense';
import { Post } from '../types/social';

const { height, width } = Dimensions.get('window');

interface DailySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate: string;
  availableDates: string[];
  expenses: Expense[];
  posts: Post[];
}

export function DailySummaryModal({ visible, onClose, initialDate, availableDates, expenses, posts }: DailySummaryModalProps) {
  if (!visible) return null;

  const initialIndex = availableDates.indexOf(initialDate) !== -1 ? availableDates.indexOf(initialDate) : 0;

  // Filter normalization is placed inside renderItem

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.modalHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
               <TouchableOpacity onPress={onClose}><X size={24} color="#1C1917" /></TouchableOpacity>
               <Text style={styles.modalTitle}>Daily Summary</Text>
            </View>
          </View>

          <FlatList
            data={availableDates}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            initialNumToRender={1}
            windowSize={3}
            removeClippedSubviews={false}
            renderItem={({ item: currentDate }) => {
              const dateObj = new Date(currentDate);
              const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

              const isSameDate = (savedDate: string, targetDate: string) => {
                if (!savedDate) return false;
                if (savedDate === targetDate) return true;
                const parts = targetDate.split('-');
                if (parts.length < 3) return false;
                const y = parts[0], m = parts[1], d = parts[2];
                return savedDate === `${d}/${m}/${y}` || savedDate === `${m}/${d}/${y}` || savedDate === `${y}-${m}-${d}`;
              };

              const dailyExpenses = expenses.filter(e => isSameDate(e.date, currentDate));
              const totalSpent = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
              const dailyPosts = posts.filter(p => isSameDate(p.date, currentDate));

              return (
                <View style={{ width: width, paddingHorizontal: 24 }}>
                  <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                    
                    <View style={styles.dateBanner}>
                      <CalendarIcon size={24} color="#FFC800" />
                      <Text style={styles.dateBannerText}>{formattedDate}</Text>
                    </View>

                    {/* Financial Summary */}
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeader}>
                        <Receipt size={20} color="#1C1917" />
                        <Text style={styles.sectionTitle}>Total Spent</Text>
                      </View>
                      <Text style={styles.totalAmount}>{formatCurrency(totalSpent)} VND</Text>
                      
                      {dailyExpenses.length > 0 ? (
                        <View style={styles.expenseList}>
                           {dailyExpenses.map(e => (
                             <View key={e.id} style={styles.expenseItem}>
                                <Text style={styles.expenseDesc}>{e.desc}</Text>
                                <Text style={styles.expenseAmt}>{formatCurrency(e.amount)}</Text>
                             </View>
                           ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyText}>No expenses recorded on this day.</Text>
                      )}
                    </View>

                    {/* Photos Summary */}
                    <View style={styles.sectionCard}>
                      <View style={[styles.sectionHeader, {marginBottom: 16}]}>
                        <ImageIcon size={20} color="#1C1917" />
                        <Text style={styles.sectionTitle}>Captured Moments</Text>
                      </View>

                      {dailyPosts.length > 0 ? (
                        <View style={{gap: 12}}>
                           {dailyPosts.map(post => (
                             <View key={post.id} style={styles.postMiniCard}>
                                <View style={styles.postMiniHeader}>
                                  <View style={styles.miniAvatar}><Text style={styles.miniAvatarTxt}>{post.authorName.charAt(0)}</Text></View>
                                  <Text style={styles.miniAuthorName}>{post.authorName}</Text>
                                </View>
                                {post.content ? <Text style={styles.postMiniContent} numberOfLines={2}>{post.content}</Text> : null}
                                {post.images.length > 0 && (
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 8}}>
                                     {post.images.map((img, idx) => (
                                       <Image key={idx} source={{uri: img}} style={styles.miniImageScroll} resizeMode="cover" />
                                     ))}
                                  </ScrollView>
                                )}
                             </View>
                           ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyText}>No moments shared on this day.</Text>
                      )}
                    </View>

                  </ScrollView>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FBFBFB', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingBottom: 0, height: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8, paddingHorizontal: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1C1917' },
  
  dateBanner: { backgroundColor: '#E8F5E9', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dateBannerText: { fontSize: 18, color: '#FFC800', fontWeight: '800' },
  
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#1C1917', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.02, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1917' },
  
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#FFC800', marginTop: 12, marginBottom: 16 },
  
  expenseList: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16, gap: 12 },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseDesc: { fontSize: 15, color: '#1C1917', fontWeight: '600', flex: 1 },
  expenseAmt: { fontSize: 15, color: '#A8A29E', fontWeight: '700' },
  
  emptyText: { color: '#A8A29E', fontSize: 14, fontWeight: '600', fontStyle: 'italic', marginTop: 8 },
  
  postMiniCard: { backgroundColor: '#F5F5F5', borderRadius: 16, padding: 12 },
  postMiniHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFC800', justifyContent: 'center', alignItems: 'center' },
  miniAvatarTxt: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  miniAuthorName: { fontSize: 13, fontWeight: '800', color: '#1C1917' },
  postMiniContent: { fontSize: 14, color: '#1C1917', fontWeight: '500', lineHeight: 20 },
  miniImageScroll: { width: 100, height: 100, borderRadius: 8, marginRight: 8 }
});
