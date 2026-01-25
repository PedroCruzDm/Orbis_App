import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import theme from '../../theme/index.js';

/**
 * SleepQualityCard - Card proeminente com mini-hipnograma
 * Props:
 *  - scoreToday: número (0-100)
 *  - weeklyScores: Array [80, 75, 88, ...] (7 dias)
 *  - hoursSlept: número com decimal (7.5h)
 *  - cycles: número (5)
 *  - efficiency: número (0-100)
 *  - insight: string com recomendação IA
 */
export default function SleepQualityCard({
  scoreToday = 0,
  weeklyScores = [],
  hoursSlept = 0,
  cycles = 0,
  efficiency = 0,
  insight = '',
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const chartWidth = isMobile ? width - 32 : Math.min(width - 32, 500);
  const chartHeight = isMobile ? 100 : 120;

  // Mini hipnograma (stepline simples)
  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: weeklyScores.length > 0 ? weeklyScores : [70, 75, 80, 70, 65, 78, 82],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22C55E'; // Verde
    if (score >= 60) return '#F59E0B'; // Amarelo
    return '#EF4444'; // Vermelho
  };

  const getDefaultInsight = () => {
    if (scoreToday >= 80) return '✨ Excelente sono! Mantenha essa rotina.';
    if (scoreToday >= 60) return '📊 Sono regular. Tente manter consistência.';
    return '⚠️ Sono baixo. Priorize descanso hoje.';
  };

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>😴 Qualidade do Sono {period}</Text>
          <Text style={styles.subtitle}>{period === 'Dia' ? 'Score de hoje' : 'Score semanal'}</Text>
        </View>
        <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(scoreToday) + '20' }]}>
          <Text style={[styles.scoreText, { color: getScoreColor(scoreToday) }]}>
            {Math.round(scoreToday)}%
          </Text>
        </View>
      </View>

      {/* Mini Hipnograma */}
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={{
            backgroundColor: theme.colors.background?.light || '#F5F5F5',
            backgroundGradientFrom: theme.colors.background?.light || '#F5F5F5',
            backgroundGradientTo: theme.colors.background?.light || '#F5F5F5',
            color: () => `rgba(107, 114, 128, 0.3)`,
            strokeWidth: 2,
            propsForDots: { r: '2', strokeWidth: '0' },
            propsForLabels: { fontSize: 11 },
          }}
          bezier={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withInnerLines={false}
        />
      </View>

      {/* Métricas Rápidas */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Horas</Text>
          <Text style={styles.metricValue}>{hoursSlept.toFixed(1)}h</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Ciclos</Text>
          <Text style={styles.metricValue}>{cycles}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Eficiência</Text>
          <Text style={styles.metricValue}>{Math.round(efficiency)}%</Text>
        </View>
      </View>

      {/* Insight IA */}
      <View style={styles.insight}>
        <Text style={styles.insightText}>
          💡 {insight || getDefaultInsight()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card?.light || '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
  },
  chartWrapper: {
    marginVertical: theme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(200,200,200,0.05)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border.light,
  },
  insight: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  insightText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
