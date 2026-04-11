import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Users, Calendar as CalendarIcon, ArrowRight, Trash2, Plus, Image as ImageIcon, Heart, MessageCircle, Share2, Pencil, Camera as CameraIcon, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTravelStore } from '../../src/store/useTravelStore';
import { MOCK_MEMBERS } from '../../src/constants/mockData';
import { useTrip } from '../../src/hooks/useTrip';
import { useSocial } from '../../src/hooks/useSocial';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBalances } from '../../src/hooks/useBalances';
import { ExpenseLogModal, getCategoryIcon } from '../../src/components/ExpenseLogModal';
import { ExpenseDetailModal } from '../../src/components/ExpenseDetailModal';
import { MemberModal } from '../../src/components/MemberModal';
import { PostCommentsModal } from '../../src/components/PostCommentsModal';
import { CreatePostModal } from '../../src/components/CreatePostModal';
import { DailySummaryModal } from '../../src/components/DailySummaryModal';
import { TripFormModal } from '../../src/components/TripFormModal';
import { PostItem } from '../../src/components/PostItem';
import { Expense, Member, ExpenseCategory, CATEGORY_COLORS } from '../../src/types/expense';
import { Post } from '../../src/types/social';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function TripDetailsScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(tab ? (tab as string) : 'SOCIAL');
  
  // React to tab parameter changes
  React.useEffect(() => {
    if (tab) setActiveTab(tab as string);
  }, [tab]);
  
  const { refreshData } = useTravelStore();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);
  
  const { trip, isOwner, currentUserId, addMember, editMember, removeMember, updateTrip } = useTrip(id as string);
  const { posts, toggleLike, addComment, addPost, editPost, deletePost: deleteSocialPost } = useSocial(id as string);
  const { expenses, saveExpense, deleteExpense } = useExpenses(id as string);
  const { netBalances, debts } = useBalances(expenses, trip?.members || []);
  
  // Modal Visibility States
  const [isExpenseModalVisible, setExpenseModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isMemberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [isCreatePostVisible, setCreatePostVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isTripModalVisible, setTripModalVisible] = useState(false);

  const aprilDates = Array.from({length: 30}, (_, i) => `2026-04-${String(i+1).padStart(2,'0')}`);

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

  const handleSavePost = (content: string, images: string[], expenseData?: Expense, isDual?: boolean) => {
    if (editingPost) {
      editPost(editingPost.id, content, images);
    } else {
      const userMember = trip?.members.find(m => m.id === currentUserId);
      const postAuthorName = useTravelStore.getState().currentUserProfile?.name || userMember?.name || 'You';
      
      addPost(content, images, currentUserId, postAuthorName, id as string, isDual);
    }

    if (expenseData) {
      saveExpense(expenseData, false);
    }
  };

  const handleSaveTrip = (tripData: any) => {
    const updatedMembers = tripData.members.map((nameOrEmail: string, idx: number) => {
      const existing = trip?.members.find(m => m.name === nameOrEmail || m.email === nameOrEmail);
      if (existing) return existing;
      return { id: `m_${Date.now()}_${idx}`, name: nameOrEmail };
    });

    const formatShortDate = (isoString: string) => {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "Unknown";
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    const formattedData = {
       title: tripData.title,
       coverImage: tripData.coverImage,
       startDate: formatShortDate(tripData.startDate),
       endDate: formatShortDate(tripData.endDate),
       members: updatedMembers
    };
    
    updateTrip(formattedData);
  };

  // Calculate actual personal share based on splits securely!
  const totalTripCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const yourShare = expenses.reduce((sum, e) => {
    if (e.splits && Object.keys(e.splits).length > 0) {
      return sum + (e.splits[currentUserId] || 0);
    }
    // fallback if expense lacks splits
    return sum + Math.round(e.amount / (trip?.members.length || 1));
  }, 0);

  // Analytics Calculation
  const categoryTotals: Record<string, number> = {};
  let totalExpensesForChart = 0;
  expenses.forEach(e => {
    const cat = e.category || 'OTHER';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    totalExpensesForChart += e.amount;
  });

  const chartData = Object.keys(categoryTotals).map(cat => ({
    category: cat,
    amount: categoryTotals[cat],
    percent: (categoryTotals[cat] / totalExpensesForChart) * 100,
    color: CATEGORY_COLORS[cat as ExpenseCategory] || '#9CA3AF'
  })).sort((a,b) => b.amount - a.amount);

  const handleExportPDF = async () => {
    try {
      let debtsHtml = debts.length === 0 
         ? '<p style="color: #6B7280; font-style: italic;">Everyone is settled up! 🎉</p>'
         : debts.map(d => `<div class="row"><span>${d.fromName} owes ${d.toName}</span><span class="amount">${formatCurrency(d.amount.toString())} ₫</span></div>`).join('');
         
      let expensesHtml = expenses.map(e => {
         const payer = MOCK_MEMBERS.find(m => m.id === e.payerId)?.name || 'Someone';
         return `<div class="row">
           <span>${e.date} &bull; ${e.desc} <br/><small style="color:#6B7280">Paid by ${payer}</small></span>
           <span class="amount">${formatCurrency(e.amount.toString())} ₫</span>
         </div>`;
      }).join('');

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1C1917; line-height: 1.5; }
              .header { text-align: center; margin-bottom: 40px; }
              h1 { color: #F59E0B; font-size: 32px; margin-bottom: 5px; }
              .subtitle { color: #A8A29E; font-size: 16px; margin-top: 0; }
              h2 { color: #1C1917; font-size: 20px; margin-top: 40px; border-bottom: 2px solid #F5F5F5; padding-bottom: 10px; }
              .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F5F5F5; }
              .amount { font-weight: bold; color: #1C1917; font-size: 16px; }
              .summary-box { background-color: #F9FAFB; padding: 20px; border-radius: 16px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
              .summary-label { color: #6B7280; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
              .summary-value { color: #DC2626; font-size: 24px; font-weight: 900; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${trip?.title || 'Trip Report'}</h1>
              <p class="subtitle">${trip?.startDate || ''} &mdash; ${trip?.endDate || ''}</p>
            </div>
            
            <div class="summary-box">
               <span class="summary-label">Total Trip Cost</span>
               <span class="summary-value">${formatCurrency(totalTripCost.toString())} ₫</span>
            </div>
            
            <h2>Outstanding Debts</h2>
            ${debtsHtml}
            
            <h2>All Expenses</h2>
            ${expensesHtml}
            
            <div style="text-align: center; margin-top: 60px; color: #A8A29E; font-size: 12px; border-top: 1px solid #E5E5E5; padding-top: 20px;">
              Generated by NomadSync Travel App
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      Alert.alert("Export Error", "Failed to generate PDF.");
    }
  };

  const handleExportCSV = async () => {
    try {
       let csvContent = "Date,Description,Category,Payer,Amount(VND)\n";
       expenses.forEach(e => {
         const payer = MOCK_MEMBERS.find(m => m.id === e.payerId)?.name || 'Someone';
         csvContent += `"${e.date}","${e.desc}","${e.category || 'OTHER'}","${payer}",${e.amount}\n`;
       });
       
       csvContent += "\nDebts\nFrom,To,Amount(VND)\n";
       debts.forEach(d => {
         csvContent += `"${d.fromName}","${d.toName}",${d.amount}\n`;
       });

       // @ts-ignore
       const fileUri = FileSystem.documentDirectory + 'TripReport.csv';
       // @ts-ignore
       await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
       await Sharing.shareAsync(fileUri);
    } catch (err) {
       Alert.alert("Export Error", "Failed to generate CSV.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFC800" />
        }
      >
        {/* Header Cover Image Area */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: trip?.coverImage || 'https://images.unsplash.com/photo-1473496169904-6a58eb22bf2f?q=80&w=1000' }} 
            style={styles.coverImage}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={() => setTripModalVisible(true)} style={[styles.backButton, { left: undefined, right: 16 }]} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
              <Pencil color="#FFFFFF" size={22} />
            </TouchableOpacity>
          )}
        </View>

        {/* Clean Overlapping White Sheet */}
        <View style={styles.sheetContainer}>
          <View style={styles.coverDetails}>
             {trip?.isPrivate && <View style={styles.privateBadge}><Text style={styles.privateBadgeText}>PRIVATE</Text></View>}
             <Text style={styles.title}>{trip?.title}</Text>
             <View style={styles.metaRow}>
               <View style={styles.metaItem}><CalendarIcon size={14} color="#A8A29E" /><Text style={styles.metaText}>{trip?.startDate} - {trip?.endDate}</Text></View>
               <View style={styles.metaItem}><Users size={14} color="#A8A29E" /><Text style={styles.metaText}>{trip?.members.length || 0} members</Text></View>
             </View>
          </View>

        {/* Tab Navigation */}
         <View style={styles.tabsWrapper}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, gap: 12}}>
             {['MOMENTS', 'SOCIAL', 'EXPENSES', 'BALANCES', 'MEMBERS'].map(tab => (
               <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}>
                 <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

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
                   {/* Prev Month Days */}
                   {[29,30,31].map((d, idx) => (
                     <View key={`d-${idx}`} style={styles.dateCell}><Text style={styles.dateTextDisabled}>{d}</Text></View>
                   ))}
                   
                   {/* April Days */}
                   {Array.from({length: 30}, (_, i) => i + 1).map((d) => {
                     const dateStr = `2026-04-${String(d).padStart(2,'0')}`;
                     const dailyImages = posts.filter(p => p.date === dateStr).flatMap(p => p.images);
                     const isTripDay = d >= 9 && d <= 15; // Highlight trip duration
                     
                     return (
                       <TouchableOpacity 
                         key={`apr-${d}`} 
                         style={[styles.dateCell, isTripDay && { backgroundColor: '#F0FDF4', borderRadius: 16 }]}
                         onPress={() => setSelectedDate(dateStr)}
                       >
                         <Text style={[
                           styles.dateText, 
                           isTripDay && { color: '#FFC800', fontWeight: '900' },
                           { marginBottom: dailyImages.length > 0 ? 4 : 0 }
                         ]}>{d}</Text>
                         
                         {/* Tiny Thumbnails grid */}
                         {dailyImages.length > 0 && (
                           <View style={{flexDirection: 'row', flexWrap: 'wrap', width: 26, height: 26, gap: 2, justifyContent: 'center', alignItems: 'center'}}>
                             {dailyImages.slice(0, 4).map((img, i) => (
                               <Image key={i} source={{uri: img}} style={{width: 12, height: 12, borderRadius: 4}} />
                             ))}
                           </View>
                         )}
                       </TouchableOpacity>
                     );
                   })}
                   
                   {/* Next Month Days */}
                   {[1,2,3,4,5,6,7,8,9].map((d, idx) => (
                     <View key={`f-${idx}`} style={styles.dateCell}><Text style={styles.dateTextDisabled}>{d}</Text></View>
                   ))}
                </View>
             </View>
           )}

           {activeTab === 'SOCIAL' && (
             <View style={{gap: 24}}>
               <View style={styles.transactionsHeader}>
                 <Text style={styles.transactionsTitle}>Trip Diary</Text>
                 <TouchableOpacity style={styles.logExpenseBtn} onPress={() => { setEditingPost(null); setCreatePostVisible(true); }}>
                   <CameraIcon size={16} color="#1C1917" />
                   <Text style={styles.logExpenseBtnText}>Chụp Ảnh</Text>
                 </TouchableOpacity>
               </View>
               
               {posts.map(post => (
                 <PostItem 
                   key={post.id} 
                   post={post}
                   isOwner={isOwner}
                   currentUserId={currentUserId}
                   onLike={toggleLike}
                   onComment={(p) => setSelectedPostForComments(p)}
                   onDelete={deleteSocialPost}
                   onEdit={(p) => { setEditingPost(p); setCreatePostVisible(true); }}
                 />
               ))}
               <View style={{height: 100}} />
              </View>
            )}

            {activeTab === 'EXPENSES' && (
             <View>
               <View style={styles.summaryRow}>
                 <View style={styles.summaryBlockBlack}>
                    <Text style={styles.summaryLabelLight}>TOTAL TRIP</Text>
                    <Text style={styles.summaryValueLight} numberOfLines={1} adjustsFontSizeToFit>
                       {formatCurrency(totalTripCost.toString())} VND
                    </Text>
                 </View>
                 <View style={styles.summaryBlockWhite}>
                    <Text style={styles.summaryLabelDark}>YOUR SHARE</Text>
                    <Text style={styles.summaryValueDark} numberOfLines={1} adjustsFontSizeToFit>
                       {formatCurrency(yourShare.toString())} VND
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
                             {getCategoryIcon(exp.category, 20, exp.category ? CATEGORY_COLORS[exp.category] : CATEGORY_COLORS.OTHER)}
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
               {totalExpensesForChart > 0 && (
                 <View style={styles.chartCardWrapper}>
                   <Text style={styles.chartTitle}>Spending Breakdown</Text>
                   
                   <View style={styles.chartBarWrapper}>
                     {chartData.map((d, i) => (
                       <View 
                         key={`bar-${i}`} 
                         style={[
                           styles.chartBarSegment, 
                           { width: `${d.percent}%`, backgroundColor: d.color },
                           i === 0 && { borderTopLeftRadius: 100, borderBottomLeftRadius: 100 },
                           i === chartData.length - 1 && { borderTopRightRadius: 100, borderBottomRightRadius: 100 }
                         ]} 
                       />
                     ))}
                   </View>

                   <View style={styles.chartLegend}>
                     {chartData.map((d, i) => (
                       <View key={`leg-${i}`} style={styles.legendItem}>
                         <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                         <View>
                            <Text style={styles.legendText}>{d.category}</Text>
                            <Text style={styles.legendAmount}>₫{formatCurrency(d.amount.toString())}</Text>
                         </View>
                       </View>
                     ))}
                   </View>
                 </View>
               )}

               <View style={[styles.transactionsHeader, { alignItems: 'flex-start' }]}>
                 <Text style={styles.transactionsTitle}>Balances & Debts</Text>
                 <TouchableOpacity 
                   style={styles.exportBtn} 
                   onPress={() => Alert.alert(
                     'Export Report', 
                     'Select the format you want to export your trip expenses to:',
                     [
                       { text: 'PDF Document', onPress: handleExportPDF },
                       { text: 'Excel (CSV)', onPress: handleExportCSV },
                       { text: 'Cancel', style: 'cancel' }
                     ]
                   )}
                 >
                   <Download size={14} color="#1C1917" />
                   <Text style={styles.exportBtnText}>Export</Text>
                 </TouchableOpacity>
               </View>

               {debts.length === 0 ? (
                 <View style={styles.emptyExpenseCard}>
                   <Text style={styles.emptyExpenseText}>Everyone is fully settled up! 🎉</Text>
                 </View>
               ) : (
                 <View style={{ gap: 16, marginBottom: 20 }}>
                   {debts.map((debt, idx) => {
                     const isMeFrom = debt.fromId === currentUserId;
                     const isMeTo = debt.toId === currentUserId;
                     
                     return (
                       <View key={idx} style={styles.expenseItemCard}>
                         <View style={styles.expenseItemLeft}>
                           <View style={[styles.expenseIconCircle, { backgroundColor: isMeFrom ? '#FEF2F2' : isMeTo ? '#E8F5E9' : '#F5F5F5' }]}>
                             {isMeFrom ? (
                               <ArrowRight size={20} color="#DC2626" />
                             ) : isMeTo ? (
                               <ArrowLeft size={20} color="#FFC800" />
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
                         <Text style={[styles.expenseItemAmount, isMeFrom ? {color: '#DC2626'} : isMeTo ? {color: '#FFC800'} : {color: '#1C1917'}]}>
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
                             <Text style={{fontWeight: '900', color: '#FFC800', fontSize: 16}}>
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
             <View style={{flexDirection: 'row', gap: 12}}>
                <TouchableOpacity style={[styles.deleteBtn, {flex: 1, backgroundColor: '#FFC800', borderWidth: 0}]} onPress={() => Alert.alert('Published!', 'Your amazing adventure is now live on the Discover feed for the world to see.')}>
                  <Text style={[styles.deleteBtnText, {color: '#1C1917'}]}>Publish Trip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.deleteBtn, {flex: 1}]}
                   onPress={() => {
                      Alert.alert(
                        'Delete Adventure', 
                        'Are you sure you want to permanently delete this trip and all its moments?', 
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive', 
                            onPress: async () => {
                              try {
                                await useTravelStore.getState().deleteTrip(id as string);
                                router.replace('/(tabs)/trips');
                              } catch (e: any) {
                                Alert.alert("Oops!", e.message || "Failed to delete the trip.");
                              }
                            }
                          }
                        ]
                      );
                   }}
                >
                  <Trash2 size={18} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Delete Trip</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}
        </View>
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

      <PostCommentsModal 
        post={posts.find(p => p.id === selectedPostForComments?.id) || null}
        onClose={() => setSelectedPostForComments(null)}
        onAddComment={addComment}
      />

      <CreatePostModal 
        visible={isCreatePostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSave={handleSavePost}
        currentUserName="You (Edric)"
        initialPost={editingPost}
        tripMembers={trip?.members || []}
      />

      {selectedDate && (
        <DailySummaryModal 
          visible={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          initialDate={selectedDate}
          availableDates={aprilDates}
          expenses={expenses}
          posts={posts}
        />
      )}

      {trip && (
        <TripFormModal 
          visible={isTripModalVisible}
          onClose={() => setTripModalVisible(false)}
          onSave={handleSaveTrip}
          initialData={trip}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 60 },
  coverContainer: { height: 320, position: 'relative' }, // Slightly shorter
  coverImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 55, left: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' },
  
  sheetContainer: { marginTop: -32, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  coverDetails: { padding: 24, paddingTop: 32 },
  privateBadge: { backgroundColor: '#FFC800', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 12 },
  privateBadgeText: { color: '#1C1917', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#1C1917', fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#78716C', fontSize: 13, fontWeight: '600' },
  
  tabsWrapper: { marginTop: 16, marginBottom: 8 },
  tabItem: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F0F0' },
  activeTabItem: { backgroundColor: '#1C1917', borderColor: '#1C1917' },
  tabText: { fontSize: 13, fontWeight: '800', color: '#A8A29E', letterSpacing: 0.5 },
  activeTabText: { color: '#FFFFFF' },
  
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
  dateText: { color: '#1C1917', fontSize: 15, fontWeight: '600' },
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
  
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  transactionsTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917', letterSpacing: -0.5 },
  logExpenseBtn: { backgroundColor: '#FFC800', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, gap: 8 },
  logExpenseBtnText: { color: '#1C1917', fontSize: 14, fontWeight: '800' },
  exportBtn: { backgroundColor: '#F5F5F5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, gap: 6 },
  exportBtnText: { color: '#1C1917', fontSize: 13, fontWeight: '800' },
  emptyExpenseCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F0F0F0', padding: 40, alignItems: 'center' },
  emptyExpenseText: { color: '#A8A29E', fontWeight: '600', fontSize: 15 },

  expensesList: { gap: 12, marginBottom: 20 },
  expenseItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#1C1917', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
  expenseItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  expenseIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  expenseItemDesc: { fontSize: 15, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  expenseItemDate: { fontSize: 12, fontWeight: '600', color: '#A8A29E' },
  expenseItemAmount: { fontSize: 16, fontWeight: '900', color: '#FFC800' },

  chartCardWrapper: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 32 },
  chartTitle: { fontSize: 13, fontWeight: '800', color: '#A8A29E', letterSpacing: 1, marginBottom: 20 },
  chartBarWrapper: { flexDirection: 'row', height: 16, borderRadius: 100, backgroundColor: '#F0F0F0', marginBottom: 24, overflow: 'hidden' },
  chartBarSegment: { height: '100%' },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, minWidth: '40%' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  legendText: { fontSize: 12, fontWeight: '800', color: '#1C1917', marginBottom: 2 },
  legendAmount: { fontSize: 13, fontWeight: '700', color: '#A8A29E' },

  gActions: { paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  publishBtn: { backgroundColor: '#FFC800', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  publishBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  deleteBtn: { backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '800' }
});
