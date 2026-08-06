import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const BUSSES = ['BUS_101', 'BUS_102', 'BUS_103', 'BUS_104'];

export default function ShiftSelectScreen({ navigation }) {
  const [conductorName, setConductorName] = useState('');
  const [selectedBus, setSelectedBus] = useState(BUSSES[0]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Start Your Shift</Text>
        <Text style={styles.subheading}>Select your assigned bus and begin monitoring payments.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Conductor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#94a3b8"
            value={conductorName}
            onChangeText={setConductorName}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Select Bus</Text>
          {BUSSES.map((bus) => (
            <Pressable
              key={bus}
              style={[styles.busButton, selectedBus === bus && styles.busButtonActive]}
              onPress={() => setSelectedBus(bus)}
            >
              <Text style={[styles.busText, selectedBus === bus && styles.busTextActive]}>{bus}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessible
          accessibilityLabel="Start shift"
          style={styles.startButton}
          onPress={() => navigation.navigate('LiveVerification', { conductorName, busId: selectedBus })}
        >
          <Text style={styles.startButtonText}>Start Shift</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    padding: 24,
  },
  heading: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 18,
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  busButton: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  busButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  busText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  busTextActive: {
    color: '#f8fafc',
  },
  startButton: {
    backgroundColor: '#22c55e',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 16,
  },
});
