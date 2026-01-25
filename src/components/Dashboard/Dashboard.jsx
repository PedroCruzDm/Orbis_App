import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator, AppState } from 'react-native';
import ProductivityEvolution from './productivity_evolution.jsx';
import SleepQualityCard from './sleep_quality_card.jsx';
import FocusTimeBreakdown from './focus_time_breakdown.jsx';
import FocusQualityHeatmap from './focus_quality_heatmap.jsx';
import SleepFocusComparison from './sleep_focus_comparison.jsx';
import DaysStreak from './status_dia_consecutivos.jsx';
import RecentActivityList from './recent_activity_list.jsx';
import { useUserData } from '../../hooks/use_user_data.js';
import { useDashboardData } from '../../hooks/use_dashboard_data.js';
import theme from '../../theme/index.js';
import { dashboardEvents } from '../../utils/dashboard_events.js';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 520 ? 2 : 1;
  const itemWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '32%';
  const [period, setPeriod] = useState('Dia');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const isDay = period === 'Dia';
  const appState = useRef(AppState.currentState);
  
  const { user, loading, error, refetch: refetchUser } = useUserData();
  const { dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData();

  // Atualiza dados ao montar o componente
  useEffect(() => {
    refetchUser();
  }, []);

  // Atualiza dados quando o app volta ao primeiro plano ou componente é montado
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App voltou ao primeiro plano, refetch dados
        refetchDashboard();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refetchDashboard]);

  // Inscreve-se em eventos de atualização do Firebase
  useEffect(() => {
    const unsubscribe = dashboardEvents.subscribe(() => {
      refetchDashboard();
    });

    return unsubscribe;
  }, [refetchDashboard]);

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

  // Modo Dia exibe a semana toda mas destaca o score do dia atual
  const productivityData = dashboardData?.weeklyData || [];
  const productivityScore = dashboardData?.currentScore || 0;
  const comparisonData = dashboardData?.weeklyComparisonData || [];

  const focusCategories = isDay
    ? dashboardData?.categoriesDay || dashboardData?.categories || []
    : dashboardData?.categoriesWeek || dashboardData?.categories || [];
  const focusTotalMinutes = isDay
    ? dashboardData?.focusSummary?.totalTimeMinutes || 0
    : dashboardData?.focusSummary?.weekTotalMinutes || dashboardData?.focusSummary?.totalTimeMinutes || 0;
  const focusTargetMinutes = isDay ? 120 : dashboardData?.weeklyTargetFocusMinutes || 1200;
  const activities = isDay
    ? dashboardData?.recentActivitiesToday || []
    : dashboardData?.recentActivities || [];

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
            olá {(user?.apelido && user.apelido.trim()) || user?.nome?.split(' ')[0] || 'usuário'}! 👋
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

      <ProductivityEvolution 
        weeklyData={productivityData}
        currentScore={productivityScore}
        targetScore={dashboardData?.targetScore || 80}
        period={period}
      />

      <SleepQualityCard 
        scoreToday={dashboardData?.sleepScoreToday || 0}
        weeklyScores={dashboardData?.weeklyScores || []}
        hoursSlept={dashboardData?.hoursSlept || 0}
        cycles={dashboardData?.cycles || 0}
        efficiency={dashboardData?.efficiency || 0}
        insight={dashboardData?.sleepInsight || ''}
        period={period}
      />

      <FocusTimeBreakdown 
        categories={focusCategories}
        totalMinutes={focusTotalMinutes}
        dailyTarget={focusTargetMinutes}
        period={period}
      />

      <FocusQualityHeatmap 
        heatmapData={dashboardData?.heatmapData || {}}
        period={period}
      />

      <SleepFocusComparison 
        weeklyData={comparisonData}
        period={period}
      />

      <DaysStreak 
        currentStreak={dashboardData?.stats?.find(s => s.key === 'streak')?.value || 0}
        days={dashboardData?.stats?.find(s => s.key === 'streak')?.days || []}
        dates={dashboardData?.stats?.find(s => s.key === 'streak')?.dates || []}
        totalDays={7}
      />
      {console.log('=== DASHBOARD LOGS ===') || console.log('Streak stat:', dashboardData?.stats?.find(s => s.key === 'streak')) || null}

      <RecentActivityList 
        activities={activities}
        onFilterCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        period={period}
      />
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