import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useTravelStore } from '../store/useTravelStore';

export function GlobalLoadingOverlay() {
  const isGlobalLoading = useTravelStore((state) => state.isGlobalLoading);

  if (!isGlobalLoading) return null;

  return (
    <Modal transparent animationType="fade" visible={isGlobalLoading}>
      <View style={styles.overlay}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#FFC800" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  spinnerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  }
});
