import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import theme from '../../theme/index.js';

/**
 * ProductivityEvolution - Gráfico de linha evolutiva semanal
 * Props:
 *  - weeklyData: Array [{day, productivity}]  (0-100)
 *  - currentScore: número (0-100)
 *  - targetScore: número (padrão 80)
 *  - period: 'Dia' ou 'Semana'
 */
export default function ProductivityEvolution({ 
  weeklyData = [],
  currentScore = 0,
  targetScore = 80,
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const chartWidth = isMobile ? width - 32 : Math.min(width - 32, 600);
  const chartHeight = isMobile ? 160 : 200;

  // Filtra dados baseado no período
  const displayData = period === 'Dia' 
    ? weeklyData.slice(-1) // Apenas o dia de hoje (último item)
    : weeklyData; // Semana inteira

  // Dados para o gráfico
  const chartData = {
    labels: displayData.map(d => d.day?.slice(0, 3) || ''),
    datasets: [
      {
        data: displayData.map(d => d.productivity || 0),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2.5,
        withDots: true,
      },
      {
        data: Array(Math.max(displayData.length, 1)).fill(targetScore),
        color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
        strokeWidth: 1.5,
        withDots: false,
        strokeDasharray: [5, 5],
      },
    ],
  };

  const getInsight = (score) => {
    if (score >= targetScore) return '✨ Acima da meta! Excelente semana!';
    if (score >= targetScore * 0.8) return '📊 Próximo da meta. Continue assim!';
    return '⚠️ Abaixo da meta. Aumente o foco!';
  };

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📈 Produtividade {period}</Text>
          <Text style={styles.subtitle}>
            {period === 'Dia' ? 'Meta: 2h' : 'Evolução semanal'}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.score, { color: currentScore >= targetScore ? '#22C55E' : '#F59E0B' }]}>
            {currentScore}%
          </Text>
        </View>
      </View>

      {displayData.length >= 1 ? (
        <>
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
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#22C55E' },
              propsForLabels: { fontSize: 11 },
            }}
            bezier
            withVerticalLines={false}
            withHorizontalLines={true}
          />

          <View style={styles.insight}>
            <Text style={styles.insightText}>{getInsight(currentScore)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados suficientes ainda</Text>
        </View>
      )}
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
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  score: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  insight: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    marginTop: theme.spacing.md,
  },
  insightText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
});
