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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';

const PRIMARY_API_BASE = 'http://192.168.1.8:8000/api/v1';
const FALLBACK_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';

export default function ShiftSelectScreen({ route, navigation }) {
  const [conductor, setConductor] = useState(route?.params?.conductor || null);
  const [assignedBus, setAssignedBus] = useState(route?.params?.assignedBus || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignedBus = useCallback(async (cond) => {
    if (!cond || !cond.conductor_id) {
      setLoading(false);
      return;
    }

    try {
      let res;
      try {
        res = await fetch(`${PRIMARY_API_BASE}/conductor/my-bus/${cond.conductor_id}`);
      } catch (err) {
        // Fallback if local IP is not reachable
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
        } else {
          await AsyncStorage.removeItem('@conductor_assigned_bus');
        }
        setError(null);
      } else {
        setError('Failed to fetch assigned bus details');
      }
    } catch (e) {
      setError('Network error while checking bus assignment');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        let currentConductor = conductor;
        if (!currentConductor) {
          const sessionJson = await AsyncStorage.getItem('@conductor_session');
          if (sessionJson) {
            currentConductor = JSON.parse(sessionJson);
            setConductor(currentConductor);
          } else {
            // Not logged in -> redirect to Login
            navigation.replace('Login');
            return;
          }
        }

        const savedBus = await AsyncStorage.getItem('@conductor_assigned_bus');
        if (savedBus && !assignedBus) {
          setAssignedBus(JSON.parse(savedBus));
        }

        await fetchAssignedBus(currentConductor);
      } catch (e) {
        setLoading(false);
      }
    };

    init();
  }, [conductor, fetchAssignedBus, navigation, assignedBus]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (conductor) {
      await fetchAssignedBus(conductor);
    } else {
      setRefreshing(false);
    }
  };

  const handleOpenLiveVerification = () => {
    if (!assignedBus) {
      Alert.alert(
        'No Bus Assigned',
        'You do not have a bus assigned to your profile. Please contact admin to assign a bus before starting verification.'
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the conductor app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
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

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Header with Conductor Profile & Logout */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
        </View>

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
        {/* Welcome Greeting & Date Banner */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <View>
              <Text style={styles.greetingEyebrow}>CONDUCTOR DASHBOARD</Text>
              <Text style={styles.greetingTitle}>
                Namaste, {conductor?.name?.split(' ')[0] || 'Conductor'} 👋
              </Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{todayStr}</Text>
            </View>
          </View>
          <Text style={styles.greetingSubtext}>
            Manage your daily route shift and monitor passenger verified payments in real time.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.primaryText} />
            <Text style={styles.stateText}>Loading your shift & assigned bus...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Connection Issue</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry Sync</Text>
            </TouchableOpacity>
          </View>
        ) : assignedBus ? (
          <>
            {/* HERO CARD: Live Verification & Payment Monitoring */}
            <View style={styles.liveHeroCard}>
              <View style={styles.liveHeroHeader}>
                <View style={styles.livePulseTag}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.livePulseText}>LIVE TICKETING READY</Text>
                </View>
                <Text style={styles.liveHeroSubTag}>⚡ Real-Time Sync</Text>
              </View>

              <Text style={styles.liveHeroTitle}>
                Live Payment & Ticket Verification
              </Text>
              <Text style={styles.liveHeroDesc}>
                Open real-time verification screen to scan passenger UPI tickets, receive sound chimes for payments, and inspect monthly passes.
              </Text>

              {/* Big CTA Button to go to Live Verification Screen */}
              <TouchableOpacity
                style={styles.liveHeroButton}
                onPress={handleOpenLiveVerification}
                activeOpacity={0.85}
              >
                <View style={styles.liveHeroButtonContent}>
                  <View style={styles.liveHeroButtonIcon}>
                    <Text style={styles.liveHeroButtonEmoji}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liveHeroButtonTitle}>
                      OPEN LIVE VERIFICATION
                    </Text>
                    <Text style={styles.liveHeroButtonSubtitle}>
                      Bus {assignedBus.bus_no || assignedBus.bus_number || assignedBus.bus_id} • Tap to enter
                    </Text>
                  </View>
                  <Text style={styles.liveHeroArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Assigned Bus Details Card */}
            <View style={styles.busSection}>
              <Text style={styles.sectionHeading}>Your Assigned Bus & Route</Text>

              <View style={styles.busCard}>
                <View style={styles.busCardTop}>
                  <View style={styles.busIconContainer}>
                    <Text style={styles.busEmoji}>🚍</Text>
                  </View>
                  <View style={styles.busNumberBlock}>
                    <Text style={styles.busNumber}>
                      {assignedBus.bus_no || assignedBus.bus_number || assignedBus.bus_id}
                    </Text>
                    <Text style={styles.busIdTag}>Bus ID: {assignedBus.bus_id}</Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>ON DUTY</Text>
                  </View>
                </View>

                {/* Route Flow */}
                <View style={styles.routeBox}>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>FROM (ORIGIN)</Text>
                    <Text style={styles.cityText} numberOfLines={1}>
                      {assignedBus.origin || assignedBus.origin_city || 'Origin City'}
                    </Text>
                  </View>
                  <View style={styles.arrowBlock}>
                    <Text style={styles.routeArrow}>➔</Text>
                  </View>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>TO (DESTINATION)</Text>
                    <Text style={styles.cityText} numberOfLines={1}>
                      {assignedBus.destination || assignedBus.destination_city || 'Destination City'}
                    </Text>
                  </View>
                </View>

                {/* Meta details */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>FARE / RIDE</Text>
                    <Text style={styles.metaValue}>₹{assignedBus.fare_amount || 50}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>STATUS</Text>
                    <Text style={[styles.metaValue, { color: colors.successBright }]}>
                      {assignedBus.status || 'ACTIVE'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>PAYMENT MODES</Text>
                    <Text style={styles.metaValue}>UPI & Pass</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Feature Cards Grid */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionHeading}>Quick Operations</Text>

              <View style={styles.featuresGrid}>
                <TouchableOpacity
                  style={styles.featureCard}
                  onPress={handleOpenLiveVerification}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Text style={styles.featureEmoji}>🎟️</Text>
                  </View>
                  <Text style={styles.featureTitle}>Live Passenger Feed</Text>
                  <Text style={styles.featureDesc}>
                    View instant ticket scans & payment status
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.featureCard}
                  onPress={onRefresh}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={styles.featureEmoji}>🔄</Text>
                  </View>
                  <Text style={styles.featureTitle}>Sync Shift Status</Text>
                  <Text style={styles.featureDesc}>
                    Refresh assigned bus & server connection
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* Unassigned Bus Warning View */
          <View style={styles.unassignedCard}>
            <View style={styles.unassignedIconBadge}>
              <Text style={styles.unassignedEmoji}>🛑</Text>
            </View>
            <Text style={styles.unassignedTitle}>No Bus Assigned</Text>
            <Text style={styles.unassignedDescription}>
              You currently do not have any active bus assigned to your conductor profile by the administrator.
            </Text>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>How to get assigned?</Text>
              <Text style={styles.instructionsText}>
                1. Contact your bus fleet manager or admin.{'\n'}
                2. Provide your Conductor ID:{' '}
                <Text style={{ fontWeight: '800', color: colors.primaryText }}>
                  {conductor?.conductor_id || 'your account'}
                </Text>
                .{'\n'}
                3. After assignment, tap "Refresh Assignment" below.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              activeOpacity={0.85}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh Assignment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 40,
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
    marginBottom: 6,
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
  greetingSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
  liveHeroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  liveHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  livePulseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.successBright,
    marginRight: 6,
  },
  livePulseText: {
    color: colors.successBright,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  liveHeroSubTag: {
    color: colors.primaryMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  liveHeroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 26,
  },
  liveHeroDesc: {
    color: colors.primaryMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },
  liveHeroButton: {
    backgroundColor: colors.primarySurface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  liveHeroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveHeroButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveHeroButtonEmoji: {
    fontSize: 22,
  },
  liveHeroButtonTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveHeroButtonSubtitle: {
    color: colors.successBright,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  liveHeroArrow: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: 12,
  },
  busSection: {
    marginBottom: 20,
  },
  busCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  busCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  busEmoji: {
    fontSize: 24,
  },
  busNumberBlock: {
    flex: 1,
  },
  busNumber: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  busIdTag: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  activeBadgeText: {
    color: colors.successStrong,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeCol: {
    flex: 1,
  },
  arrowBlock: {
    paddingHorizontal: 8,
  },
  routeLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  cityText: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  routeArrow: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '900',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  metaValue: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  featuresSection: {
    marginBottom: 10,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  featureDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  unassignedCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  unassignedIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  unassignedEmoji: {
    fontSize: 32,
  },
  unassignedTitle: {
    color: '#991b1b',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  unassignedDescription: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  instructionsBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  instructionsText: {
    color: colors.textBody,
    fontSize: 12,
    lineHeight: 18,
  },
  refreshButton: {
    backgroundColor: colors.primarySurface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
