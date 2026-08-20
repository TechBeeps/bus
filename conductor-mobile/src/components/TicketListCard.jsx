import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function TicketListCard({ ticket }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.ticketTitle}>Ticket {ticket.ticket_id}</Text>
        <Text style={styles.status}>Verified</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.detailItem}>Bus: {ticket.bus_id}</Text>
        <Text style={styles.detailItem}>Amount: ₹{ticket.amount}</Text>
        <Text style={styles.detailItem}>Passengers: {ticket.passenger_count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surfaceDark,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketTitle: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
  },
  status: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    color: colors.border,
    fontSize: 14,
  },
});
