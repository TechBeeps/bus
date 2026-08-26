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
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { playVerificationChime } from '../services/AudioService';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const knownTicketIds = useRef(new Set());
  const firstLoadRef = useRef(true);
  const appState = useRef(AppState.currentState);

  const fetchUpdates = async () => {
    try {
      let activeConductorId = conductor?.conductor_id || route?.params?.conductorId || null;
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

      await processIncomingTickets(tickets);

      if (firstLoadRef.current) {
        firstLoadRef.current = false;
      }
    } catch (error) {
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  const processIncomingTickets = async (tickets) => {
    let sum = 0;
    const isFirst = firstLoadRef.current;

    tickets.forEach((ticket) => {
      const isPass = ticket.razorpay_payment_id === 'monthly_pass' || ticket.payment_mode === 'PASS' || ticket.razorpay_payment_id === 'free_milestone_ride';
      const paidVal = parseFloat(ticket.total_paid !== undefined ? ticket.total_paid : (ticket.paidamount !== undefined ? ticket.paidamount : ticket.amount)) || 0;

      if (!isPass) {
        sum += paidVal;
      }

      if (!isFirst && !knownTicketIds.current.has(ticket.ticket_id)) {
        triggerConductorAlert(ticket);
      }
      knownTicketIds.current.add(ticket.ticket_id);
    });

    setVerifiedTickets([...tickets]);
    setTotalCollection(Math.round(sum * 100) / 100);

    try {
      let activeConductorId = conductor?.conductor_id || route?.params?.conductorId || null;
      const STORAGE_KEY = `@knownTicketIds_${activeConductorId || busId}`;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownTicketIds.current)));
    } catch (e) {
      // ignore
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUpdates();
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
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
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
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.busTitle}>{busNo || assignedBus?.bus_number || busId}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
              <Text style={styles.statusText}>
                {isOnline ? 'LIVE SYNC' : 'OFFLINE MODE'} • {conductor?.name || conductor?.conductor_id || 'Conductor'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.collectionBadge}>
          <Text style={styles.collectionLabel}>TODAY'S</Text>
          <Text style={styles.collectionValue}>₹{totalCollection}</Text>
        </View>
      </View>

      {/* Main Feed Container */}
      <View style={styles.feedContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Verified Payments ({verifiedTickets.length})</Text>
          <Text style={styles.subHeader}>Auto-refreshing live</Text>
        </View>

        {loading && !refreshing && verifiedTickets.length === 0 ? (
          <View style={styles.singleLoadingContainer}>
            <View style={styles.loadingSpinnerCircle}>
              <ActivityIndicator size="large" color={colors.primaryText} />
            </View>
            <Text style={styles.loadingStateTitle}>Loading Live Feed...</Text>
            <Text style={styles.loadingStateSubtitle}>
              Connecting to bus server & fetching verified tickets
            </Text>
          </View>
        ) : (
          <FlatList
            data={verifiedTickets}
            keyExtractor={(item) => String(item.ticket_id || item.payment_id || Math.random())}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryText}
                colors={[colors.primaryText]}
              />
            }
            renderItem={({ item }) => {
              const isPass = item.payment_mode === 'PASS' || item.razorpay_payment_id === 'monthly_pass';
              const fareAmount = isPass ? 0 : (item.fare || item.amount || 0);
              const cashbackAmount = isPass ? 0 : (item.cashback || 0);
              const paidAmount = isPass ? 0 : (item.paidamount ?? item.total_paid ?? item.amount ?? 0);

              return (
                <TouchableOpacity
                  style={styles.ticketCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedTicket(item)}
                >
                  {/* Ticket Card Top */}
                  <View style={styles.ticketCardHeader}>
                    <View style={styles.ticketIdRow}>
                      <Text style={styles.ticketIdText}>#{item.ticket_id}</Text>
                      {/* Bus Number Pill */}
                      <View style={styles.busNumberPill}>
                        <Text style={styles.busNumberPillText}>
                          🚍 {item.bus_number || item.bus_no || busNo || item.bus_id || 'BUS'}
                        </Text>
                      </View>
                    </View>

                    {/* Mode Badge */}
                    <View style={[styles.modeBadge, isPass ? styles.modeBadgePass : styles.modeBadgeUpi]}>
                      <Text style={[styles.modeBadgeText, isPass ? styles.modeBadgePassText : styles.modeBadgeUpiText]}>
                        {isPass ? 'MONTHLY PASS' : 'UPI PAYMENT'}
                      </Text>
                    </View>
                  </View>

                  {/* Route & Passenger Details */}
                  <View style={styles.ticketBody}>
                    <Text style={styles.routeText} numberOfLines={1}>
                      {item.origin} ➔ {item.destination}
                    </Text>
                    <Text style={styles.passengerText}>
                      👥 {item.passenger_count || 1} Passenger(s) • ⏰ {item.created_at ? (item.created_at.includes('T') ? item.created_at.split('T')[1].substring(0, 5) : item.created_at.split(' ')[1]?.substring(0, 5) || 'Today') : 'Just Now'}
                    </Text>
                  </View>

                  {/* Explicit 3-Column Breakdown: FARE | CASHBACK | TOTAL PAID */}
                  <View style={styles.priceBreakdownBox}>
                    <View style={styles.priceColumn}>
                      <Text style={styles.priceColLabel}>FARE</Text>
                      <Text style={styles.priceColValue}>
                        {isPass ? '₹0' : `₹${fareAmount}`}
                      </Text>
                    </View>

                    <View style={styles.priceDivider} />

                    <View style={styles.priceColumn}>
                      <Text style={styles.priceColLabel}>CASHBACK</Text>
                      <Text style={[styles.priceColValue, cashbackAmount > 0 ? styles.cashbackPositiveText : styles.priceColValueNeutral]}>
                        {cashbackAmount > 0 ? `-₹${cashbackAmount}` : '₹0'}
                      </Text>
                    </View>

                    <View style={styles.priceDivider} />

                    <View style={styles.priceColumn}>
                      <Text style={styles.priceColLabel}>TOTAL PAID</Text>
                      <Text style={[styles.priceColValue, isPass ? styles.pricePaidPassText : styles.pricePaidUpiText]}>
                        {isPass ? 'PASS RIDE' : `₹${paidAmount}`}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Status Checkmark */}
                  <View style={styles.ticketCardFooter}>
                    <Text style={styles.ticketTimeText}>
                      {item.created_at ? item.created_at.slice(0, 19).replace('T', ' ') : 'Verified'}
                    </Text>

                    <View style={styles.verifiedRow}>
                      <Text style={styles.verifiedText}>✓ Verified & Paid</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎫</Text>
                <Text style={styles.emptyTitle}>Waiting for passenger scans...</Text>
                <Text style={styles.emptySubtitle}>
                  Live payments verified by conductor will appear here instantly.
                </Text>
                <TouchableOpacity style={styles.emptyRetryBtn} onPress={onRefresh}>
                  <Text style={styles.emptyRetryBtnText}>🔄 Refresh Now</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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

      {/* Modal: Ticket Details Receipt Bottom Sheet */}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 44 : 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  busTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
  },
  collectionBadge: {
    backgroundColor: '#312e81',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  collectionLabel: {
    color: '#c7d2fe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  // SINGLE LOADING VIEW
  singleLoadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingSpinnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingStateTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  loadingStateSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  // TICKET CARD (IDENTICAL TO PAYMENT HISTORY)
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketCardHeader: {
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
  ticketIdText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  busNumberPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  busNumberPillText: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeBadgeUpi: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  modeBadgePass: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  modeBadgeUpiText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
  },
  modeBadgePassText: {
    color: '#d97706',
    fontSize: 9,
    fontWeight: '900',
  },
  ticketBody: {
    marginBottom: 12,
  },
  routeText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  passengerText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  priceBreakdownBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#e2e8f0',
  },
  priceColLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceColValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  priceColValueNeutral: {
    color: '#64748b',
  },
  cashbackPositiveText: {
    color: '#059669',
  },
  pricePaidUpiText: {
    color: '#059669',
  },
  pricePaidPassText: {
    color: '#d97706',
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ticketTimeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyRetryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyRetryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  // OVERLAY ALERT
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 24,
  },
  overlayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  overlayIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
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
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 1,
    marginBottom: 4,
  },
  overlayAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  overlayAmountPass: {
    fontSize: 24,
    fontWeight: '900',
    color: '#d97706',
    marginBottom: 16,
  },
  overlayDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overlayDetailText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  overlayDismissHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  // RECEIPT BOTTOM SHEET MODAL
  detailsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  detailsSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    maxHeight: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#cbd5e1',
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
    fontSize: 10,
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailsCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCloseText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 22,
  },
  detailsRouteBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsRouteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailsRouteText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  detailCell: {
    width: '50%',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  detailsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  receiptBreakupCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  receiptBreakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  receiptBreakupLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  receiptBreakupVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  receiptBreakupTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    marginTop: 6,
  },
  receiptTotalLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  receiptTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  transactionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  // FLOATING QR BUTTON
  qrFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  qrIconInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 16,
  },
  qrBox: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  qrCloseButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
});
