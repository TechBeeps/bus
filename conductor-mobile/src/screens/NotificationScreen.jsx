import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import colors from '../theme/colors';

export default function NotificationScreen({ route, navigation }) {
  const notification = route?.params?.notification;
  const content = notification?.request?.content || {};

  const body = content.body || JSON.stringify(content.data || {});
  const ticket =  content.data || undefined;
 useEffect(() => {
  if(!ticket?.ticket_id || !ticket?.amount ) {
    navigation.reset({
  index: 0,
  routes: [
    { name: 'ShiftSelect' }
  ],
});
  
  }
}, [ticket]);
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} style={styles.overlayContainer} onPress={() => navigation.goBack()}>
        <View style={styles.overlayCard}>
          <View style={styles.overlayIconContainer}>
            <Text style={styles.overlayCheckmark}>✓</Text>
          </View>

          <Text style={styles.overlayTitle}>PAYMENT RECEIVED</Text>

          {ticket ? (
            <>
              <Text style={ticket.razorpay_payment_id =='monthly_pass' ? styles.overlayAmountPass : styles.overlayAmount}>
                {ticket.razorpay_payment_id =='monthly_pass' ? 'Monthly Pass' : `₹${ticket.amount}`}
              </Text>

              <View style={styles.overlayDetailsBox}>
                <Text style={styles.overlayDetailText}>
                  <Text style={styles.bold}>Ticket No:</Text> {ticket.ticket_id}
                </Text>
                <Text style={styles.overlayDetailText}>
                  <Text style={styles.bold}>From:</Text> {ticket.origin}
                </Text>
                <Text style={styles.overlayDetailText}>
                  <Text style={styles.bold}>To:</Text> {ticket.destination}
                </Text>
                <Text style={styles.overlayDetailText}>
                  <Text style={styles.bold}>Txn ID:</Text> {ticket.razorpay_payment_id || 'Bank Verified'}
                </Text>
              </View>

              <Text style={styles.overlayDismissHint}>Tap anywhere to dismiss</Text>
            </>
          ) : (
            <>
              <Text style={styles.body}>{body}</Text>
              <Text style={styles.overlayDismissHint}>Tap anywhere to dismiss</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    elevation: 10,
  },
  overlayIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overlayCheckmark: {
    color: colors.textOnPrimary,
    fontSize: 36,
    fontWeight: '900',
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.successStrong,
    letterSpacing: 1,
    marginBottom: 8,
  },
  overlayAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 6,
  },
  overlayAmountPass: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.warningStrong,
    marginVertical: 6,
  },
  overlayDetailsBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginVertical: 12,
  },
  overlayDetailText: {
    fontSize: 14,
    color: colors.textBody,
    marginBottom: 4,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlaySuccess,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  overlayDismissHint: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 8,
  },
  body: { fontSize: 14, color: colors.textBody, marginBottom: 16, textAlign: 'center' },
  bold: { fontWeight: '700' },
  closeBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: colors.textOnPrimary, fontWeight: '700' },
});
