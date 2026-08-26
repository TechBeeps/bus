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

const PRIMARY_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';

export default function LiveVerificationScreen({ route, navigation }) {
  const [conductor, setConductor] = useState(route?.params?.conductor || null);
  const [assignedBus, setAssignedBus] = useState(route?.params?.assignedBus || null);

  const busId = route?.params?.busId || assignedBus?.bus_id || 'BUS001';
  const busNo = route?.params?.busNo || assignedBus?.bus_number || assignedBus?.bus_no || '';

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

    let activeConductorId = conductor?.conductor_id || route?.params?.conductorId || null;
    const STORAGE_KEY = `@knownTicketIds_${activeConductorId || busId}`;

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
        let currentCondId = activeConductorId;
        if (!currentCondId) {
          try {
            const sessionJson = await AsyncStorage.getItem('@conductor_session');
            if (sessionJson) {
              const session = JSON.parse(sessionJson);
              currentCondId = session?.conductor_id;
              setConductor(session);
            }
          } catch (e) {
            // ignore
          }
        }

        let tickets = [];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        // Fetch using conductor ID endpoint (or fallback to bus ID)
        const fetchUrl = currentCondId
          ? `${PRIMARY_API_BASE}/tickets/conductor/${currentCondId}`
          : `${PRIMARY_API_BASE}/tickets/${busId}`;

        try {
          const res = await fetch(fetchUrl, {
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
  }, [busId, conductor]);

  const processIncomingTickets = async (tickets, persistFn) => {
    let sum = 0;
    const isFirst = firstLoadRef.current;

    tickets.forEach((ticket) => {
      const amt = parseFloat(ticket.paidamount) || parseFloat(ticket.amount) || 0;
      if (ticket.razorpay_payment_id !== 'monthly_pass' && ticket.payment_mode !== 'PASS') {
        sum += amt;
      }

      if (!isFirst && !knownTicketIds.current.has(ticket.ticket_id)) {
        triggerConductorAlert(ticket);
      }
      knownTicketIds.current.add(ticket.ticket_id);
    });

    // Always update list so it never stays stuck or empty
    setVerifiedTickets([...tickets]);
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
        const isPass = ticket.razorpay_payment_id === 'monthly_pass' || ticket.payment_mode === 'PASS';
        const displayAmt = isPass ? 'Monthly Pass' : `₹${ticket.paidamount ?? ticket.amount}`;

        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Payment received',
            body: `${displayAmt} - ${ticket.ticket_id} (Bus: ${ticket.bus_number || busNo})`,
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.exitShiftButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ShiftSelect', {
                  conductor,
                  assignedBus,
                });
              }
            }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.exitShiftText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.busTitle}>{busNo || assignedBus?.bus_number || busId}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.warning }]} />
              <Text style={styles.statusText}>
                {isOnline ? 'LIVE SYNC' : 'OFFLINE MODE'} • {conductor?.name || conductor?.conductor_id || 'Conductor'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.collectionBadge}>
          <Text style={styles.collectionLabel}>TODAY'S COLLECTION</Text>
          <Text style={styles.collectionValue}>₹{totalCollection}</Text>
        </View>
      </View>

      {/* Main Feed Container */}
      <View style={styles.feedContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Verified Payments ({verifiedTickets.length})</Text>
          <Text style={styles.subHeader}>Auto-refreshing live</Text>
        </View>

        <FlatList
          data={verifiedTickets}
          keyExtractor={(item) => String(item.ticket_id || item.payment_id || Math.random())}
          renderItem={({ item }) => {
            const isPass = item.razorpay_payment_id === 'monthly_pass' || item.payment_mode === 'PASS';
            const fareAmount = isPass ? 0 : (item.fare || item.amount || 0);
            const cashbackAmount = isPass ? 0 : (item.cashback || 0);
            const paidAmount = isPass ? 0 : (item.paidamount ?? item.total_paid ?? item.amount ?? 0);

            return (
              <TouchableOpacity
                style={styles.ticketCard}
                activeOpacity={0.85}
                onPress={() => setSelectedTicket(item)}
              >
                {/* Header: Ticket ID, Bus Number & Mode Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.ticketIdRow}>
                    <Text style={styles.ticketId}>#{item.ticket_id}</Text>
                    <View style={styles.busBadge}>
                      <Text style={styles.busBadgeText}>🚍 {item.bus_number || item.bus_no || busNo || item.bus_id}</Text>
                    </View>
                  </View>

                  <View style={isPass ? styles.passBadge : styles.oneTimeBadge}>
                    <Text style={isPass ? styles.passBadgeText : styles.oneTimeBadgeText}>
                      {isPass ? 'Monthly Pass' : 'UPI Payment'}
                    </Text>
                  </View>
                </View>

                {/* Route & Passengers */}
                <View style={styles.cardBody}>
                  <Text style={styles.routeText}>{item.origin} ➔ {item.destination}</Text>
                  <Text style={styles.metaText}>
                    👥 {item.passenger_count || 1} Passenger(s) • ⏰ {item.created_at ? (item.created_at.includes('T') ? item.created_at.split('T')[1].substring(0, 5) : item.created_at.split(' ')[1]?.substring(0, 5) || 'Today') : 'Just Now'}
                  </Text>
                </View>

                {/* 3-Column Breakdown: FARE | CASHBACK | TOTAL PAID */}
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownCol}>
                    <Text style={styles.breakdownLabel}>FARE</Text>
                    <Text style={styles.breakdownValue}>{isPass ? '₹0' : `₹${fareAmount}`}</Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownCol}>
                    <Text style={styles.breakdownLabel}>CASHBACK</Text>
                    <Text style={[styles.breakdownValue, cashbackAmount > 0 && styles.cashbackGreen]}>
                      {cashbackAmount > 0 ? `-₹${cashbackAmount}` : '₹0'}
                    </Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownCol}>
                    <Text style={styles.breakdownLabel}>TOTAL PAID</Text>
                    <Text style={[styles.breakdownValue, isPass ? styles.paidPassText : styles.paidUpiText]}>
                      {isPass ? 'PASS RIDE' : `₹${paidAmount}`}
                    </Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailsText}>Tap to view full receipt  ›</Text>
                  <View style={styles.verifiedCheckBadge}>
                    <Text style={styles.verifiedCheckText}>✓ Verified</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎫</Text>
              <Text style={styles.emptyTitle}>Waiting for passenger scans...</Text>
              <Text style={styles.emptySubtitle}>Live payments verified by conductor will appear here instantly.</Text>
            </View>
          }
        />
      </View>

      {/* Alert Overlay on New Ticket Scan */}
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
            <Text style={latestTicket.razorpay_payment_id === 'monthly_pass' || latestTicket.payment_mode === 'PASS' ? styles.overlayAmountPass : styles.overlayAmount}>
              {latestTicket.razorpay_payment_id === 'monthly_pass' || latestTicket.payment_mode === 'PASS' ? 'Monthly Pass' : `₹${latestTicket.paidamount ?? latestTicket.amount}`}
            </Text>
            <View style={styles.overlayDetailsBox}>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Ticket ID:</Text> #{latestTicket.ticket_id}
              </Text>
              <Text style={styles.overlayDetailText}>
                <Text style={styles.bold}>Bus:</Text> {latestTicket.bus_number || latestTicket.bus_no || busNo}
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

      {/* Modal: Ticket Details Receipt */}
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
                    <Text style={styles.detailsEyebrow}>VERIFIED RECEIPT</Text>
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
                  <Text style={styles.detailsRouteLabel}>JOURNEY ROUTE</Text>
                  <Text style={styles.detailsRouteText}>{selectedTicket.origin}  ➔  {selectedTicket.destination}</Text>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>BUS NUMBER</Text>
                    <Text style={styles.detailsValue}>{selectedTicket.bus_number || selectedTicket.bus_no || busNo || selectedTicket.bus_id}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>PASSENGERS</Text>
                    <Text style={styles.detailsValue}>{selectedTicket.passenger_count ?? 1}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>TIME</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTicket.created_at ? (selectedTicket.created_at.includes('T') ? selectedTicket.created_at.split('T')[1].substring(0, 5) : selectedTicket.created_at.split(' ')[1]?.substring(0, 5) || 'Today') : 'Just Now'}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>PAYMENT MODE</Text>
                    <Text style={styles.detailsValue}>
                      {selectedTicket.razorpay_payment_id === 'monthly_pass' || selectedTicket.payment_mode === 'PASS' ? 'Monthly Pass' : 'Razorpay UPI'}
                    </Text>
                  </View>
                </View>

                {/* Amount Breakup */}
                <View style={styles.receiptBreakupCard}>
                  <View style={styles.receiptBreakupRow}>
                    <Text style={styles.receiptBreakupLabel}>Standard Fare</Text>
                    <Text style={styles.receiptBreakupVal}>₹{selectedTicket.fare || selectedTicket.amount || 0}</Text>
                  </View>

                  <View style={styles.receiptBreakupRow}>
                    <Text style={styles.receiptBreakupLabel}>Cashback Discount</Text>
                    <Text style={[styles.receiptBreakupVal, { color: colors.primaryText, fontWeight: '800' }]}>
                      {selectedTicket.cashback > 0 ? `- ₹${selectedTicket.cashback}` : '₹0.00'}
                    </Text>
                  </View>

                  <View style={[styles.receiptBreakupRow, styles.receiptBreakupTotalRow]}>
                    <Text style={styles.receiptTotalLabel}>TOTAL PAID AMOUNT</Text>
                    <Text style={styles.receiptTotalVal}>
                      {selectedTicket.razorpay_payment_id === 'monthly_pass' || selectedTicket.payment_mode === 'PASS'
                        ? 'FREE PASS RIDE'
                        : `₹${selectedTicket.paidamount ?? selectedTicket.total_paid ?? selectedTicket.amount ?? 0}`}
                    </Text>
                  </View>
                </View>

                {selectedTicket.razorpay_payment_id && selectedTicket.razorpay_payment_id !== 'monthly_pass' && (
                  <View style={styles.transactionBox}>
                    <Text style={styles.detailsLabel}>TRANSACTION ID</Text>
                    <Text style={styles.transactionText}>{selectedTicket.razorpay_payment_id}</Text>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Floating QR Button */}
      <TouchableOpacity
        style={styles.qrFloatingButton}
        onPress={() => setShowQr(true)}
        activeOpacity={0.85}
      >
        <View style={styles.qrIconInner}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="#ffffff">
            <Path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-5 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm0 2h3v2h-3v-2z" />
          </Svg>
        </View>
      </TouchableOpacity>

      {/* QR Code Modal */}
      <Modal
        visible={showQr}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQr(false)}
      >
        <Pressable style={styles.qrModalBackdrop} onPress={() => setShowQr(false)}>
          <Pressable style={styles.qrModalCard} onPress={() => { }}>
            <Text style={styles.qrTitle}>Bus QR Code</Text>
            <Text style={styles.qrSubtitle}>Bus: {busNo || busId}</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={`https://bus.shreemateshwaribus.com/bus/${busId}`}
                size={240}
              />
            </View>

            <Pressable style={styles.qrCloseButton} onPress={() => setShowQr(false)}>
              <Text style={styles.qrCloseText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    fontSize: 22,
    fontWeight: '700',
  },
  busTitle: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: colors.primaryMuted,
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textStrong,
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    fontWeight: '900',
    color: colors.textStrong,
    fontSize: 14,
  },
  busBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  busBadgeText: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
  },
  oneTimeBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  oneTimeBadgeText: {
    color: colors.successText,
    fontSize: 9,
    fontWeight: '900',
  },
  passBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  passBadgeText: {
    color: colors.warningText,
    fontSize: 9,
    fontWeight: '900',
  },
  cardBody: {
    marginBottom: 10,
  },
  routeText: {
    color: colors.textBody,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 8,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  breakdownLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSubtle,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textStrong,
  },
  cashbackGreen: {
    color: colors.primaryText,
    fontWeight: '900',
  },
  paidUpiText: {
    color: colors.successStrong,
    fontWeight: '900',
    fontSize: 13,
  },
  paidPassText: {
    color: colors.warningStrong,
    fontWeight: '900',
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  viewDetailsText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedCheckBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedCheckText: {
    color: colors.successStrong,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayCard: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  overlayIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  overlayCheckmark: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  overlayAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.successStrong,
    marginVertical: 6,
  },
  overlayAmountPass: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.warningStrong,
    marginVertical: 6,
  },
  overlayDetailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
  },
  overlayDetailText: {
    color: colors.textBody,
    fontSize: 12,
    marginVertical: 2,
  },
  bold: {
    fontWeight: '700',
    color: colors.textStrong,
  },
  overlayDismissHint: {
    color: colors.textSubtle,
    fontSize: 11,
    marginTop: 6,
  },
  detailsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailsSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailsEyebrow: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailsTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  detailsCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCloseText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  detailsRouteBox: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  detailsRouteLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailsRouteText: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  detailCell: {
    width: '50%',
    paddingVertical: 6,
  },
  detailsLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
  },
  detailsValue: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  receiptBreakupCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  receiptBreakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  receiptBreakupLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  receiptBreakupVal: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  receiptBreakupTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 6,
    paddingTop: 8,
  },
  receiptTotalLabel: {
    color: colors.successStrong,
    fontSize: 12,
    fontWeight: '900',
  },
  receiptTotalVal: {
    color: colors.successStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  transactionBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
  },
  transactionText: {
    color: colors.textStrong,
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 2,
  },
  qrFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  qrIconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  qrSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrCloseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
