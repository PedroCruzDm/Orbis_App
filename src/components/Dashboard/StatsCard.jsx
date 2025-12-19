import { View, Text, StyleSheet } from 'react-native';
import CircularGauge from './CircularGauge/CircularGauge';
import DaysStreak from './DaysStreak/Status_Dia_Consecutivos';
import theme from '../../theme';

export default function StatsCard({ title, value = 0, max = 100, description, type = 'gauge', days = [] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      <View style={styles.center}> 
        {type === 'days' ? (
          <DaysStreak days={days} totalDays={max} />
        ) : (
          <CircularGauge value={value} max={max} size={100} strokeWidth={6} />
        )}
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
  header: { marginBottom: theme.spacing.sm },
  title: { 
    fontSize: theme.typography.fontSize.sm, 
    fontWeight: theme.typography.fontWeight.bold, 
    color: theme.colors.text.primary,
  },
  description: { 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.secondary, 
    marginBottom: theme.spacing.sm,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
});
