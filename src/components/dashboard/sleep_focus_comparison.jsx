import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import theme from '../../theme/index.js';

/**
 * SleepFocusComparison - Linha dual comparando sono vs foco
 * Props:
 *  - weeklyData: Array [{day, sleepScore (0-100), focusMinutes}]
 */
export default function SleepFocusComparison({
  weeklyData = [],
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const chartWidth = isMobile ? width - 32 : Math.min(width - 32, 580);
  const chartHeight = isMobile ? 180 : 220;

  // Normaliza foco para escala 0-100
  const maxFocusMinutes = 240; // 4 horas máximo
  const normalizedData = weeklyData.map(d => ({
    ...d,
    focusScore: Math.min(100, (d.focusMinutes / maxFocusMinutes) * 100),
  }));

  // Calcula correlação de Pearson
  const calculateCorrelation = () => {
    if (normalizedData.length < 2) return 0;
    
    const sleepScores = normalizedData.map(d => d.sleepScore || 0);
    const focusScores = normalizedData.map(d => d.focusScore || 0);
    
    const avgSleep = sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;
    const avgFocus = focusScores.reduce((a, b) => a + b, 0) / focusScores.length;
    
    let numerator = 0;
    let denomSleep = 0;
    let denomFocus = 0;
    
    for (let i = 0; i < normalizedData.length; i++) {
      const sleepDiff = sleepScores[i] - avgSleep;
      const focusDiff = focusScores[i] - avgFocus;
      numerator += sleepDiff * focusDiff;
      denomSleep += sleepDiff * sleepDiff;
      denomFocus += focusDiff * focusDiff;
    }
    
    const denominator = Math.sqrt(denomSleep * denomFocus);
    
    // Retorna 0 se denominador for 0 ou NaN para evitar divisão por zero
    if (!denominator || isNaN(denominator) || denominator === 0) return 0;
    
    const result = numerator / denominator;
    return isNaN(result) ? 0 : result;
  };

  const correlation = calculateCorrelation();

  // Dados para gráfico dual
  const chartData = {
    labels: normalizedData.map(d => d.day?.slice(0, 3) || ''),
    datasets: [
      {
        data: normalizedData.map(d => d.sleepScore),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2.5,
      },
      {
        data: normalizedData.map(d => d.focusScore),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2.5,
      },
    ],
  };

  const getCorrelationInsight = (corr) => {
    if (isNaN(corr) || corr === 0) return '📊 Dados insuficientes para análise.';
    if (corr > 0.7) return '✨ Forte: Melhor sono = mais foco!';
    if (corr > 0.3) return '📊 Moderada: Relação positiva detectada.';
    if (corr > -0.3) return '↔️ Fraca: Pouca relação entre sono e foco.';
    return '⚠️ Negativa: Sono e foco variam inversamente.';
  };

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>😴 vs ⚡ Sono & Foco {period}</Text>
          <Text style={styles.subtitle}>{period === 'Dia' ? 'Análise de hoje' : 'Análise de correlação semanal'}</Text>
        </View>
      </View>

      {normalizedData.length >= 1 ? (
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
              propsForDots: { r: '3', strokeWidth: '2' },
              propsForLabels: { fontSize: 11 },
            }}
            bezier
            withVerticalLines={false}
            withHorizontalLines={true}
          />

          {/* Legenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Sono (esquerda)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Foco (direita)</Text>
            </View>
          </View>

          {/* Insight */}
          <View style={styles.insight}>
            <Text style={styles.insightLabel}>
              📈 Correlação: {(correlation * 100).toFixed(0)}%
            </Text>
            <Text style={styles.insightText}>
              {getCorrelationInsight(correlation)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados suficientes para análise</Text>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginVertical: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  insight: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  insightLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  insightText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
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
