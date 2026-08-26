import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
import colors from '../theme/colors';

const PRIMARY_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';
const FALLBACK_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';

export default function ShiftSelectScreen({ route, navigation }) {
  const [conductor, setConductor] = useState(route?.params?.conductor || null);
  const [assignedBus, setAssignedBus] = useState(route?.params?.assignedBus || null);
  const [loading, setLoading] = useState(!route?.params?.conductor && !route?.params?.assignedBus);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals for Home Options
  const [showQr, setShowQr] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBusDetailsModal, setShowBusDetailsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Payment History State
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);

  const fetchPaymentHistory = async (busId) => {
    if (!busId) return;
    setHistoryLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      let res;
      try {
        res = await fetch(`${PRIMARY_API_BASE}/tickets/${busId}`, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        res = await fetch(`${FALLBACK_API_BASE}/tickets/${busId}`);
      }

      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setPaymentHistory(list);

        const total = list.reduce((acc, curr) => {
          if (curr.razorpay_payment_id === 'monthly_pass') return acc;
          return acc + (parseFloat(curr.paidamount) || parseFloat(curr.amount) || 0);
        }, 0);
        setTotalCollection(total);
      }
    } catch (e) {
      // ignore history load error
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAssignedBus = useCallback(async (cond) => {
    if (!cond || !cond.conductor_id) {
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let res;
      try {
        res = await fetch(`${PRIMARY_API_BASE}/conductor/my-bus/${cond.conductor_id}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        try {
          res = await fetch(`${FALLBACK_API_BASE}/conductor/my-bus/${cond.conductor_id}`);
        } catch (e2) {
          throw new Error('Could not connect to server');
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.conductor) {
          setConductor(data.conductor);
          await AsyncStorage.setItem('@conductor_session', JSON.stringify(data.conductor));
        }
        setAssignedBus(data.assigned_bus);
        if (data.assigned_bus) {
          await AsyncStorage.setItem('@conductor_assigned_bus', JSON.stringify(data.assigned_bus));
          fetchPaymentHistory(data.assigned_bus.bus_id);
        } else {
          await AsyncStorage.removeItem('@conductor_assigned_bus');
        }
        setError(null);
      }
    } catch (e) {
      // do not block screen with error if cached data exists
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        let currentConductor = route?.params?.conductor || conductor;
        if (!currentConductor) {
          const sessionJson = await AsyncStorage.getItem('@conductor_session');
          if (sessionJson) {
            currentConductor = JSON.parse(sessionJson);
            if (isMounted) setConductor(currentConductor);
          } else {
            navigation.replace('Login');
            return;
          }
        }

        const savedBus = route?.params?.assignedBus || assignedBus;
        if (!savedBus) {
          const busJson = await AsyncStorage.getItem('@conductor_assigned_bus');
          if (busJson && isMounted) {
            const parsed = JSON.parse(busJson);
            setAssignedBus(parsed);
            fetchPaymentHistory(parsed.bus_id);
            setLoading(false);
          }
        } else if (savedBus && isMounted) {
          fetchPaymentHistory(savedBus.bus_id);
          setLoading(false);
        }

        if (currentConductor) {
          await fetchAssignedBus(currentConductor);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []); // Run on mount only


  const onRefresh = async () => {
    setRefreshing(true);
    if (conductor) {
      await fetchAssignedBus(conductor);
      if (assignedBus?.bus_id) {
        await fetchPaymentHistory(assignedBus.bus_id);
      }
    } else {
      setRefreshing(false);
    }
  };

  // Option 1: View Payment (Open Live Verification)
  const handleOpenLiveVerification = () => {
    if (!assignedBus) {
      Alert.alert(
        'No Bus Assigned',
        'You do not have a bus assigned to your profile. Please contact admin to assign a bus before viewing payments.'
      );
      return;
    }

    const busId = assignedBus.bus_id || 'BUS001';
    const busNo = assignedBus.bus_no || assignedBus.bus_number || busId;

    navigation.navigate('LiveVerification', {
      busId,
      busNo,
      conductor,
      assignedBus,
    });
  };

  // Option 2: Open Show QR Code Modal
  const handleOpenQrCode = () => {
    if (!assignedBus) {
      Alert.alert('No Bus Assigned', 'Please contact admin to assign a bus before showing QR code.');
      return;
    }
    setShowQr(true);
  };

  // Option 3: Open Payment History Screen
  const handleOpenPaymentHistory = () => {
    navigation.navigate('PaymentHistory', {
      conductor,
      assignedBus,
    });
  };


  // Option 4: Open Bus Details Modal
  const handleOpenBusDetails = () => {
    setShowBusDetailsModal(true);
  };

  // Option 5: Open Profile Modal
  const handleOpenProfile = () => {
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the conductor app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setShowProfileModal(false);
          await AsyncStorage.removeItem('@conductor_session');
          await AsyncStorage.removeItem('@conductor_assigned_bus');
          navigation.replace('Login');
        },
      },
    ]);
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const busId = assignedBus?.bus_id || 'BUS001';
  const busQrUrl = `https://bus.shreemateshwaribus.com/bus/${busId}`;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Header with Conductor Profile & Quick Logout */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleOpenProfile}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {conductor?.name ? conductor.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.conductorName} numberOfLines={1}>
              {conductor?.name || 'Conductor Portal'}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.conductorId}>
                {conductor?.conductor_id || 'COND-XX'} • {conductor?.mobile || ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryText}
            colors={[colors.primaryText]}
          />
        }
      >
        {/* Welcome Greeting & Active Bus Chip */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingEyebrow}>CONDUCTOR HOME</Text>
              <Text style={styles.greetingTitle}>
                Namaste, {conductor?.name?.split(' ')[0] || 'Conductor'} 👋
              </Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{todayStr}</Text>
            </View>
          </View>

          {/* Assigned Bus Tag */}
          {assignedBus ? (
            <View style={styles.busPill}>
              <View style={styles.busPillDot} />
              <Text style={styles.busPillText} numberOfLines={1}>
                Assigned Bus: <Text style={styles.boldText}>{assignedBus.bus_no || assignedBus.bus_number || assignedBus.bus_id}</Text> ({assignedBus.origin || assignedBus.origin_city} ➔ {assignedBus.destination || assignedBus.destination_city})
              </Text>
            </View>
          ) : (
            <View style={[styles.busPill, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <Text style={[styles.busPillText, { color: '#b91c1c' }]}>
                ⚠️ No Bus Assigned to your profile
              </Text>
            </View>
          )}
        </View>

        {loading && !assignedBus && !conductor ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primaryText} />
            <Text style={styles.stateText}>Loading your dashboard...</Text>
          </View>
        ) : error && !assignedBus && !conductor ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry Sync</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Quick Services Section */}
            <View style={styles.optionsSection}>
              <Text style={styles.sectionHeading}>Quick Services</Text>

              {/* 1. Today's Shift Collection Card -> Opens Live Verification */}
              {assignedBus && (
                <TouchableOpacity
                  style={styles.summaryCard}
                  onPress={handleOpenLiveVerification}
                  activeOpacity={0.85}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryTagRow}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.summaryEyebrow}>TODAY'S SHIFT COLLECTION • LIVE</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onRefresh();
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.refreshLink}>🔄 Sync</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.summaryRow}>
                    <View>
                      <Text style={styles.summaryAmount}>₹{totalCollection}</Text>
                      <Text style={styles.summaryLabel}>Total UPI & QR Collections</Text>
                    </View>
                    <View style={styles.summaryBadge}>
                      <Text style={styles.summaryBadgeNumber}>{paymentHistory.length}</Text>
                      <Text style={styles.summaryBadgeLabel}>Tickets Paid</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* 2. SHOW BUS QR CODE HERO CARD */}
              <TouchableOpacity
                style={styles.qrOptionCard}
                onPress={handleOpenQrCode}
                activeOpacity={0.85}
              >
                <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Text style={styles.gridEmoji}>📲</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.qrBadgeRow}>
                    <Text style={styles.qrBadgeText}>PASSENGER SCAN & PAY</Text>
                  </View>
                  <Text style={styles.qrCardTitle}>Show Bus QR Code</Text>
                  <Text style={styles.qrCardSubtitle}>
                    Display booking QR code for passengers to scan & pay on bus
                  </Text>
                </View>
                <View style={styles.qrActionPill}>
                  <Text style={styles.qrActionPillText}>Show QR ›</Text>
                </View>
              </TouchableOpacity>

              {/* Grid for Payment History & Bus Details */}
              <View style={styles.gridContainer}>
                {/* 3. PAYMENT HISTORY */}
                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={handleOpenPaymentHistory}
                  activeOpacity={0.85}
                >
                  <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={styles.gridEmoji}>📜</Text>
                  </View>
                  <Text style={styles.gridTitle}>Payment History</Text>
                  <Text style={styles.gridDesc}>
                    {paymentHistory.length} Tickets • ₹{totalCollection} Today
                  </Text>
                  <View style={styles.gridFooter}>
                    <Text style={[styles.gridActionText, { color: colors.successStrong }]}>
                      View Logs ›
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. BUS DETAILS */}
                <TouchableOpacity
                  style={styles.gridCard}
                  onPress={handleOpenBusDetails}
                  activeOpacity={0.85}
                >
                  <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Text style={styles.gridEmoji}>🚍</Text>
                  </View>
                  <Text style={styles.gridTitle}>Bus Details</Text>
                  <Text style={styles.gridDesc} numberOfLines={2}>
                    {assignedBus ? (assignedBus.bus_no || assignedBus.bus_id) : 'Not Assigned'} • Route Info
                  </Text>
                  <View style={styles.gridFooter}>
                    <Text style={[styles.gridActionText, { color: colors.primaryText }]}>
                      View Specs ›
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 5. PROFILE CARD */}
              <TouchableOpacity
                style={styles.profileOptionCard}
                onPress={handleOpenProfile}
                activeOpacity={0.85}
              >
                <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={styles.gridEmoji}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileCardTitle}>Conductor Profile</Text>
                  <Text style={styles.profileCardSubtitle}>
                    {conductor?.name || 'Conductor'} ({conductor?.conductor_id || 'COND-XX'})
                  </Text>
                </View>
                <Text style={styles.profileCardArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>



      {/* ========================================================= */}
      {/* MODAL: SHOW BUS QR CODE MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showQr}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQr(false)}
      >
        <Pressable style={styles.qrModalBackdrop} onPress={() => setShowQr(false)}>
          <Pressable style={styles.qrModalCard} onPress={() => { }}>
            <View style={styles.qrHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrTitle}>Bus Booking QR</Text>
                <Text style={styles.qrSubtitle} numberOfLines={1}>
                  {assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id || 'Assigned Bus'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowQr(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {assignedBus && (
              <View style={styles.qrRouteBox}>
                <Text style={styles.qrRouteText} numberOfLines={1}>
                  {assignedBus.origin || assignedBus.origin_city || 'Origin'} ➔ {assignedBus.destination || assignedBus.destination_city || 'Destination'}
                </Text>
              </View>
            )}

            <View style={styles.qrBox}>
              <QRCode
                value={busQrUrl}
                size={230}
              />
            </View>

            <Text style={styles.qrScanHint}>
              📲 Ask passengers to scan this QR code with any UPI app or Camera to buy ticket online.
            </Text>

            <TouchableOpacity style={styles.qrCloseButton} onPress={() => setShowQr(false)}>
              <Text style={styles.qrCloseText}>Close QR Code</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 1: PAYMENT HISTORY MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Payment History</Text>
                <Text style={styles.modalSubtitle}>
                  Bus {assignedBus?.bus_no || assignedBus?.bus_id || ''} • Total: ₹{totalCollection} ({paymentHistory.length} Tickets)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowHistoryModal(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="small" color={colors.primaryText} />
                <Text style={styles.modalLoadingText}>Loading payments...</Text>
              </View>
            ) : paymentHistory.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🧾</Text>
                <Text style={styles.emptyTitle}>No verified payments today</Text>
                <Text style={styles.emptyDesc}>
                  Passenger payments for this bus will appear here in real time.
                </Text>
              </View>
            ) : (
              <FlatList
                data={paymentHistory}
                keyExtractor={(item) => String(item.ticket_id || Math.random())}
                renderItem={({ item }) => {
                  const isPass = item.razorpay_payment_id === 'monthly_pass';
                  const time = item.created_at
                    ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Today';

                  return (
                    <View style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <View style={[styles.historyBadge, isPass ? styles.passBadge : styles.upiBadge]}>
                          <Text style={isPass ? styles.passBadgeText : styles.upiBadgeText}>
                            {isPass ? 'PASS' : 'UPI'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTicketId}>#{item.ticket_id}</Text>
                          <Text style={styles.historyRoute} numberOfLines={1}>
                            {item.origin || 'Start'} ➔ {item.destination || 'End'}
                          </Text>
                          <Text style={styles.historyMeta}>
                            {item.passenger_count || 1} Passenger(s) • {time}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.historyItemRight}>
                        <Text style={isPass ? styles.historyAmountPass : styles.historyAmount}>
                          {isPass ? 'Free Pass' : `₹${item.paidamount ?? item.amount ?? 0}`}
                        </Text>
                        <Text style={styles.historyStatusText}>✓ Verified</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: BUS DETAILS MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showBusDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBusDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Bus & Route Details</Text>
                <Text style={styles.modalSubtitle}>Assigned Fleet Vehicle Information</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowBusDetailsModal(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {assignedBus ? (
              <ScrollView style={{ maxHeight: 400 }}>
                {/* Bus Number Hero Banner */}
                <View style={styles.busDetailsHero}>
                  <Text style={styles.busDetailsEmoji}>🚍</Text>
                  <Text style={styles.busDetailsNumber}>
                    {assignedBus.bus_no || assignedBus.bus_number || assignedBus.bus_id}
                  </Text>
                  <Text style={styles.busDetailsId}>ID: {assignedBus.bus_id}</Text>
                  <View style={styles.busStatusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.busStatusPillText}>{assignedBus.status || 'ACTIVE'}</Text>
                  </View>
                </View>

                {/* Specs List */}
                <View style={styles.specsList}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>ORIGIN CITY</Text>
                    <Text style={styles.specVal}>
                      {assignedBus.origin || assignedBus.origin_city || 'Origin'}
                    </Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>DESTINATION CITY</Text>
                    <Text style={styles.specVal}>
                      {assignedBus.destination || assignedBus.destination_city || 'Destination'}
                    </Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>STANDARD FARE</Text>
                    <Text style={styles.specVal}>₹{assignedBus.fare_amount || 50} per ride</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>ASSIGNED CONDUCTOR</Text>
                    <Text style={styles.specVal}>{conductor?.name || 'You'}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>OPERATOR FLEET</Text>
                    <Text style={styles.specVal}>Shree Mateshwari Express</Text>
                  </View>
                </View>

                {/* Quick Button to Show Bus QR */}
                <TouchableOpacity
                  style={styles.busDetailsQrBtn}
                  onPress={() => {
                    setShowBusDetailsModal(false);
                    setShowQr(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.busDetailsQrBtnText}>📲 View Passenger Booking QR Code</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🛑</Text>
                <Text style={styles.emptyTitle}>No Bus Assigned</Text>
                <Text style={styles.emptyDesc}>
                  Please contact depot manager to assign a bus to your profile.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowBusDetailsModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: PROFILE MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Conductor Profile</Text>
                <Text style={styles.modalSubtitle}>Employee Account Information</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Profile Avatar Block */}
              <View style={styles.profileModalHeader}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLargeText}>
                    {conductor?.name ? conductor.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text style={styles.profileModalName}>{conductor?.name || 'Conductor'}</Text>
                <Text style={styles.profileModalId}>{conductor?.conductor_id || 'COND-XX'}</Text>
                <View style={styles.profileVerifiedBadge}>
                  <Text style={styles.profileVerifiedText}>✓ ACTIVE & VERIFIED</Text>
                </View>
              </View>

              {/* Conductor Details */}
              <View style={styles.specsList}>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>MOBILE NUMBER</Text>
                  <Text style={styles.specVal}>{conductor?.mobile || 'N/A'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.specVal}>{conductor?.email || 'N/A'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>ASSIGNED BUS ID</Text>
                  <Text style={[styles.specVal, { color: colors.primaryText, fontWeight: '800' }]}>
                    {assignedBus?.bus_id || conductor?.assigned_bus_id || 'None'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>DEPOT / PORTAL</Text>
                  <Text style={styles.specVal}>Shree Mateshwari Bus Service</Text>
                </View>
              </View>

              {/* Logout Action Inside Profile */}
              <TouchableOpacity
                style={styles.profileLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.profileLogoutBtnText}>🚪 Log Out From App</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 40 : 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.primarySurface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  conductorName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  conductorId: {
    color: colors.primaryMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  container: {
    padding: 18,
    paddingBottom: 80,
  },
  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  greetingEyebrow: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  greetingTitle: {
    color: colors.textStrong,
    fontSize: 19,
    fontWeight: '900',
  },
  dateBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  busPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  busPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  busPillText: {
    color: colors.textBody,
    fontSize: 12,
    flex: 1,
  },
  boldText: {
    fontWeight: '800',
    color: colors.textStrong,
  },
  optionsSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  summaryEyebrow: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  refreshLink: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryAmount: {
    color: colors.successStrong,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryBadgeNumber: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '900',
  },
  summaryBadgeLabel: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  summaryFooterText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryFooterArrow: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '900',
  },
  qrOptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  qrBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  qrBadgeText: {
    color: colors.primaryText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  qrCardTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '900',
  },
  qrCardSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginRight: 6,
  },
  qrActionPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  qrActionPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gridEmoji: {
    fontSize: 22,
  },
  gridTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  gridDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  gridFooter: {
    marginTop: 'auto',
  },
  gridActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  profileOptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileCardTitle: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  profileCardSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  profileCardArrow: {
    color: colors.textSubtle,
    fontSize: 20,
    fontWeight: '800',
  },
  stateBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIconBackground: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  // QR Code Modal Styles
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textStrong,
  },
  qrSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  qrRouteBox: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  qrRouteText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrScanHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 14,
    marginBottom: 16,
  },
  qrCloseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  // Modal General Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '85%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  modalLoadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  upiBadge: {
    backgroundColor: colors.successSoft,
  },
  passBadge: {
    backgroundColor: colors.warningSoft,
  },
  upiBadgeText: {
    color: colors.successText,
    fontSize: 10,
    fontWeight: '900',
  },
  passBadgeText: {
    color: colors.warningText,
    fontSize: 10,
    fontWeight: '900',
  },
  historyTicketId: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  historyRoute: {
    color: colors.textBody,
    fontSize: 11,
    fontWeight: '600',
  },
  historyMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    marginTop: 1,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    color: colors.successStrong,
    fontSize: 15,
    fontWeight: '900',
  },
  historyAmountPass: {
    color: colors.warningStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  historyStatusText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  modalDoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  busDetailsHero: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busDetailsEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  busDetailsNumber: {
    color: colors.textStrong,
    fontSize: 22,
    fontWeight: '900',
  },
  busDetailsId: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  busStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  busStatusPillText: {
    color: colors.successStrong,
    fontSize: 11,
    fontWeight: '800',
  },
  specsList: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  specLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  specVal: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  busDetailsQrBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  busDetailsQrBtnText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  profileModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primaryText,
  },
  profileAvatarLargeText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  profileModalName: {
    color: colors.textStrong,
    fontSize: 19,
    fontWeight: '900',
  },
  profileModalId: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  profileVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  profileVerifiedText: {
    color: colors.successStrong,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  profileLogoutBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  profileLogoutBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },
});
