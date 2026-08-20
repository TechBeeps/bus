import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';

export default function ShiftSelectScreen({ navigation }) {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchBuses = async () => {
      try {
        const res = await fetch('https://api.shreemateshwaribus.com/api/v1/bus');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data.buses) ? data.buses : [];
        setBuses(list);
        setSelectedBus(list[0]?.bus_no ?? '');
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load buses');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBuses();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBusPress = (bus,bus_no) => {
    setSelectedBus(bus);
    navigation.navigate('LiveVerification', { busId: bus, busNo: bus_no ?? '' });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Start Your Shift</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SELECT YOUR ASSIGNED BUS</Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countLabel}>AVAILABLE</Text>
          <Text style={styles.countValue}>{loading ? '--' : buses.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeadingRow}>
            <Text style={styles.cardTitle}>Choose your bus</Text>
            <Text style={styles.cardSubtitle}>Live routes</Text>
          </View>
         
          {loading && (
            <View style={styles.stateBox}>
              <ActivityIndicator size="small" color={colors.primaryText} />
              <Text style={styles.stateText}>Loading available buses...</Text>
            </View>
          )}
          {error && (
            <View style={styles.stateBox}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && buses.map((bus) => {
            const id = bus.bus_id ?? '';
            const busno = bus.bus_no ?? '';
            const route = `${bus.origin ?? ''} → ${bus.destination ?? ''}`;
            const active = selectedBus === id;
            return (
              <Pressable
                key={id}
                style={[styles.busButton, active && styles.busButtonActive]}
                onPress={() => handleBusPress(id, busno)}
              >
                <View style={styles.busRow}>
                  <View style={styles.busIcon}>
                    <Text style={styles.busIconText}>{busno.slice(0, 4)}</Text>
                  </View>
                  <View style={styles.busInfo}>
                    <Text style={[styles.busNo, active && styles.busTextActive]} numberOfLines={1}>{busno}</Text>
                    <Text style={[styles.busRoute, active && styles.busRouteActive]} numberOfLines={1}>{route}</Text>
                  </View>
                  <Text style={[styles.chevron, active && styles.chevronActive]}>›</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

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
    padding: 20,
    paddingTop: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  countLabel: {
    color: colors.primaryMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  countValue: {
    color: colors.successBright,
    fontSize: 18,
    fontWeight: '900',
  },
  container: {
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brandMarkText: {
    color: colors.background,
    fontSize: 22,
    fontWeight: '900',
  },
  topBarCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primaryMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  topBarTitle: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  livePillText: {
    color: colors.successBright,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hero: {
    paddingBottom: 20,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 7,
  },
  heroBadgeText: {
    color: colors.primaryMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heading: {
    color: colors.background,
    fontSize: 28,
    fontWeight: '900',
  },
  subheading: {
    color: colors.textSubtle,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 14,
    minHeight: 78,
    justifyContent: 'space-between',
  },
  summaryValue: {
    color: colors.background,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 7,
  },
  syncValue: {
    color: colors.successBright,
    fontSize: 15,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minHeight: 520,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  busCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.darkCard,
    borderRadius: 18,
    color: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  busButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  busButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 3,
  },
  busText: {
    color: colors.textBody,
    fontWeight: '600',
  },
  busTextActive: {
    color: colors.textOnPrimary,
  },
  startButton: {
    backgroundColor: colors.success,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: colors.surfaceDark,
    fontWeight: '800',
    fontSize: 16,
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busInfo: {
    flex: 1,
  },
  busNo: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  busRoute: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  busRouteActive: {
    color: colors.primaryMuted,
  },
  busIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  busIconText: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 22,
    marginLeft: 8,
  },
  chevronActive: {
    color: colors.textOnPrimary,
  },
  stateBox: {
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  errorIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.warning,
    color: colors.textOnPrimary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '900',
  },
  errorText: {
    color: colors.warningText,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
});
