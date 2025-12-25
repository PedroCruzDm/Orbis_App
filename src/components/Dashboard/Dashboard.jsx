import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import StatsCard from './stats_card.jsx';
import { dashboardStats as stats, dashboardRecent as recent, dashboardSleepScoreToday as sleepScoreToday, dashboardWeekly as weekly, dashboardWeeklyDays as weeklyDays, dashboardWeeklyTargetFocusMinutes as weeklyTargetFocusMinutes } from '../../data/data.js';
import { getCurrentUser } from '../../data/user';
import SleepSummaryCard from './sleep_summary_card.jsx';
import WeeklyPerformanceChart from './weekly_performance_chart.jsx';
import theme from '../../theme/index.js';

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 520 ? 2 : 1;
  const itemWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '32%';
  
  const [period, setPeriod] = useState('Dia');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcula a produtividade com base nos dados reais
  const calculateProductivity = () => {
    if (!stats || stats.length === 0) return 0;
    
    const focusCard = stats.find(s => s.key === 'focus');
    const exerciseCard = stats.find(s => s.key === 'exercise');
    const waterCard = stats.find(s => s.key === 'water');
    
    let totalScore = 0;
    let count = 0;

    if (focusCard && focusCard.max > 0) {
      totalScore += (focusCard.value / focusCard.max) * 100;
      count++;
    }
    
    if (exerciseCard && exerciseCard.max > 0) {
      totalScore += (exerciseCard.value / exerciseCard.max) * 100;
      count++;
    }
    
    if (waterCard && waterCard.max > 0) {
      totalScore += (waterCard.value / waterCard.max) * 100;
      count++;
    }

    if (sleepScoreToday > 0) {
      totalScore += sleepScoreToday;
      count++;
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
  };

  const productivity = calculateProductivity();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserName = () => {
    if (!user) return 'usuário';
    return user.apelido || user.nome || 'usuário';
  };

  if (loading) {
    return (
      <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[700]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.hero, { flexDirection: width < 520 ? 'column' : 'row', alignItems: width < 520 ? 'flex-start' : 'center' }]}>
        <View>
          <Text style={styles.heroTitle}>{getGreeting()}, {getUserName()}! 👋</Text>
          <Text style={styles.heroSub}>
            {user ? 'Você está tendo um ótimo dia produtivo. Continue assim!' : 'Faça login para ver suas estatísticas'}
          </Text>
        </View>
        {user && (
          <View style={[styles.heroRight, width < 520 && { marginTop: 12 }]}> 
            <Text style={styles.heroPercent}>92%</Text>
            <Text style={styles.heroLabel}>Produtividade</Text>
          </View>
        )}
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
              description="Baseado em foco, exercício, hidratação e sono"
              type="gauge"
              isPrimary={true}
            />
          </View>

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