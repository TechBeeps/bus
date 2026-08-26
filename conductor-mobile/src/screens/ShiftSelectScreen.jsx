import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  Pressable,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import colors from '../theme/colors';

const PRIMARY_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';
const FALLBACK_API_BASE = 'http://144.91.82.187:8000/api/v1';

export default function ShiftSelectScreen({ route, navigation }) {
  const [conductor, setConductor] = useState(route?.params?.conductor || null);
  const [assignedBus, setAssignedBus] = useState(route?.params?.assignedBus || null);
  const [loading, setLoading] = useState(!route?.params?.assignedBus);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [showQr, setShowQr] = useState(false);
  const [showBusDetailsModal, setShowBusDetailsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showExitAppModal, setShowExitAppModal] = useState(false);

  // Conductor Live Shift & Collection Metrics State
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalCollection, setTotalCollection] = useState(0);
  const [todayTicketsCount, setTodayTicketsCount] = useState(0);
  const [todayCashback, setTodayCashback] = useState(0);
  const [busesDrivenToday, setBusesDrivenToday] = useState([]);

  const fetchConductorTodayMetrics = useCallback(async (condId) => {
    if (!condId) return;
    setHistoryLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      let res;
      try {
        res = await fetch(`${PRIMARY_API_BASE}/conductor/payment-history?conductor_id=${condId}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        res = await fetch(`${FALLBACK_API_BASE}/conductor/payment-history?conductor_id=${condId}`);
      }

      if (res && res.ok) {
        const data = await res.json();
        setTotalCollection(data.total_amount || 0);
        setTodayTicketsCount(data.total_tickets || 0);
        setTodayCashback(data.total_cashback || 0);
        setBusesDrivenToday(data.buses_covered || []);
        const list = Array.isArray(data.tickets) ? data.tickets : [];
        setPaymentHistory(list);
      }
    } catch (e) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const isLoggingOutRef = useRef(false);

  const fetchAssignedBus = useCallback(async (cond) => {
    if (!cond || !cond.conductor_id || isLoggingOutRef.current) {
      setLoading(false);
      return;
    }
    try {
      let res;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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

      if (res && res.ok && !isLoggingOutRef.current) {
        const data = await res.json();
        if (data.conductor && !isLoggingOutRef.current) {
          setConductor(data.conductor);
          const currentSession = await AsyncStorage.getItem('@conductor_session');
          if (currentSession && !isLoggingOutRef.current) {
            await AsyncStorage.setItem('@conductor_session', JSON.stringify(data.conductor));
          }
        }
        if (!isLoggingOutRef.current) {
          setAssignedBus(data.assigned_bus);
          if (data.assigned_bus) {
            const currentSession = await AsyncStorage.getItem('@conductor_session');
            if (currentSession && !isLoggingOutRef.current) {
              await AsyncStorage.setItem('@conductor_assigned_bus', JSON.stringify(data.assigned_bus));
            }
          } else {
            await AsyncStorage.removeItem('@conductor_assigned_bus');
          }
          setError(null);
        }
      }
    } catch (e) {
      // do not block screen with error if cached data exists
    } finally {
      if (!isLoggingOutRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isLoggingOutRef.current) return;
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
          }
        }

        if (currentConductor?.conductor_id && !isLoggingOutRef.current) {
          await fetchAssignedBus(currentConductor);
          await fetchConductorTodayMetrics(currentConductor.conductor_id);
        }
      } catch (e) {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // 4-second live interval to keep collection amount 100% updated in real-time
    const interval = setInterval(async () => {
      if (isLoggingOutRef.current) return;
      let condId = conductor?.conductor_id;
      if (!condId) {
        const s = await AsyncStorage.getItem('@conductor_session');
        if (s) condId = JSON.parse(s)?.conductor_id;
      }
      if (condId && isMounted && !isLoggingOutRef.current) {
        fetchConductorTodayMetrics(condId);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [conductor, fetchAssignedBus, fetchConductorTodayMetrics, route?.params]);

  const onRefresh = async () => {
    if (isLoggingOutRef.current) return;
    setRefreshing(true);
    let currentCond = conductor;
    if (!currentCond) {
      const s = await AsyncStorage.getItem('@conductor_session');
      if (s) currentCond = JSON.parse(s);
    }
    if (currentCond && !isLoggingOutRef.current) {
      await fetchAssignedBus(currentCond);
      if (currentCond.conductor_id && !isLoggingOutRef.current) {
        await fetchConductorTodayMetrics(currentCond.conductor_id);
      }
    }
    setRefreshing(false);
  };

  // Handle Android hardware back press when on root Home screen
  useEffect(() => {
    const backAction = () => {
      if (showQr) {
        setShowQr(false);
        return true;
      }
      if (showBusDetailsModal) {
        setShowBusDetailsModal(false);
        return true;
      }
      if (showProfileModal) {
        setShowProfileModal(false);
        return true;
      }
      if (showLogoutConfirmModal) {
        setShowLogoutConfirmModal(false);
        return true;
      }
      if (showExitAppModal) {
        setShowExitAppModal(false);
        return true;
      }

      // Show Custom Exit App Confirmation Popup
      setShowExitAppModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [showQr, showBusDetailsModal, showProfileModal, showLogoutConfirmModal, showExitAppModal]);

  // Option 1: View Payment (Open Live Verification)
  const handleOpenLiveVerification = () => {
    navigation.navigate('LiveVerification', {
      busId: assignedBus?.bus_id || 'BUS001',
      busNo: assignedBus?.bus_number || assignedBus?.bus_no || '',
      conductor,
      assignedBus,
    });
  };

  // Option 2: Show Bus QR Code
  const handleOpenQrCode = () => {
    setShowQr(true);
  };

  // Option 3: Payment History Dedicated Screen
  const handleOpenPaymentHistory = () => {
    navigation.navigate('PaymentHistory', {
      conductor,
      assignedBus,
    });
  };

  // Option 4: Bus Details
  const handleOpenBusDetails = () => {
    setShowBusDetailsModal(true);
  };

  // Option 5: Conductor Profile
  const handleOpenProfile = () => {
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    setShowProfileModal(false);
    setShowLogoutConfirmModal(true);
  };

  const confirmLogoutAction = async () => {
    setShowLogoutConfirmModal(false);
    setShowProfileModal(false);
    isLoggingOutRef.current = true;
    setConductor(null);
    setAssignedBus(null);
    try {
      await AsyncStorage.multiRemove([
        '@conductor_session',
        '@conductor_assigned_bus',
      ]);
      await AsyncStorage.removeItem('@conductor_session');
      await AsyncStorage.removeItem('@conductor_assigned_bus');
    } catch (e) {
      // ignore
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const busId = assignedBus?.bus_id || 'BUS001';
  const busQrUrl = `https://bus.shreemateshwaribus.com/bus/${busId}`;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

      {/* Top Header with Conductor Profile & Quick Logout */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleOpenProfile}
          activeOpacity={0.85}
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
                {conductor?.conductor_id || 'COND-01'} • ON DUTY
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryText}
            colors={[colors.primaryText]}
          />
        }
      >
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
          <View style={styles.optionsSection}>
            {/* 1. HERO CARD: TODAY'S COLLECTION • LIVE */}
            <TouchableOpacity
              style={styles.summaryCard}
              onPress={handleOpenLiveVerification}
              activeOpacity={0.9}
            >
              {/* Card Top Pill & Sync */}
              <View style={styles.summaryHeader}>
                <View style={styles.summaryTagRow}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.summaryEyebrow}>TODAY'S COLLECTION • LIVE</Text>
                </View>

              </View>

              {/* Amount Center */}
              <View style={styles.summaryMainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryAmount}>₹{totalCollection}</Text>
                  <Text style={styles.summaryLabel}>Total Verified UPI Revenue</Text>
                </View>
              </View>

              {/* 3-Column Metrics Breakdown inside Hero Card */}
              <View style={styles.heroMetricsGrid}>
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>TICKETS</Text>
                  <Text style={styles.heroMetricVal}>{todayTicketsCount}</Text>
                </View>

                <View style={styles.heroMetricDivider} />

                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>CASHBACK</Text>
                  <Text style={[styles.heroMetricVal, { color: '#6ee7b7' }]}>
                    {todayCashback > 0 ? `₹${todayCashback}` : '₹0'}
                  </Text>
                </View>

                <View style={styles.heroMetricDivider} />

                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>BUS ON DUTY</Text>
                  <Text style={styles.heroMetricVal} numberOfLines={1}>
                    {assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id || 'Not Assigned'}
                  </Text>
                </View>
              </View>

              {/* Footer CTA Bar */}
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryFooterText}>View All</Text>
                <View style={styles.summaryArrowPill}>
                  <Text style={styles.summaryFooterArrow}>➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Quick Actions Header */}
            <Text style={styles.sectionHeading}>Quick Services</Text>

            {/* 2. SHOW BUS QR CODE HERO ACTION CARD */}
            <TouchableOpacity
              style={styles.qrOptionCard}
              onPress={handleOpenQrCode}
              activeOpacity={0.85}
            >
              <View style={styles.qrIconBadge}>
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

            {/* 3. PAYMENT HISTORY CARD */}
            <TouchableOpacity
              style={styles.actionRowCard}
              onPress={handleOpenPaymentHistory}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <Text style={styles.gridEmoji}>📜</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Payment History</Text>
                <Text style={styles.actionCardSubtitle}>
                  Past dates, transaction logs & breakdown receipts
                </Text>
              </View>
              <View style={styles.actionArrowPill}>
                <Text style={styles.actionCardArrow}>›</Text>
              </View>
            </TouchableOpacity>

            {/* 4. FLEET VEHICLE DETAILS CARD */}
            <TouchableOpacity
              style={styles.actionRowCard}
              onPress={handleOpenBusDetails}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Text style={styles.gridEmoji}>🚍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Vehicle Details</Text>
                <Text style={styles.actionCardSubtitle}>
                  {assignedBus
                    ? `${assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id} • Route Specs`
                    : 'Tap to view fleet vehicle info'}
                </Text>
              </View>
              <View style={styles.actionArrowPill}>
                <Text style={styles.actionCardArrow}>›</Text>
              </View>
            </TouchableOpacity>

            {/* 5. CONDUCTOR PROFILE CARD */}
            <TouchableOpacity
              style={styles.actionRowCard}
              onPress={handleOpenProfile}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={styles.gridEmoji}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitle}>Profile</Text>
                <Text style={styles.actionCardSubtitle}>
                  {conductor?.name || 'Conductor'} ({conductor?.conductor_id || 'COND-01'})
                </Text>
              </View>
              <View style={styles.actionArrowPill}>
                <Text style={styles.actionCardArrow}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
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
                  {assignedBus?.origin || assignedBus?.origin_city || 'Origin'} ➔ {assignedBus?.destination || assignedBus?.destination_city || 'Destination'}
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
      {/* MODAL 2: BUS & ROUTE DETAILS BOTTOM SHEET */}
      {/* ========================================================= */}
      <Modal
        visible={showBusDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBusDetailsModal(false)}
      >
        <Pressable
          style={styles.detailsBackdrop}
          onPress={() => setShowBusDetailsModal(false)}
        >
          <Pressable style={styles.detailsSheet} onPress={() => { }}>
            <View style={styles.sheetHandle} />

            <View style={styles.detailsHeader}>
              <View>
                <Text style={styles.detailsEyebrow}>FLEET VEHICLE & ROUTE</Text>
                <Text style={styles.detailsTitle}>
                  {assignedBus ? (assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id) : 'Bus Details'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.detailsCloseButton}
                onPress={() => setShowBusDetailsModal(false)}
                accessibilityLabel="Close bus details"
              >
                <Text style={styles.detailsCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            {assignedBus ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* Route Banner Card */}
                <View style={styles.detailsRouteBox}>
                  <Text style={styles.detailsRouteLabel}>ASSIGNED ROUTE</Text>
                  <Text style={styles.detailsRouteText}>
                    {assignedBus?.origin || assignedBus?.origin_city || 'Origin'}  ➔  {assignedBus?.destination || assignedBus?.destination_city || 'Destination'}
                  </Text>
                </View>

                {/* 2x2 Specs Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>REGISTRATION</Text>
                    <Text style={styles.detailsValue}>
                      {assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id || 'None'}
                    </Text>
                  </View>

                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>DUTY STATUS</Text>
                    <View style={styles.statusPillSmall}>
                      <View style={styles.statusDotSmall} />
                      <Text style={styles.statusPillSmallText}>{assignedBus?.status || 'ACTIVE'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>STANDARD FARE</Text>
                    <Text style={styles.detailsValue}>₹{assignedBus?.fare_amount || 50} / seat</Text>
                  </View>

                  <View style={styles.detailCell}>
                    <Text style={styles.detailsLabel}>CONDUCTOR</Text>
                    <Text style={styles.detailsValue} numberOfLines={1}>
                      {conductor?.name || 'You'}
                    </Text>
                  </View>
                </View>

                {/* Operator & Fleet Details Card */}
                <View style={styles.operatorCard}>
                  <View style={styles.operatorRow}>
                    <Text style={styles.operatorLabel}>Operator Fleet</Text>
                    <Text style={styles.operatorVal}>Shree Mateshwari Express</Text>
                  </View>
                  <View style={styles.operatorRow}>
                    <Text style={styles.operatorLabel}>Bus Fleet ID</Text>
                    <Text style={styles.operatorVal}>#{assignedBus?.bus_id || 'N/A'}</Text>
                  </View>
                </View>

                {/* Quick Action: View Passenger Booking QR */}
                <TouchableOpacity
                  style={styles.busDetailsQrActionBtn}
                  onPress={() => {
                    setShowBusDetailsModal(false);
                    setShowQr(true);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.busDetailsQrActionBtnText}>View QR Code</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🛑</Text>
                <Text style={styles.emptyTitle}>No Bus Assigned</Text>
                <Text style={styles.emptyDesc}>
                  Please contact depot manager to assign a fleet vehicle to your profile.
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>


      {/* ========================================================= */}
      {/* MODAL 3: PROFILE BOTTOM SHEET */}
      {/* ========================================================= */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable
          style={styles.detailsBackdrop}
          onPress={() => setShowProfileModal(false)}
        >
          <Pressable style={styles.detailsSheet} onPress={() => { }}>
            <View style={styles.sheetHandle} />

            <View style={styles.detailsHeader}>
              <View>
                <Text style={styles.detailsEyebrow}>EMPLOYEE ACCOUNT</Text>
                <Text style={styles.detailsTitle}>Conductor Profile</Text>
              </View>
              <TouchableOpacity
                style={styles.detailsCloseButton}
                onPress={() => setShowProfileModal(false)}
                accessibilityLabel="Close profile"
              >
                <Text style={styles.detailsCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 560 }}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Profile Avatar & Identity Card */}
              <View style={styles.profileModalHeader}>
                <View style={styles.profileAvatarLarge}>
                  <Text style={styles.profileAvatarLargeText}>
                    {conductor?.name ? conductor.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <Text style={styles.profileModalName}>{conductor?.name || 'Conductor'}</Text>
                <Text style={styles.profileModalId}>ID: {conductor?.conductor_id || 'COND-01'}</Text>
                <View style={styles.profileVerifiedBadge}>
                  <Text style={styles.profileVerifiedText}>✓ ACTIVE & VERIFIED</Text>
                </View>
              </View>

              {/* 2x2 Specs Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailCell}>
                  <Text style={styles.detailsLabel}>ROLE</Text>
                  <Text style={styles.detailsValue}>Bus Conductor</Text>
                </View>

                <View style={styles.detailCell}>
                  <Text style={styles.detailsLabel}>ASSIGNED VEHICLE</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id || 'None'}
                  </Text>
                </View>

                <View style={styles.detailCell}>
                  <Text style={styles.detailsLabel}>SHIFT STATUS</Text>
                  <View style={styles.statusPillSmall}>
                    <View style={styles.statusDotSmall} />
                    <Text style={styles.statusPillSmallText}>ON DUTY</Text>
                  </View>
                </View>

                <View style={styles.detailCell}>
                  <Text style={styles.detailsLabel}>DEPOT</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>Main Depot</Text>
                </View>
              </View>

              {/* Contact & Organization Details */}
              <View style={styles.operatorCard}>
                <View style={styles.operatorRow}>
                  <Text style={styles.operatorLabel}>Mobile Number</Text>
                  <Text style={styles.operatorVal}>{conductor?.mobile || 'N/A'}</Text>
                </View>
                <View style={styles.operatorRow}>
                  <Text style={styles.operatorLabel}>Email Address</Text>
                  <Text style={styles.operatorVal}>{conductor?.email || 'N/A'}</Text>
                </View>
                <View style={styles.operatorRow}>
                  <Text style={styles.operatorLabel}>Operator Fleet</Text>
                  <Text style={styles.operatorVal}>Shree Mateshwari Express</Text>
                </View>
                {assignedBus && (
                  <View style={styles.operatorRow}>
                    <Text style={styles.operatorLabel}>Assigned Route</Text>
                    <Text style={[styles.operatorVal, { color: colors.primaryText }]} numberOfLines={1}>
                      {assignedBus?.origin || 'Origin'} ➔ {assignedBus?.destination || 'Destination'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Logout Action Inside Profile */}
              <TouchableOpacity
                style={styles.profileLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.profileLogoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: CUSTOM LOGOUT CONFIRMATION POPUP */}
      {/* ========================================================= */}
      <Modal
        visible={showLogoutConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirmModal(false)}
      >
        <Pressable style={styles.confirmModalBackdrop} onPress={() => setShowLogoutConfirmModal(false)}>
          <Pressable style={styles.confirmModalCard} onPress={() => { }}>
            <View style={styles.confirmIconBadgeLogout}>
              <Text style={styles.confirmEmoji}>🚪</Text>
            </View>

            <Text style={styles.confirmTitle}>Log Out?</Text>
            <Text style={styles.confirmSubtitle}>
              Are you sure you want to log out from your conductor shift?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowLogoutConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={confirmLogoutAction}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmLogoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 5: CUSTOM EXIT APP CONFIRMATION POPUP */}
      {/* ========================================================= */}
      <Modal
        visible={showExitAppModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitAppModal(false)}
      >
        <Pressable style={styles.confirmModalBackdrop} onPress={() => setShowExitAppModal(false)}>
          <Pressable style={styles.confirmModalCard} onPress={() => { }}>
            <View style={styles.confirmIconBadgeExit}>
              <Text style={styles.confirmEmoji}>🚍</Text>
            </View>

            <Text style={styles.confirmTitle}>Exit Application?</Text>
            <Text style={styles.confirmSubtitle}>
              Do you want to close and exit the Shree Mateshwari Conductor app?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowExitAppModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmExitBtn}
                onPress={() => {
                  setShowExitAppModal(false);
                  BackHandler.exitApp();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmExitBtnText}>Exit App</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  conductorId: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
  },
  dutyBusBar: {
    backgroundColor: '#312e81',
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dutyBusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dutyBusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dutyBusNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  dutyBusRoute: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  dutyBusAction: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: '800',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  optionsSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },
  // HERO SUMMARY CARD
  summaryCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  summaryEyebrow: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  syncBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  refreshLink: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryMainRow: {
    marginBottom: 16,
  },
  summaryAmount: {
    color: '#34d399',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroMetricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  heroMetricVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryFooterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryArrowPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryFooterArrow: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '900',
  },
  // QR HERO CARD
  qrOptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  qrBadgeRow: {
    marginBottom: 2,
  },
  qrBadgeText: {
    color: colors.primaryText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  qrCardTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '800',
  },
  qrCardSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  qrActionPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginLeft: 8,
  },
  qrActionPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  // ACTION ROW CARD (e.g. Payment History, Bus, Profile)
  actionRowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gridEmoji: {
    fontSize: 20,
  },
  actionCardTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '800',
  },
  actionCardSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  actionArrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionCardArrow: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '800',
  },
  // STATES & ERRORS
  stateBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  errorBox: {
    padding: 24,
    backgroundColor: '#fef2f2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  errorTitle: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  // MODALS
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  qrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },
  qrTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '900',
  },
  qrSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  qrRouteBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrScanHint: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  qrCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  // BOTTOM SHEET DETAILS MODAL SYSTEM
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
  statusPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  statusPillSmallText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  operatorCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  operatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  operatorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  operatorVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  busDetailsQrActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  busDetailsQrActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  profileModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  profileAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  profileAvatarLargeText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  profileModalName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  profileModalId: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  profileVerifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  profileVerifiedText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
  },
  profileLogoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 6,
    marginBottom: 24,
  },
  profileLogoutBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  // CUSTOM CONFIRMATION POPUPS (LOGOUT & EXIT APP)
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconBadgeLogout: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  confirmIconBadgeExit: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#c7d2fe',
  },
  confirmEmoji: {
    fontSize: 28,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  confirmLogoutBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmLogoutBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  confirmExitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmExitBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
});
