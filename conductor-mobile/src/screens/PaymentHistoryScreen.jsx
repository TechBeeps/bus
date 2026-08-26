import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';

const PRIMARY_API_BASE = 'https://api.shreemateshwaribus.com/api/v1';

export default function PaymentHistoryScreen({ route, navigation }) {
  const [conductor, setConductor] = useState(route?.params?.conductor || null);
  const [assignedBus, setAssignedBus] = useState(route?.params?.assignedBus || null);

  // Selected Date state (YYYY-MM-DD)
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [historyData, setHistoryData] = useState({
    total_amount: 0,
    total_tickets: 0,
    total_cashback: 0,
    buses_covered: [],
    tickets: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);

  // Calendar Picker State
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed

  const todayDateStr = useMemo(() => getTodayDateStr(), []);

  // Fetch payment history for conductor and selected date
  const fetchHistory = useCallback(async (dateStr, cond) => {
    const activeCond = cond || conductor;
    if (!activeCond || !activeCond.conductor_id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `${PRIMARY_API_BASE}/conductor/payment-history?conductor_id=${activeCond.conductor_id}&date=${dateStr}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        setHistoryData({
          total_amount: data.total_amount || 0,
          total_tickets: data.total_tickets || 0,
          total_cashback: data.total_cashback || 0,
          buses_covered: data.buses_covered || [],
          tickets: Array.isArray(data.tickets) ? data.tickets : [],
        });
      } else {
        setHistoryData({ total_amount: 0, total_tickets: 0, total_cashback: 0, buses_covered: [], tickets: [] });
      }
    } catch (e) {
      // network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conductor]);

  useEffect(() => {
    const init = async () => {
      let currentConductor = conductor;
      if (!currentConductor) {
        try {
          const sessionJson = await AsyncStorage.getItem('@conductor_session');
          if (sessionJson) {
            currentConductor = JSON.parse(sessionJson);
            setConductor(currentConductor);
          }
        } catch (e) {
          // ignore
        }
      }
      if (currentConductor) {
        fetchHistory(selectedDate, currentConductor);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [fetchHistory, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(selectedDate, conductor);
  };

  // Date Shift Helpers
  const shiftDateByDays = (days) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);
    currentDate.setDate(currentDate.getDate() + days);

    // Prevent future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (currentDate > today) return;

    const newYear = currentDate.getFullYear();
    const newMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(currentDate.getDate()).padStart(2, '0');
    const nextDateStr = `${newYear}-${newMonth}-${newDay}`;
    setSelectedDate(nextDateStr);
  };

  const isToday = selectedDate === todayDateStr;
  const isYesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return selectedDate === `${y}-${m}-${day}`;
  }, [selectedDate]);

  // Formatted date string for display
  const formattedDisplayDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Calendar days generator for custom picker modal
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    // Padding before 1st day of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const checkDate = new Date(calendarYear, calendarMonth, d);
      const isFuture = checkDate > today;
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isFuture,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [calendarYear, calendarMonth, selectedDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>
              {conductor?.name || 'Conductor'} • {conductor?.conductor_id || 'COND-01'}
            </Text>
          </View>
        </View>


      </View>

      {/* Interactive Date Switcher Bar */}
      <View style={styles.dateBar}>


        {/* Day Navigation Banner with Chevron Arrows */}
        <View style={styles.dayNavCard}>
          <TouchableOpacity
            style={styles.navChevron}
            onPress={() => shiftDateByDays(-1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.navChevronText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateLabelContainer}
            onPress={() => setShowDatePickerModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.navDateText}>{formattedDisplayDate}</Text>
            {isToday ? (
              <View style={styles.liveDotRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>TODAY'S SHIFT</Text>
              </View>
            ) : (
              <Text style={styles.pastTagText}>PAST COLLECTION</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navChevron, isToday && styles.disabledChevron]}
            onPress={() => shiftDateByDays(1)}
            disabled={isToday}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.navChevronText, isToday && styles.disabledChevronText]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List Container */}
      <FlatList
        data={historyData.tickets}
        keyExtractor={(item) => String(item.ticket_id || item.id || Math.random())}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryText}
            colors={[colors.primaryText]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Day Summary Metric Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL COLLECTION (PAID)</Text>
                  <Text style={styles.summaryAmount}>₹{historyData.total_amount}</Text>
                  {historyData.total_cashback > 0 && (
                    <Text style={styles.summaryCashbackSubtitle}>
                      🎁 ₹{historyData.total_cashback} Total Cashback Applied
                    </Text>
                  )}
                </View>

                <View style={styles.summaryTicketsBadge}>
                  <Text style={styles.summaryTicketsNumber}>{historyData.total_tickets}</Text>
                  <Text style={styles.summaryTicketsLabel}>Tickets</Text>
                </View>
              </View>

              {/* Buses Covered on this date */}
              <View style={styles.busesCoveredRow}>
                <Text style={styles.busesCoveredLabel}>BUS ON DUTY:</Text>
                <Text style={styles.busesCoveredValue} numberOfLines={1}>
                  {historyData.buses_covered.length > 0
                    ? historyData.buses_covered.join(', ')
                    : assignedBus?.bus_no || assignedBus?.bus_number || assignedBus?.bus_id || 'Assigned Bus'}
                </Text>
              </View>
            </View>

            {/* List Heading */}
            <View style={styles.listHeadingRow}>
              <Text style={styles.listHeading}>
                Verified Tickets ({historyData.tickets.length})
              </Text>
              <Text style={styles.listSubheading}>Tap ticket to view receipt</Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isPass = item.payment_mode === 'PASS' || item.razorpay_payment_id === 'monthly_pass';
          const fareAmount = isPass ? 0 : (item.fare || item.amount || 0);
          const cashbackAmount = isPass ? 0 : (item.cashback || 0);
          const paidAmount = isPass ? 0 : (item.total_paid ?? item.paidamount ?? item.amount ?? 0);

          return (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => setSelectedTicketModal(item)}
              activeOpacity={0.85}
            >
              {/* Ticket Card Top */}
              <View style={styles.ticketCardHeader}>
                <View style={styles.ticketIdRow}>
                  <Text style={styles.ticketIdText}>#{item.ticket_id}</Text>
                  {/* Bus Number Pill */}
                  <View style={styles.busNumberPill}>
                    <Text style={styles.busNumberPillText}>
                      🚍 {item.bus_number || item.bus_id || 'BUS'}
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
                  👥 {item.passenger_count || 1} Passenger(s) • ⏰ {item.time_formatted || 'Today'}
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
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primaryText} />
              <Text style={styles.emptyText}>Loading tickets for {formattedDisplayDate}...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>No payments on this date</Text>
              <Text style={styles.emptySubtitle}>
                No verified tickets or payments found for {formattedDisplayDate}.
              </Text>
              <TouchableOpacity style={styles.emptyRetryBtn} onPress={onRefresh}>
                <Text style={styles.emptyRetryBtnText}>🔄 Refresh Date</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* ========================================================= */}
      {/* MODAL 1: CUSTOM DATE PICKER MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showDatePickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePickerModal(false)}>
          <Pressable style={styles.calendarModalCard} onPress={() => { }}>
            {/* Modal Title */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Select History Date</Text>
                <Text style={styles.modalHeaderSubtitle}>View previous day collections</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigator */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
              >
                <Text style={styles.monthNavBtnText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.monthNavTitle}>
                {monthNames[calendarMonth]} {calendarYear}
              </Text>

              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={() => {
                  const now = new Date();
                  if (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth()) {
                    return; // Prevent future months
                  }
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
              >
                <Text style={styles.monthNavBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekdays Header */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                <Text key={idx} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, index) => {
                if (!item.day) {
                  return <View key={index} style={styles.emptyDayCell} />;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      item.isSelected && styles.selectedDayCell,
                      item.isFuture && styles.futureDayCell,
                    ]}
                    disabled={item.isFuture}
                    onPress={() => {
                      setSelectedDate(item.dateStr);
                      setShowDatePickerModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        item.isSelected && styles.selectedDayCellText,
                        item.isFuture && styles.futureDayCellText,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Button: Today */}
            <TouchableOpacity
              style={styles.modalTodayBtn}
              onPress={() => {
                setSelectedDate(todayDateStr);
                setShowDatePickerModal(false);
              }}
            >
              <Text style={styles.modalTodayBtnText}>Select Today ({todayDateStr})</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: TICKET RECEIPT & DETAILS MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedTicketModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTicketModal(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedTicketModal(null)}>
          <Pressable style={styles.ticketDetailsCard} onPress={() => { }}>
            {selectedTicketModal && (
              <>
                <View style={styles.detailsHeader}>
                  <View>
                    <Text style={styles.detailsTicketId}>Ticket #{selectedTicketModal.ticket_id}</Text>
                    <Text style={styles.detailsSubtitle}>
                      Bus: {selectedTicketModal.bus_number || selectedTicketModal.bus_id} • {selectedTicketModal.time_formatted || 'Today'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedTicketModal(null)}
                  >
                    <Text style={styles.modalCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 380 }}>
                  <View style={styles.receiptBox}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>PAYMENT STATUS</Text>
                      <Text style={styles.receiptStatus}>✓ VERIFIED & PAID</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>ROUTE</Text>
                      <Text style={styles.receiptVal}>
                        {selectedTicketModal.origin} ➔ {selectedTicketModal.destination}
                      </Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>BUS NUMBER</Text>
                      <Text style={styles.receiptVal}>{selectedTicketModal.bus_number || selectedTicketModal.bus_id}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>PASSENGER COUNT</Text>
                      <Text style={styles.receiptVal}>{selectedTicketModal.passenger_count || 1}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>PAYMENT MODE</Text>
                      <Text style={styles.receiptVal}>
                        {selectedTicketModal.payment_mode === 'PASS' || selectedTicketModal.razorpay_payment_id === 'monthly_pass' ? 'Monthly Pass' : 'Razorpay UPI'}
                      </Text>
                    </View>

                    {/* Fare Itemized Details */}
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>STANDARD FARE</Text>
                      <Text style={styles.receiptVal}>
                        ₹{selectedTicketModal.fare || selectedTicketModal.amount || 0}
                      </Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>CASHBACK DISCOUNT</Text>
                      <Text style={[styles.receiptVal, { color: colors.primaryText, fontWeight: '800' }]}>
                        {selectedTicketModal.cashback > 0 ? `- ₹${selectedTicketModal.cashback}` : '₹0.00'}
                      </Text>
                    </View>

                    <View style={[styles.receiptRow, styles.receiptTotalPaidRow]}>
                      <Text style={styles.receiptTotalPaidLabel}>TOTAL PAID AMOUNT</Text>
                      <Text style={styles.receiptTotalPaidAmount}>
                        {selectedTicketModal.payment_mode === 'PASS' || selectedTicketModal.razorpay_payment_id === 'monthly_pass'
                          ? 'FREE (MONTHLY PASS)'
                          : `₹${selectedTicketModal.total_paid ?? selectedTicketModal.paidamount ?? selectedTicketModal.amount ?? 0}`}
                      </Text>
                    </View>

                    {selectedTicketModal.phone_number && (
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>PASSENGER MOBILE</Text>
                        <Text style={styles.receiptVal}>{selectedTicketModal.phone_number}</Text>
                      </View>
                    )}

                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>TRANSACTION TIME</Text>
                      <Text style={styles.receiptVal}>{selectedTicketModal.created_at || 'Today'}</Text>
                    </View>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeReceiptBtn}
                  onPress={() => setSelectedTicketModal(null)}
                >
                  <Text style={styles.closeReceiptBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
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
    paddingHorizontal: 18,
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: colors.primaryMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  calendarHeaderBtn: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  calendarHeaderBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  dateBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  datePill: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDatePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  datePillText: {
    color: colors.textBody,
    fontSize: 11,
    fontWeight: '700',
  },
  activeDatePillText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dayNavCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  navChevron: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navChevronText: {
    color: colors.textStrong,
    fontSize: 18,
    fontWeight: '900',
  },
  disabledChevron: {
    opacity: 0.4,
  },
  disabledChevronText: {
    color: colors.textSubtle,
  },
  dateLabelContainer: {
    alignItems: 'center',
  },
  navDateText: {
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  liveTagText: {
    color: colors.successStrong,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pastTagText: {
    color: colors.primaryText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryLabel: {
    color: colors.primaryMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryAmount: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryCashbackSubtitle: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryTicketsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryTicketsNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryTicketsLabel: {
    color: colors.primaryMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  busesCoveredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  busesCoveredLabel: {
    color: colors.primaryMuted,
    fontSize: 9,
    fontWeight: '800',
    marginRight: 6,
  },
  busesCoveredValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textStrong,
  },
  listSubheading: {
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
    color: colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  busNumberPill: {
    backgroundColor: colors.primarySoft,
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
    backgroundColor: colors.successSoft,
  },
  modeBadgePass: {
    backgroundColor: colors.warningSoft,
  },
  modeBadgeUpiText: {
    color: colors.successText,
    fontSize: 9,
    fontWeight: '900',
  },
  modeBadgePassText: {
    color: colors.warningText,
    fontSize: 9,
    fontWeight: '900',
  },
  ticketBody: {
    marginBottom: 12,
  },
  routeText: {
    color: colors.textBody,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  passengerText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  // 3-Column Fare / Cashback / Total Paid Breakdown
  priceBreakdownBox: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 10,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  priceColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSubtle,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  priceColValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textStrong,
  },
  priceColValueNeutral: {
    color: colors.textMuted,
  },
  cashbackPositiveText: {
    color: colors.primaryText,
    fontWeight: '900',
  },
  pricePaidUpiText: {
    color: colors.successStrong,
    fontWeight: '900',
    fontSize: 14,
  },
  pricePaidPassText: {
    color: colors.warningStrong,
    fontWeight: '900',
    fontSize: 12,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  ticketTimeText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    color: colors.successStrong,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textMuted,
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
  // Date Picker Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textStrong,
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  monthNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textStrong,
  },
  monthNavTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textStrong,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSubtle,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
  },
  futureDayCell: {
    opacity: 0.25,
  },
  dayCellText: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedDayCellText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  futureDayCellText: {
    color: colors.textSubtle,
  },
  modalTodayBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalTodayBtnText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '800',
  },
  // Ticket Details Receipt Modal
  ticketDetailsCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailsTicketId: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  detailsSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  receiptBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  receiptLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  receiptVal: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  receiptStatus: {
    color: colors.successStrong,
    fontSize: 11,
    fontWeight: '900',
  },
  receiptTotalPaidRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 4,
    borderBottomWidth: 0,
  },
  receiptTotalPaidLabel: {
    color: colors.successStrong,
    fontSize: 11,
    fontWeight: '900',
  },
  receiptTotalPaidAmount: {
    color: colors.successStrong,
    fontSize: 16,
    fontWeight: '900',
  },
  closeReceiptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeReceiptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
