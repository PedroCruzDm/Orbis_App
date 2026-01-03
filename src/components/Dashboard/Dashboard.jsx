import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import StatsCard from './stats_card.jsx';
import SleepSummaryCard from './sleep_summary_card.jsx';
import WeeklyPerformanceChart from './weekly_performance_chart.jsx';
import { useUserData } from '../../hooks/use_user_data.js';
import { useDashboardData } from '../../hooks/use_dashboard_data.js';
import theme from '../../theme/index.js';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 520 ? 2 : 1;
  const itemWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '32%';
  const [period, setPeriod] = useState('Dia');
  
  const { user, loading, error } = useUserData();
  const { dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData();

  // Calcula a produtividade com base nos dados reais
  const calculateProductivity = () => {
    const stats = dashboardData?.stats || [];
    if (!stats || stats.length === 0) return 0;

    const focusCard = stats.find((s) => s.key === 'focus');
    const sleepCard = stats.find((s) => s.key === 'sleep');

    let totalScore = 0;
    let count = 0;

    if (focusCard && focusCard.max > 0) {
      totalScore += (focusCard.value / focusCard.max) * 100;
      count += 1;
    }

    if (sleepCard && sleepCard.max > 0) {
      totalScore += (sleepCard.value / sleepCard.max) * 100;
      count += 1;
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
  };

  const productivity = calculateProductivity();

  if (loading || dashboardLoading || !dashboardData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (error || dashboardError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.primary }}>Erro ao carregar dados do usuário</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.hero, { flexDirection: width < 520 ? 'column' : 'row', alignItems: width < 520 ? 'flex-start' : 'center' }]}>
        <View>
          <Text style={styles.heroTitle}>
            olá {user?.apelido || user?.nome || 'usuário'}! 👋
          </Text>
          <Text style={styles.heroSub}>{user != null ? `Seja bem-vindo de volta! \n Oque você gostaria de fazer hoje?` : 'Você está tendo um ótimo dia produtivo. Continue assim!'}</Text>
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
          {/* Card de Produtividade em Destaque */}
          <View style={[styles.gridItem, { width: '100%' }]}> 
            <StatsCard 
              title="Produtividade Geral" 
              value={productivity} 
              max={100} 
              description="Baseado em foco e sono"
              type="gauge"
              isPrimary={true}
            />
          </View>

          <View style={[styles.gridItem, { width: '100%' }]}> 
            <SleepSummaryCard score={dashboardData.sleepScoreToday} avg={dashboardData.weekly?.avgSleepScore || 0} />
          </View>

          <View style={styles.grid}>
            {(dashboardData.stats || []).map((s, idx) => (
              <View
                key={s.key}
                style={[styles.gridItem, { width: itemWidth, marginRight: (columns > 1 && (idx % columns) !== columns - 1) ? 12 : 0 }]}
              >
                <StatsCard title={s.title} value={s.value} max={s.max} description={s.description} type={s.type} days={s.days} />
              </View>
            ))}
          </View>

          <View style={styles.recentCard}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.sectionTitle}>Atividades de Foco</Text>
              <Text style={styles.summaryBadge}>
                {dashboardData.focusSummary?.completedTasks || 0}/{dashboardData.focusSummary?.totalTasks || 0}
              </Text>
            </View>
            {(dashboardData.recentFocus || []).map((r) => (
              <View key={r.id} style={styles.recentItem}>
                <View>
                  <Text style={styles.recentTitle}>{r.title}</Text>
                  <Text style={styles.recentMeta}>{r.category} • {r.timeSpent}</Text>
                  <Text style={styles.recentTime}>{r.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={[styles.gridItem, { width: '100%' }]}> 
          <WeeklyPerformanceChart days={dashboardData.weeklyDays} targetFocusMinutes={dashboardData.weeklyTargetFocusMinutes} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: theme.colors.background.light },
  hero: { 
    backgroundColor: theme.colors.primary[700], 
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.lg,
    marginTop: -16,
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
  heroRight: { alignItems: 'flex-start', minWidth: 150 },
  heroLabel: { 
    color: theme.colors.text.inverse, 
    opacity: theme.opacity[90],
    fontSize: theme.typography.fontSize.xs,
    marginBottom: theme.spacing.xs,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.text.inverse,
    borderRadius: theme.borderRadius.lg,
  },
  barPercent: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    minWidth: 45,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card?.light || '#FFFFFF',
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
    backgroundColor: theme.colors.card?.light || '#FFFFFF', 
    padding: theme.spacing.lg, 
    borderRadius: theme.borderRadius.xl,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { 
    fontSize: theme.typography.fontSize.lg, 
    fontWeight: theme.typography.fontWeight.bold, 
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  summaryBadge: {
    backgroundColor: theme.colors.primary[50],
    color: theme.colors.primary[700],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
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
  recentMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  recentTime: { 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.secondary,
  },
});