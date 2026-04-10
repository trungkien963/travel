import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Dimensions, Alert } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { Expense } from '../types/expense';
import { MOCK_MEMBERS } from '../constants/mockData';

const { height } = Dimensions.get('window');

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  canModify?: boolean;
  tripMembers: Member[];
}

const formatCurrency = (val: string) => {
  if (!val) return '0';
  return parseInt(val, 10).toLocaleString('en-US');
};

export function ExpenseDetailModal({ expense, onClose, onEdit, onDelete, canModify, tripMembers }: ExpenseDetailModalProps) {
  if (!expense) return null;

  const confirmDelete = () => {
    Alert.alert(
      "Xóa Hóa Đơn",
      "Bạn có chắc chắn muốn xóa hóa đơn này khỏi chuyến đi? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", onPress: onDelete, style: "destructive" }
      ]
    );
  };

  return (
    <Modal visible={!!expense} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Expense Details</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {canModify && (
                <>
                  <TouchableOpacity onPress={confirmDelete} style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100 }}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onEdit} style={{ backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1C1917' }}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#A8A29E" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginVertical: 32 }}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#059669', letterSpacing: -1 }}>
                ₫{formatCurrency(expense.amount.toString())}
              </Text>
              <Text style={{ fontSize: 20, color: '#1C1917', fontWeight: '800', marginTop: 12 }}>
                {expense.desc}
              </Text>
              <Text style={{ fontSize: 13, color: '#A8A29E', fontWeight: '700', marginTop: 6 }}>
                Logged on {expense.date}
              </Text>
            </View>

            {expense.receipts && expense.receipts.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <Text style={styles.fieldLabel}>RECEIPTS / PHOTOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {expense.receipts.map((img: string, idx: number) => (
                    <Image key={idx} source={{ uri: img }} style={{ width: 280, height: 220, borderRadius: 20, marginRight: 12 }} />
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.fieldLabel}>PAID BY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
              <View style={styles.paidByActivePill}>
                <Text style={styles.paidByActiveText}>
                  {tripMembers.find(m => m.id === expense.payerId)?.name || 'Someone'}
                </Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>SPLIT BREAKDOWN</Text>
            <View style={{ backgroundColor: '#FBFBFB', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F0F0', gap: 16 }}>
              {tripMembers.map(m => {
                const amt = expense.splits?.[m.id] || 0;
                if (amt === 0) return null;
                return (
                  <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1C1917' }}>{m.name}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#A8A29E' }}>₫{formatCurrency(amt.toString())}</Text>
                  </View>
                );
              })}
            </View>
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1C1917' },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#A8A29E', letterSpacing: 1, marginBottom: 12 },
  paidByActivePill: { backgroundColor: '#1C1917', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginRight: 8 },
  paidByActiveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
