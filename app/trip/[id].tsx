import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Users, Calendar as CalendarIcon, ArrowRight, Trash2, Plus, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MOCK_MEMBERS } from '../../src/constants/mockData';
import { useTrip } from '../../src/hooks/useTrip';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBalances } from '../../src/hooks/useBalances';
import { ExpenseLogModal } from '../../src/components/ExpenseLogModal';
import { ExpenseDetailModal } from '../../src/components/ExpenseDetailModal';
import { MemberModal } from '../../src/components/MemberModal';
import { Expense, Member } from '../../src/types/expense';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('MEMBERS');
  
  const { trip, isOwner, currentUserId, addMember, editMember, removeMember } = useTrip(id as string);
  const { expenses, saveExpense, deleteExpense } = useExpenses();
  const { netBalances, debts } = useBalances(expenses, trip?.members || []);
  
  // Modal Visibility States
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isMemberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const formatCurrency = (val: string) => {
    if (!val) return '0';
    return parseInt(val, 10).toLocaleString('en-US');
  };

  const handleSaveExpense = (expense: Expense) => {
    saveExpense(expense, !!editingExpense);
    setExpenseModalVisible(false);
    setEditingExpense(null);
  };

  const handleEditPress = () => {
    if (selectedExpense) {
      setEditingExpense(selectedExpense);
      setSelectedExpense(null);
      setExpenseModalVisible(true);
    }
  };

  const handleDeleteExpense = () => {
    if (selectedExpense) {
      deleteExpense(selectedExpense.id);
      setSelectedExpense(null);
    }
  };

  const handleLogNewExpense = () => {
     setEditingExpense(null);
     setExpenseModalVisible(true);
  };

  const handleSaveMember = (member: Member) => {
    if (editingMember) {
      editMember(member);
    } else {
      addMember(member);
    }
    setMemberModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Cover Image Area */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: trip?.coverImage || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000' }} 
            style={styles.coverImage}
          />
          <LinearGradient colors={['transparent', '#FBFBFB']} style={styles.bottomFader} />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <View style={styles.coverDetails}>
             {trip?.isPrivate && <View style={styles.privateBadge}><Text style={styles.privateBadgeText}>PRIVATE</Text></View>}
             <Text style={styles.title}>{trip?.title}</Text>
             <View style={styles.metaRow}>
               <View style={styles.metaItem}><CalendarIcon size={14} color="#1C1917" /><Text style={styles.metaText}>{trip?.startDate} - {trip?.endDate}</Text></View>
               <View style={styles.metaItem}><Users size={14} color="#1C1917" /><Text style={styles.metaText}>{trip?.members.length || 0} members</Text></View>
             </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsWrapper}>
           {['MOMENTS', 'EXPENSES', 'BALANCES', 'MEMBERS'].map(tab => (
             <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}>
               <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
           {activeTab === 'MOMENTS' && (
             <View style={styles.calendarCard}>
                <View style={styles.calHeader}>
                   <View><Text style={styles.calMonth}>April</Text><Text style={styles.calYear}>2026</Text></View>
                   <View style={styles.calNav}>
                     <TouchableOpacity><ArrowLeft size={20} color="#A8A29E" /></TouchableOpacity>
                     <TouchableOpacity style={{marginLeft: 16}}><ArrowRight size={20} color="#A8A29E" /></TouchableOpacity>
                   </View>
                </View>
                <View style={styles.daysRow}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (<Text key={i} style={styles.dayText}>{d}</Text>))}
                </View>
                <View style={styles.datesGrid}>
                   {[29,30,31,1,2,3,4,5,6,7,8,9].map((d, idx) => (
                     <View key={`d-${idx}`} style={styles.dateCell}><Text style={styles.dateTextDisabled}>{d}</Text></View>
                   ))}
                   <View style={styles.dateCellSelected}><View style={styles.dateCircle}><Text style={styles.dateTextSelected}>10</Text></View></View>
                   {[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,1,2].map((d, idx) => (
                     <View key={`f-${idx}`} style={styles.dateCell}><Text style={styles.dateTextDisabled}>{d}</Text></View>
                   ))}
                </View>
             </View>
           )}

           {activeTab === 'EXPENSES' && (
             <View>
               <View style={styles.summaryRow}>
                 <View style={styles.summaryBlockBlack}>
                    <Text style={styles.summaryLabelLight}>TOTAL</Text>
                    <Text style={styles.summaryValueLight} numberOfLines={1} adjustsFontSizeToFit>
                       {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0).toString())} VND
                    </Text>
                 </View>
                 <View style={styles.summaryBlockWhite}>
                    <Text style={styles.summaryLabelDark}>PER PERSON</Text>
                    <Text style={styles.summaryValueDark} numberOfLines={1} adjustsFontSizeToFit>
                       {formatCurrency(Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) / MOCK_MEMBERS.length).toString())} VND
                    </Text>
                 </View>
               </View>

               <View style={styles.transactionsHeader}>
                 <Text style={styles.transactionsTitle}>Transactions</Text>
                 <TouchableOpacity style={styles.logExpenseBtn} onPress={handleLogNewExpense}>
                   <Plus size={14} color="#FFF" />
                   <Text style={styles.logExpenseBtnText}>Log Expense</Text>
                 </TouchableOpacity>
               </View>

               {expenses.length === 0 ? (
                 <View style={styles.emptyExpenseCard}>
                   <Text style={styles.emptyExpenseText}>No expenses logged yet.</Text>
                 </View>
               ) : (
                 <View style={styles.expensesList}>
                   {expenses.map(exp => {
                     const payer = MOCK_MEMBERS.find(m => m.id === exp.payerId)?.name || 'Someone';
                     return (
                       <TouchableOpacity 
                         key={exp.id} 
                         style={styles.expenseItemCard}
                         activeOpacity={0.7}
                         onPress={() => setSelectedExpense(exp)}
                       >
                         <View style={styles.expenseItemLeft}>
                           <View style={styles.expenseIconCircle}>
                             <ImageIcon size={20} color="#059669" />
                           </View>
                           <View style={{flex: 1}}>
                             <Text style={styles.expenseItemDesc} numberOfLines={1}>{exp.desc}</Text>
                             <Text style={styles.expenseItemDate} numberOfLines={1} adjustsFontSizeToFit>{exp.date} • Paid by {payer}</Text>
                           </View>
                         </View>
                         <Text style={styles.expenseItemAmount}>₫{formatCurrency(exp.amount.toString())}</Text>
                       </TouchableOpacity>
                     );
                   })}
                 </View>
               )}
             </View>
           )}

           {activeTab === 'BALANCES' && (
             <View>
               <View style={styles.transactionsHeader}>
                 <Text style={styles.transactionsTitle}>Balances & Debts</Text>
               </View>

               {debts.length === 0 ? (
                 <View style={styles.emptyExpenseCard}>
                   <Text style={styles.emptyExpenseText}>Everyone is fully settled up! 🎉</Text>
                 </View>
               ) : (
                 <View style={{ gap: 16, marginBottom: 20 }}>
                   {debts.map((debt, idx) => {
                     const isMeFrom = debt.fromId === 'm1';
                     const isMeTo = debt.toId === 'm1';
                     
                     return (
                       <View key={idx} style={styles.expenseItemCard}>
                         <View style={styles.expenseItemLeft}>
                           <View style={[styles.expenseIconCircle, { backgroundColor: isMeFrom ? '#FEF2F2' : isMeTo ? '#E8F5E9' : '#F5F5F5' }]}>
                             {isMeFrom ? (
                               <ArrowRight size={20} color="#DC2626" />
                             ) : isMeTo ? (
                               <ArrowLeft size={20} color="#059669" />
                             ) : (
                               <Users size={20} color="#1C1917" />
                             )}
                           </View>
                           <View style={{flex: 1}}>
                             <Text style={styles.expenseItemDesc} numberOfLines={1}>
                               {isMeFrom ? "You owe" : debt.fromName + " owes"}
                             </Text>
                             <Text style={styles.expenseItemDate} numberOfLines={1} adjustsFontSizeToFit>
                               {isMeFrom ? debt.toName : isMeTo ? "you" : debt.toName}
                             </Text>
                           </View>
                         </View>
                         <Text style={[styles.expenseItemAmount, isMeFrom ? {color: '#DC2626'} : isMeTo ? {color: '#059669'} : {color: '#1C1917'}]}>
                           ₫{formatCurrency(debt.amount.toString())}
                         </Text>
                       </View>
                     );
                   })}
                 </View>
               )}
             </View>
           )}

           {activeTab === 'MEMBERS' && (
             <View>
               <View style={styles.transactionsHeader}>
                 <Text style={styles.transactionsTitle}>Trip Members</Text>
                 {isOwner && (
                   <TouchableOpacity style={styles.logExpenseBtn} onPress={() => {
                     setEditingMember(null);
                     setMemberModalVisible(true);
                   }}>
                     <Plus size={14} color="#FFF" />
                     <Text style={styles.logExpenseBtnText}>Add Member</Text>
                   </TouchableOpacity>
                 )}
               </View>

               <View style={styles.expensesList}>
                  {trip?.members.map(member => {
                    const isTripOwner = member.id === trip.ownerId;
                    return (
                      <View key={member.id} style={styles.expenseItemCard}>
                         <View style={styles.expenseItemLeft}>
                           <View style={styles.expenseIconCircle}>
                             <Text style={{fontWeight: '900', color: '#059669', fontSize: 16}}>
                               {member.name.charAt(0)}
                             </Text>
                           </View>
                           <View style={{flex: 1}}>
                             <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                               <Text style={styles.expenseItemDesc} numberOfLines={1}>{member.name}</Text>
                               {isTripOwner && (
                                 <View style={{backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100}}>
                                   <Text style={{fontSize: 8, fontWeight: '900', color: '#FFF'}}>HOST</Text>
                                 </View>
                               )}
                             </View>
                             <Text style={styles.expenseItemDate}>{member.isMe ? 'You' : 'Member'}</Text>
                           </View>
                         </View>

                         {isOwner && (
                           <View style={{flexDirection: 'row', gap: 8}}>
                             <TouchableOpacity 
                               onPress={() => {
                                 setEditingMember(member);
                                 setMemberModalVisible(true);
                               }}
                               style={{backgroundColor: '#F5F5F5', padding: 8, borderRadius: 100}}
                             >
                               {/* Using a simple Edit Text or pen if we had PencilIcon, resorting to text for now or just generic icon */}
                               <Text style={{fontSize: 12, fontWeight: '800', color: '#1C1917'}}>Edit</Text>
                             </TouchableOpacity>
                             
                             {!isTripOwner && (
                               <TouchableOpacity 
                                 onPress={() => removeMember(member.id)}
                                 style={{backgroundColor: '#FEF2F2', padding: 8, borderRadius: 100}}
                               >
                                 <Trash2 size={16} color="#DC2626" />
                               </TouchableOpacity>
                             )}
                           </View>
                         )}
                      </View>
                    );
                  })}
               </View>
             </View>
           )}
        </View>

        {isOwner && (
          <View style={styles.gActions}>
            <TouchableOpacity style={styles.publishBtn}><Text style={styles.publishBtnText}>Publish Trip</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn}><Trash2 size={18} color="#DC2626" /><Text style={styles.deleteBtnText}>Delete Trip</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Extracted Modals */}
      <ExpenseLogModal 
        visible={isExpenseModalVisible}
        onClose={() => setExpenseModalVisible(false)}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
        tripMembers={trip?.members || []}
      />

      <ExpenseDetailModal 
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={handleEditPress}
        onDelete={handleDeleteExpense}
        canModify={isOwner || selectedExpense?.payerId === currentUserId}
        tripMembers={trip?.members || []}
      />

      <MemberModal 
        visible={isMemberModalVisible}
        onClose={() => setMemberModalVisible(false)}
        onSave={handleSaveMember}
        initialMember={editingMember}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  scrollContent: { paddingBottom: 60 },
  coverContainer: { height: 350, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  bottomFader: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  backButton: { position: 'absolute', top: 55, left: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
  coverDetails: { position: 'absolute', bottom: 20, left: 24, right: 24 },
  privateBadge: { backgroundColor: '#059669', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 8 },
  privateBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#1C1917', fontSize: 36, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#1C1917', fontSize: 14, fontWeight: '600' },
  
  tabsWrapper: { flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginTop: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: '#059669' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#A8A29E', letterSpacing: 0.5 },
  activeTabText: { color: '#059669' },
  
  contentArea: { padding: 24 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#1C1917', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  calMonth: { fontSize: 22, fontWeight: '900', color: '#1C1917' },
  calYear: { fontSize: 13, fontWeight: '800', color: '#A8A29E', marginTop: 4, letterSpacing: 1 },
  calNav: { flexDirection: 'row', marginTop: 4 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  dayText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#A8A29E' },
  datesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  dateTextDisabled: { color: '#E5E5E5', fontSize: 13, fontWeight: '700' },
  dateCellSelected: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  dateCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  dateTextSelected: { color: '#1C1917', fontSize: 15, fontWeight: '800' },
  
  summaryRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  summaryBlockBlack: { flex: 1, backgroundColor: '#1C1917', borderRadius: 28, padding: 24 },
  summaryLabelLight: { color: '#A8A29E', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  summaryValueLight: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  summaryBlockWhite: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#F0F0F0' },
  summaryLabelDark: { color: '#A8A29E', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  summaryValueDark: { color: '#1C1917', fontSize: 22, fontWeight: '900' },
  
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  transactionsTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917' },
  logExpenseBtn: { backgroundColor: '#1C1917', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, gap: 6 },
  logExpenseBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyExpenseCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F0F0F0', padding: 40, alignItems: 'center' },
  emptyExpenseText: { color: '#A8A29E', fontWeight: '600', fontSize: 15 },

  expensesList: { gap: 12, marginBottom: 20 },
  expenseItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#1C1917', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
  expenseItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  expenseIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  expenseItemDesc: { fontSize: 15, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  expenseItemDate: { fontSize: 12, fontWeight: '600', color: '#A8A29E' },
  expenseItemAmount: { fontSize: 16, fontWeight: '900', color: '#059669' },

  gActions: { paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  publishBtn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  publishBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteBtn: { backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '800' }
});
