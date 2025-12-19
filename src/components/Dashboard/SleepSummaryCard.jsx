import { View, Text, StyleSheet } from 'react-native';
import CircularGauge from './CircularGauge/CircularGauge';
import theme from '../../theme';

export default function SleepSummaryCard({ score = 0, avg = null }) {
  const lowSleep = score < 60;
  const insight = lowSleep
    ? 'Sono abaixo do ideal hoje. Considere blocos de foco ≤25min e evite cafeína após 16h.'
    : 'Bom descanso! Mantenha a consistência para maximizar sua produtividade.';

  return (
    <View style={[
      styles.card,
      lowSleep && { borderColor: theme.colors.alert[500], borderWidth: 1 },
    ]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Score de Sono</Text>
        {avg != null ? (
          <Text style={styles.avg}>Média semanal: {Math.round(avg)}</Text>
        ) : null}
      </View>

      <View style={styles.center}> 
        <CircularGauge value={score} max={100} size={110} strokeWidth={6} />
      </View>

      <Text style={[styles.insight, lowSleep && { color: theme.colors.alert[600] }]}>
        {insight}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  avg: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  center: { alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  insight: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});
