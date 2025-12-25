import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

// Simple dual-bar chart without external libs.
// Each day shows two bars normalized to 0-100%:
// - Focus: minutes vs weekly target minutes
// - Sleep: score vs 100
export default function WeeklyPerformanceChart({ days = [], targetFocusMinutes = 1200, height = 160 }) {
  const colWidth = `${Math.floor(100 / (days.length || 7))}%`;

  return (
    <View style={[styles.card]}>
      <Text style={styles.title}>Performance semanal: Foco vs Sono</Text>
      <View style={[styles.chart, { height }]}> 
        {days.map((d) => {
          const focusPct = Math.max(0, Math.min(100, Math.round((d.focusMinutes / targetFocusMinutes) * 100)));
          const sleepPct = Math.max(0, Math.min(100, Math.round(d.sleepScore)));
          const focusH = Math.max(4, Math.round((focusPct / 100) * (height - 20))); // min height
          const sleepH = Math.max(4, Math.round((sleepPct / 100) * (height - 20)));
          return (
            <View key={d.label} style={[styles.column, { width: colWidth }]}> 
              <View style={styles.barsRow}>
                <View style={[styles.bar, { height: focusH, backgroundColor: theme.colors.success[500] }]} />
                <View style={[styles.bar, { height: sleepH, backgroundColor: theme.colors.primary[500] }]} />
              </View>
              <Text style={styles.dayLabel}>{d.label}</Text>
            </View>
          );
        })}
        {/* Optional overlay line for weekly target (100%) */}
        <View style={[styles.overlayLine, { top: 0 }]} />
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.success[500] }]} />
          <Text style={styles.legendText}>Foco (% da meta)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary[500] }]} />
          <Text style={styles.legendText}>Sono (score)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  column: { alignItems: 'center', justifyContent: 'flex-end' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: 12, borderRadius: 6, marginHorizontal: 4 },
  dayLabel: { marginTop: 6, fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary },
  overlayLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  legendRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.md },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary },
});
