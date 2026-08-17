import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Vibration,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { playVerificationChime } from '../services/AudioService';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Localhost for Android Emulator

export default function LiveVerificationScreen({ route, navigation }) {
  const busId = route?.params?.busId || 'BUS-101';
  
  const [verifiedTickets, setVerifiedTickets] = useState([]);
  const [latestTicket, setLatestTicket] = useState(null);
  const [showAlertOverlay, setShowAlertOverlay] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const knownTicketIds = useRef(new Set());
  const firstLoadRef = useRef(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const appStateListener = (nextAppState) => {
      appState.current = nextAppState;
    };
    const sub = AppState.addEventListener('change', appStateListener);
    const STORAGE_KEY = `@knownTicketIds_${busId}`;

    const loadKnownIds = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const ids = JSON.parse(json);
          knownTicketIds.current = new Set(Array.isArray(ids) ? ids : []);
        }
      } catch (e) {
        // ignore load errors
      }
    };

    const saveKnownIds = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownTicketIds.current)));
      } catch (e) {
        // ignore save errors
      }
    };

    const fetchUpdates = async () => {
      try {
        let tickets = [];
        try {
          const res = await fetch(`https://api.techbeeps.co.in/api/v1/tickets/${busId}`);
       
          if (res && res.status === 200) {
          
            const data = await res.json();

            tickets = data.data || [];
            setIsOnline(true);
          } else {
    
            tickets = [];
            setIsOnline(false);
          }
        } catch (err) {

          tickets = [];
          setIsOnline(false);
        }

        await processIncomingTickets(tickets, saveKnownIds);

        if (firstLoadRef.current) firstLoadRef.current = false;
      } catch (error) {
        setIsOnline(false);
      }
    };

    const init = async () => {
      await loadKnownIds();
      await fetchUpdates();
      const interval = setInterval(fetchUpdates, 2000);
      // store interval id on ref so it can be cleared
      return () => clearInterval(interval);
    };

    let cleanup;
    (async () => {
      cleanup = await init();
    })();

    return () => {
      if (cleanup) cleanup();
      if (sub) sub.remove();
    };
  }, [busId]);

  const processIncomingTickets = async (tickets, persistFn) => {
    let sum = 0;

    if (firstLoadRef.current) {
      tickets.forEach((ticket) => {
        sum += ticket.amount;
        knownTicketIds.current.add(ticket.ticket_id);
      });
      setVerifiedTickets([...tickets].reverse());
      setTotalCollection(sum);
      if (persistFn) await persistFn();
      return;
    }

    let newTicketsFound = false;

    tickets.forEach((ticket) => {
      sum += ticket.amount;
      if (!knownTicketIds.current.has(ticket.ticket_id)) {
        knownTicketIds.current.add(ticket.ticket_id);
        newTicketsFound = true;
        triggerConductorAlert(ticket);
      }
    });

    if (newTicketsFound) {
      setVerifiedTickets([...tickets].reverse());
      setTotalCollection(sum);
      if (persistFn) await persistFn();
    }
  };

  const triggerConductorAlert = (ticket) => {
    setLatestTicket(ticket);
    setShowAlertOverlay(true);

    playVerificationChime();
    Vibration.vibrate([0, 500, 200, 500]);
    // Do not auto-dismiss the overlay; allow user to tap to dismiss.

    // If app is backgrounded or inactive, also send a local notification so
    // tapping it will open the Notification screen.
    if (appState.current !== 'active') {
      try {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Payment received',
            body: `₹${ticket.amount} - ${ticket.ticket_id}`,
            data: { ticket },
          },
          trigger: null,
        });
      } catch (e) {
        // ignore notification errors
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

      <View style={styles.header}>
        <View>
          <Text style={styles.busTitle}>BUS #{busId}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.statusText}>{isOnline ? 'LIVE SYNC' : 'OFFLINE MODE'}</Text>
          </View>
        </View>

        <View style={styles.collectionBadge}>
          <Text style={styles.collectionLabel}>TOTAL UPI</Text>
          <Text style={styles.collectionValue}>₹{totalCollection}</Text>
        </View>
      </View>

      <View style={styles.feedContainer}>
        <Text style={styles.sectionHeader}>Verified Payments ({verifiedTickets.length})</Text>

        <FlatList
          data={verifiedTickets}
          keyExtractor={(item) => item.ticket_id}
          renderItem={({ item }) => (
            <View style={styles.ticketCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.ticketId}>{item.ticket_id}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.routeText}>{item.origin} ➔ {item.destination}</Text>
                <Text style={styles.metaText}>{item.passenger_count} Passenger(s)</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.amountText}>₹{item.amount}</Text>
                {/* <Text style={styles.timeText}>{item.created_at ? item.created_at.split('T')[1].substring(0, 5) : 'Just Now'}</Text> */}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Waiting for passenger scans...</Text>
            </View>
          }
        />
      </View>

      {showAlertOverlay && latestTicket && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowAlertOverlay(false)}
          style={styles.overlayContainer}
        >
          <View style={styles.overlayCard}>
            <View style={styles.overlayIconContainer}>
              <Text style={styles.overlayCheckmark}>✓</Text>
            </View>

            <Text style={styles.overlayTitle}>PAYMENT RECEIVED</Text>
            <Text style={styles.overlayAmount}>₹{latestTicket.amount}</Text>

            <View style={styles.overlayDetailsBox}>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Tickets:</Text> {latestTicket.passenger_count}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>From:</Text> {latestTicket.origin}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>To:</Text> {latestTicket.destination}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Txn ID:</Text> {latestTicket.upi_txn_id || 'Bank Verified'}
              </Text>
            </View>

            <Text style={styles.overlayDismissHint}>Tap anywhere to dismiss</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e1b4b',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  collectionBadge: {
    backgroundColor: '#312e81',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  collectionLabel: {
    color: '#a5b4fc',
    fontSize: 10,
    fontWeight: '700',
  },
  collectionValue: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
  },
  feedContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#334155',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
  },
  overlayIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  overlayCheckmark: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1,
  },
  overlayAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  overlayDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginVertical: 16,
  },
  overlayDetailText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  overlayDismissHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
});
