import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircularGauge from '../CircularGauge/CircularGauge';
import DaysStreak from '../DaysStreak/DaysStreak';

export default function StatsCard({ title, value = 0, max = 100, description, type = 'gauge', days = [] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      <View style={styles.center}> 
        {type === 'days' ? (
          <DaysStreak days={days} totalDays={max} />
        ) : (
          <CircularGauge value={value} max={max} size={100} strokeWidth={6} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width:0, height:2 }, elevation: 2 },
  header: { marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  description: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
