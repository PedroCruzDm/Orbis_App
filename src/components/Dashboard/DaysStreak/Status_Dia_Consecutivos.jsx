import { View, Text, StyleSheet } from 'react-native';
import theme from '../../../theme';

export default function DaysStreak({ days = [], totalDays = 7 }) {
  // days: array of booleans length <= totalDays
  const padded = Array.from({ length: totalDays }).map((_, i) => days[i] || false);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {padded.map((active, i) => (
          <View
            key={i}
            style={[
              styles.box,
              active ? styles.boxActive : styles.boxInactive,
              i !== padded.length - 1 && { marginRight: 6 },
            ]}
          >
            <Text style={[styles.boxText, active ? styles.boxTextActive : styles.boxTextInactive]}>{['D','S','T','Q','Q','S','S'][i]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.total}>{padded.filter(Boolean).length}/{totalDays}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  box: { 
    width: 34, 
    height: 34, 
    borderRadius: theme.borderRadius.md, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  boxActive: { backgroundColor: theme.colors.success[500] },
  boxInactive: { backgroundColor: theme.colors.gray[100] },
  boxText: { 
    fontSize: theme.typography.fontSize.xs, 
    fontWeight: theme.typography.fontWeight.semibold 
  },
  boxTextActive: { color: theme.colors.text.inverse },
  boxTextInactive: { color: theme.colors.text.secondary },
  total: { 
    marginTop: theme.spacing.sm, 
    fontSize: theme.typography.fontSize.xs, 
    color: theme.colors.text.primary 
  },
});
