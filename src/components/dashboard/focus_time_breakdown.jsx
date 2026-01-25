import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import theme from '../../theme/index.js';

// Converte minutos para formato h:mm
const minutesToTimeFormat = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h${mins > 0 ? `:${String(mins).padStart(2, '0')}` : ''}`;
};

/**
 * FocusTimeBreakdown - Barra de progresso + breakdown por categoria
 * Props:
 *  - categories: Array [{id, label, minutes, color}]
 *  - totalMinutes: número
 *  - dailyTarget: número (padrão 60)
 *  - period: 'Dia' ou 'Semana'
 */
export default function FocusTimeBreakdown({
  categories = [],
  totalMinutes = 0,
  dailyTarget = 60,
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const chartWidth = isMobile ? width - 32 : Math.min(width - 32, 500);
  const chartHeight = isMobile ? 180 : 220;
  const safeTotalMinutes = totalMinutes || 0;

  // Top 5 categorias por tempo
  const topCategories = [...categories]
    .sort((a, b) => (b.minutes || 0) - (a.minutes || 0))
    .slice(0, 5);

  const sortedCategories = [...categories].sort((a, b) => (b.minutes || 0) - (a.minutes || 0));

  // Dados para gráfico de barras
  const chartData = {
    labels: topCategories.map(c => c.label || ''),
    datasets: [
      {
        data: topCategories.map(c => (c.minutes || 0) / 60),
        colors: topCategories.map(c => (opacity = 1) => c.color || theme.colors.primary[500]),
      },
    ],
  };

  const progressPercent = dailyTarget > 0 ? Math.min(100, (safeTotalMinutes / dailyTarget) * 100) : 0;
  const remainingMinutes = Math.max(0, dailyTarget - safeTotalMinutes);

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>⏱️ Tempo de Foco {period}</Text>
          <Text style={styles.subtitle}>Breakdown por categoria</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalMinutes}>{minutesToTimeFormat(totalMinutes)}</Text>
        </View>
      </View>

      {/* Barra de Progresso Stackada */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: progressPercent >= 100 ? '#22C55E' : '#3B82F6',
              },
            ]}
          />
        </View>
        <View style={styles.progressText}>
          <Text style={styles.progressLabel}>
            {Math.round(progressPercent)}% de {minutesToTimeFormat(dailyTarget)}
          </Text>
          <Text style={styles.progressMeta}>
            {minutesToTimeFormat(remainingMinutes)} faltam
          </Text>
        </View>
      </View>

      {/* Gráfico de Barras */}
      {topCategories.length > 0 ? (
        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
            yAxisLabel=""
            yAxisSuffix="h"
            chartConfig={{
              backgroundColor: theme.colors.background?.light || '#F5F5F5',
              backgroundGradientFrom: theme.colors.background?.light || '#F5F5F5',
              backgroundGradientTo: theme.colors.background?.light || '#F5F5F5',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              barPercentage: 0.6,
              propsForLabels: { fontSize: 11 },
            }}
            fromZero={true}
            withCustomBarColorFromData={true}
            flatColor={true}
          />
        </View>
      ) : (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>Sem atividades registradas</Text>
        </View>
      )}

      {/* Categorias Ranking */}
      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {sortedCategories
          .map((cat, idx) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryRank}>#{idx + 1}</Text>
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryTime}>{Math.round(cat.minutes || 0)} min</Text>
                </View>
              </View>
              <Text style={styles.categoryPercent}>
                {safeTotalMinutes > 0 ? Math.round(((cat.minutes || 0) / safeTotalMinutes) * 100) : 0}%
              </Text>
            </View>
          ))}
      </ScrollView>
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
  totalBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minWidth: 64,
  },
  totalMinutes: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.xxxs || 10,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBarBg: {
    height: 20,
    backgroundColor: 'rgba(150,150,150,0.2)',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  progressMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  chartContainer: {
    marginVertical: theme.spacing.lg,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    backgroundColor: 'rgba(150,150,150,0.05)',
    borderRadius: theme.borderRadius.md,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRank: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
    minWidth: 20,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  categoryLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  categoryTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  categoryPercent: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
  },
});
