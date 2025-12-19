import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import StatsCard from './StatsCard';
import { dashboardStats as stats, dashboardRecent as recent, dashboardSleepScoreToday as sleepScoreToday, dashboardWeekly as weekly, dashboardWeeklyDays as weeklyDays, dashboardWeeklyTargetFocusMinutes as weeklyTargetFocusMinutes } from '../../hooks/Users/data';
import SleepSummaryCard from './SleepSummaryCard';
import WeeklyPerformanceChart from './WeeklyPerformanceChart';
import theme from '../../theme';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 520 ? 2 : 1;
  const itemWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '32%';
  // sample data
  const [period, setPeriod] = useState('Dia');


  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.hero, { flexDirection: width < 520 ? 'column' : 'row', alignItems: width < 520 ? 'flex-start' : 'center' }]}>
        <View>
          <Text style={styles.heroTitle}>Boa tarde (usuario)! 👋</Text>
          <Text style={styles.heroSub}>Você está tendo um ótimo dia produtivo. Continue assim!</Text>
        </View>
        <View style={[styles.heroRight, width < 520 && { marginTop: 12 }]}> 
          <Text style={styles.heroPercent}>92%</Text>
          <Text style={styles.heroLabel}>Produtividade</Text>
        </View>
      </View>

      <View style={styles.segmentedRow}>
        {['Dia', 'Semana'].map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setPeriod(opt)}
            style={[
              styles.segmentButton,
              period === opt && { backgroundColor: theme.colors.primary[700] },
            ]}
          >
            <Text style={[
              styles.segmentText,
              period === opt && { color: theme.colors.text.inverse },
            ]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {period === 'Dia' ? (
        <>
          <View style={[styles.gridItem, { width: '100%' }]}> 
            <SleepSummaryCard score={sleepScoreToday} avg={weekly.avgSleepScore} />
          </View>

          <View style={styles.grid}>
            {stats.map((s, idx) => (
              <View
                key={s.key}
                style={[styles.gridItem, { width: itemWidth, marginRight: (columns > 1 && (idx % columns) !== columns - 1) ? 12 : 0 }]}
              >
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
        </>
      ) : (
        <View style={[styles.gridItem, { width: '100%' }]}> 
          <WeeklyPerformanceChart days={weeklyDays} targetFocusMinutes={weeklyTargetFocusMinutes} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: theme.colors.background.primary },
  hero: { 
    backgroundColor: theme.colors.primary[700], 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.lg,
  },
  heroTitle: { 
    color: theme.colors.text.inverse, 
    fontSize: theme.typography.fontSize.xl, 
    fontWeight: theme.typography.fontWeight.bold 
  },
  heroSub: { 
    color: theme.colors.text.inverse, 
    opacity: theme.opacity[90],
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
  },
  heroRight: { alignItems: 'center' },
  heroPercent: { 
    color: theme.colors.text.inverse, 
    fontSize: theme.typography.fontSize['3xl'], 
    fontWeight: theme.typography.fontWeight.extrabold 
  },
  heroLabel: { 
    color: theme.colors.text.inverse, 
    opacity: theme.opacity[90],
    fontSize: theme.typography.fontSize.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  segmentText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: theme.spacing.lg 
  },
  gridItem: { marginBottom: theme.spacing.md },
  recentCard: { 
    backgroundColor: theme.colors.card, 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl,
  },
  sectionTitle: { 
    fontSize: theme.typography.fontSize.lg, 
    fontWeight: theme.typography.fontWeight.bold, 
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  recentItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: theme.spacing.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border.light,
  },
  recentTitle: { 
    fontSize: theme.typography.fontSize.sm, 
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  recentTime: { 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.secondary,
  },
  recentDuration: { 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.secondary,
  },
});