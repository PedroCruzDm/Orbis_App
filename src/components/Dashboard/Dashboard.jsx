import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import StatsCard from './StatsCard';

export default function Dashboard() {
  // sample data
  const stats = [
    { key: 'prod', title: 'Produtividade', value: 92, max: 100, description: 'Hoje', type: 'gauge' },
    { key: 'foco', title: 'Tempo de Foco', value: 180, max: 240, description: 'minutos hoje', type: 'gauge' },
    { key: 'dias', title: 'Dias Consecutivos', value: 5, max: 7, description: 'Sequência ativa', type: 'days', days: [true,true,true,true,true,false,false] },
  ];

  const recent = [
    { id: 1, title: 'Sessão de foco concluída', time: '14:30', duration: '45 min' },
    { id: 2, title: 'Relatório mensal finalizado', time: '13:15', duration: '30 min' },
    { id: 3, title: 'Planejamento do dia', time: '09:30', duration: '15 min' },
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroTitle}>Boa tarde! 👋</Text>
          <Text style={styles.heroSub}>Você está tendo um ótimo dia produtivo. Continue assim!</Text>
        </View>
        <View style={styles.heroRight}>
          <Text style={styles.heroPercent}>92%</Text>
          <Text style={styles.heroLabel}>Produtividade</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.key} style={styles.gridItem}>
            <StatsCard title={s.title} value={s.value} max={s.max} description={s.description} type={s.type} days={s.days} />
          </View>
        ))}
      </View>

      <View style={styles.recentCard}>
        <Text style={styles.sectionTitle}>Atividade Recentes</Text>
        {recent.map((r) => (
          <View key={r.id} style={styles.recentItem}>
            <View>
              <Text style={styles.recentTitle}>{r.title}</Text>
              <Text style={styles.recentTime}>{r.time}</Text>
            </View>
            <Text style={styles.recentDuration}>{r.duration}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#F3F4F6' },
  hero: { backgroundColor: '#0EA5A4', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  heroRight: { alignItems: 'center' },
  heroPercent: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  gridItem: { width: '48%' },
  recentCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recentTitle: { fontSize: 14, fontWeight: '600' },
  recentTime: { fontSize: 12, color: '#6B7280' },
  recentDuration: { fontSize: 12, color: '#6B7280' },
});