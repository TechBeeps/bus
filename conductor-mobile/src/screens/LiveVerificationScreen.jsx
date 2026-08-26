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
  Modal,
  Pressable,
} from 'react-native';
import { playVerificationChime } from '../services/AudioService';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import QRCode from 'react-native-qrcode-svg';
import Svg, { G, Path, Rect } from 'react-native-svg';
import colors from '../theme/colors';


export default function LiveVerificationScreen({ route, navigation }) {
  const busId = route?.params?.busId || 'BUS001';
  const busNo = route?.params?.busNo || '';
  const [showQr, setShowQr] = useState(false);

  const [verifiedTickets, setVerifiedTickets] = useState([]);
  const [latestTicket, setLatestTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
          const res = await fetch(`https://api.shreemateshwaribus.com/api/v1/tickets/${busId}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res && res.status === 200) {
            const data = await res.json();
            tickets = Array.isArray(data.data) ? data.data : [];
            setIsOnline(true);
          } else {
            setIsOnline(false);
          }
        } catch (err) {
          clearTimeout(timeoutId);
          setIsOnline(false);
        }

        await processIncomingTickets(tickets, saveKnownIds);

        if (firstLoadRef.current) {
          firstLoadRef.current = false;
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    const init = async () => {
      await loadKnownIds();
      await fetchUpdates();
      const interval = setInterval(fetchUpdates, 2000);
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
    const isFirst = firstLoadRef.current;

    tickets.forEach((ticket) => {
      const amt = parseFloat(ticket.paidamount) || parseFloat(ticket.amount) || 0;
      if (ticket.razorpay_payment_id !== 'monthly_pass') {
        sum += amt;
      }

      if (!isFirst && !knownTicketIds.current.has(ticket.ticket_id)) {
        triggerConductorAlert(ticket);
      }
      knownTicketIds.current.add(ticket.ticket_id);
    });

    // Always update list so it never stays stuck or empty
    setVerifiedTickets([...tickets].reverse());
    setTotalCollection(sum);

    if (persistFn) {
      await persistFn();
    }
  };

  const triggerConductorAlert = (ticket) => {
    setLatestTicket(ticket);
    setShowAlertOverlay(true);

    playVerificationChime();
    Vibration.vibrate([0, 500, 200, 500]);

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
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.exitShiftButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ShiftSelect', {
                  conductor: route?.params?.conductor,
                  assignedBus: route?.params?.assignedBus,
                });
              }
            }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.exitShiftText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.busTitle}>{busNo || busId}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.warning }]} />
              <Text style={styles.statusText}>{isOnline ? 'LIVE SYNC' : 'OFFLINE MODE'}</Text>
            </View>
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
          keyExtractor={(item) => String(item.ticket_id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ticketCard}
              activeOpacity={0.8}
              onPress={() => setSelectedTicket(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.ticketId}>{item.ticket_id}</Text>
                <View style={item.razorpay_payment_id == 'monthly_pass' ? styles.verifiedBadge : styles.oneTimeBadge}>
                  <Text style={item.razorpay_payment_id == 'monthly_pass' ? styles.verifiedBadgeText : styles.oneTimeBadgeText}>
                    {item.razorpay_payment_id == 'monthly_pass' ? "Monthly Pass" : "One Time"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.routeText}>{item.origin} ➔ {item.destination}</Text>
                <Text style={styles.metaText}>{item.passenger_count} Passenger(s)</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.amountText}> {item.razorpay_payment_id == 'monthly_pass' ? "" : "₹" + item.amount}</Text>
                <Text style={styles.timeText}>{item.created_at ? item.created_at.split('T')[1].substring(0, 5) : 'Just Now'}</Text>
              </View>
              <Text style={styles.viewDetailsText}>Tap to view full details  ›</Text>
            </TouchableOpacity>
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
            <Text style={latestTicket.razorpay_payment_id == 'monthly_pass' ? styles.overlayAmountPass : styles.overlayAmount}>
              {latestTicket.razorpay_payment_id == 'monthly_pass' ? 'Monthly Pass' : `₹${latestTicket.amount}`}
            </Text>
            <View style={styles.overlayDetailsBox}>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Tickets:</Text> {latestTicket.ticket_id}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>From:</Text> {latestTicket.origin}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>To:</Text> {latestTicket.destination}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Txn ID:</Text> {latestTicket.razorpay_payment_id || 'Bank Verified'}
              </Text>
            </View>

            <Text style={styles.overlayDismissHint}>Tap anywhere to dismiss</Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={Boolean(selectedTicket)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <Pressable style={styles.detailsBackdrop} onPress={() => setSelectedTicket(null)}>
          <Pressable style={styles.detailsSheet} onPress={() => { }}>
            {selectedTicket && (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.detailsHeader}>
                  <View>
                    <Text style={styles.detailsEyebrow}>VERIFIED PAYMENT</Text>
                    <Text style={styles.detailsTitle}>Ticket #{selectedTicket.ticket_id}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailsCloseButton}
                    onPress={() => setSelectedTicket(null)}
                    accessibilityLabel="Close ticket details"
                  >
                    <Text style={styles.detailsCloseText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsRouteBox}>
                  <Text style={styles.detailsRouteLabel}>JOURNEY</Text>
                  <Text style={styles.detailsRouteText}>{selectedTicket.origin}  ›  {selectedTicket.destination}</Text>
                </View>

                <View style={styles.detailsAmountRow}>
                  <View>
                    <Text style={styles.detailsLabel}>PAYMENT TYPE</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTicket.razorpay_payment_id === 'monthly_pass' ? 'Monthly Pass' : 'One Time'}
                    </Text>
                  </View>
                  <View style={styles.detailsAmountBlock}>
                    <Text style={styles.detailsLabel}>TOTAL PAID</Text>
                    <Text style={styles.detailsAmount}>
                      ₹{selectedTicket.paidamount ?? selectedTicket.amount ?? 0}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>PASSENGERS</Text>
                    <Text style={styles.detailsValue}>{selectedTicket.passenger_count ?? 0}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>TIME</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                    </Text>
                  </View>
                  {selectedTicket.razorpay_payment_id !== 'monthly_pass' && (<>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailsLabel}>FARE</Text>
                      <Text style={styles.detailsValue}>₹{selectedTicket.amount ?? 0}</Text>
                    </View>
                    <View style={styles.detailCell}>
                      <Text style={styles.detailsLabel}>DISCOUNT</Text>
                      <Text style={styles.cashbackValue}>₹{selectedTicket.cashback ?? 0}</Text>
                    </View>
                  </>)}
                </View>

                {selectedTicket.razorpay_payment_id !== 'monthly_pass' && (
                  <View style={styles.transactionBox}>
                    <Text style={styles.detailsLabel}>TRANSACTION ID</Text>
                    <Text style={styles.transactionText}>{selectedTicket.razorpay_payment_id || 'Bank Verified'}</Text>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showQr}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQr(false)}
      >
        <Pressable style={styles.qrModalBackdrop} onPress={() => setShowQr(false)}>
          <Pressable style={styles.qrModalCard} onPress={() => { }}>
            <Text style={styles.qrTitle}>Bus QR</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={`https://bus.shreemateshwaribus.com/bus/${busId}`}
                size={250}
              />
            </View>

            <Pressable style={styles.qrCloseButton} onPress={() => setShowQr(false)}>
              <Text style={styles.qrCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setShowQr(true)} activeOpacity={0.85}>
        <View style={styles.fabIconBackground}>
          <Svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill={colors.textOnPrimary} class="bi bi-qr-code" viewBox="0 0 16 16">
            <Path d="M2 2h2v2H2z" />
            <Path d="M6 0v6H0V0zM5 1H1v4h4zM4 12H2v2h2z" />
            <Path d="M6 10v6H0v-6zm-5 1v4h4v-4zm11-9h2v2h-2z" />
            <Path d="M10 0v6h6V0zm5 1v4h-4V1zM8 1V0h1v2H8v2H7V1zm0 5V4h1v2zM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8zm0 0v1H2V8H1v1H0V7h3v1zm10 1h-1V7h1zm-1 0h-1v2h2v-1h-1zm-4 0h2v1h-1v1h-1zm2 3v-1h-1v1h-1v1H9v1h3v-2zm0 0h3v1h-2v1h-1zm-4-1v1h1v-2H7v1z" />
            <Path d="M7 12h1v3h4v1H7zm9 2v2h-3v-1h2v-1z" />
          </Svg>

        </View>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  exitShiftButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 10,

  },
  exitShiftText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  busTitle: {
    color: colors.textOnPrimary,
    fontSize: 20,
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
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  overlayAmountPass: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.warningStrong,
    marginVertical: 6,
  },
  collectionBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  collectionLabel: {
    color: colors.primaryMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  collectionValue: {
    color: colors.successBright,
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
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  viewDetailsText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'right',
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
    color: colors.textBody,
  },
  verifiedBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oneTimeBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: colors.successText,
    fontSize: 10,
    fontWeight: '800',
  },
  oneTimeBadgeText: {
    color: colors.warningText,
    fontSize: 10,
    fontWeight: '800',
  },

  cardBody: {
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.successStrong,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSubtle,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSubtle,
    fontSize: 14,
  },
  detailsBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'flex-end',
  },
  detailsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: 18,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  detailsEyebrow: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  detailsTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  detailsCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCloseText: {
    color: colors.textSecondary,
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 28,
  },
  detailsRouteBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  detailsRouteLabel: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailsRouteText: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  detailsAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailsAmountBlock: {
    alignItems: 'flex-end',
  },
  detailsLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  detailsValue: {
    color: colors.textBody,
    fontSize: 15,
    fontWeight: '700',
  },
  detailsAmount: {
    color: colors.successStrong,
    fontSize: 24,
    fontWeight: '900',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  detailCell: {
    width: '50%',
    paddingVertical: 10,
  },
  cashbackValue: {
    color: colors.warningStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  transactionBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,

  },
  transactionText: {
    color: colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
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
  overlayCard: {
    backgroundColor: colors.surface,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.successStrong,
    letterSpacing: 1,
  },
  overlayAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 4,
  },
  overlayDetailsBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginVertical: 16,
  },
  overlayDetailText: {
    fontSize: 14,
    color: colors.textBody,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
  },
  overlayDismissHint: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 8,
  },
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayBlack,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  qrModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  qrCloseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  qrCloseText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: 'center',
    zIndex: 50,
  },
  fabIconBackground: {
    backgroundColor: colors.primary,
    width: 64,
    height: 64,
    padding: 10,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
