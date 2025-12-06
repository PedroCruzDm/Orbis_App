import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DaysStreak({ days = [], totalDays = 7 }) {
  // days: array of booleans length <= totalDays
  const padded = Array.from({ length: totalDays }).map((_, i) => days[i] || false);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {padded.map((active, i) => (
          <View key={i} style={[styles.box, active ? styles.boxActive : styles.boxInactive]}>
            <Text style={[styles.boxText, active ? styles.boxTextActive : styles.boxTextInactive]}>{['D','S','T','Q','Q','S','S'][i]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.total}>{padded.filter(Boolean).length}/{totalDays}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6 },
  box: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  boxActive: { backgroundColor: '#16A34A' },
  boxInactive: { backgroundColor: '#F3F4F6' },
  boxText: { fontSize: 12, fontWeight: '600' },
  boxTextActive: { color: '#fff' },
  boxTextInactive: { color: '#6B7280' },
  total: { marginTop: 8, fontSize: 12, color: '#6B7280' },
});
