import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CircularGauge({ value = 0, max = 100, size = 80, strokeWidth = 6 }) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const color = percentage >= 80 ? '#16A34A' : percentage >= 50 ? '#2563EB' : '#F59E0B';
  const radius = size / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: '#E5E7EB',
          },
        ]}
      />

      <View
        style={[
          styles.fill,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: radius - strokeWidth,
            backgroundColor: '#fff',
          },
        ]}
      >
        <Text style={[styles.value, { color }]}>{percentage}%</Text>
        <Text style={styles.sub}>{value}/{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  fill: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 12, color: '#6B7280' },
});
