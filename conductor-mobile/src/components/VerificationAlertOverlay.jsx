import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export default function VerificationAlertOverlay({ visible, ticket, onDismiss }) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.overlay}>
          <Text style={styles.title}>Payment Verified</Text>
          <Text style={styles.subTitle}>Ticket {ticket?.ticket_id} is now active.</Text>
          <View style={styles.ticketBox}>
            <Text style={styles.fieldLabel}>Bus</Text>
            <Text style={styles.fieldValue}>{ticket?.bus_id}</Text>
            <Text style={styles.fieldLabel}>Amount</Text>
            <Text style={styles.fieldValue}>₹{ticket?.amount}</Text>
          </View>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  overlay: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#bbf7d0',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 24,
    textAlign: 'center',
  },
  ticketBox: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#152536',
    padding: 18,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 999,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
});
