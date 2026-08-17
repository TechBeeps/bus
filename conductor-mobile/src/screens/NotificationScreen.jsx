import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';

export default function NotificationScreen({ route, navigation }) {
  const notification = route?.params?.notification;
  const content = notification?.request?.content || {};
  const title = content.title || 'Notification';
  const body = content.body || JSON.stringify(content.data || {});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%', alignItems: 'center', elevation: 6 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', marginBottom: 16 },
  closeBtn: { backgroundColor: '#1e1b4b', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
});
