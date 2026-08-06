import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    backgroundColor: '#0f172a',
    marginBottom: 16,
    shadowColor: '#000',
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
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  status: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    color: '#cbd5e1',
    fontSize: 14,
  },
});
