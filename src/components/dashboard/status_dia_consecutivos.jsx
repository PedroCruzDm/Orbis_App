import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

export default function DaysStreak({ days = [], totalDays = 7 }) {
  const padded = Array.from({ length: totalDays }).map((_, i) => days[i] || false);
  const activeDays = padded.filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Estatística principal */}
      <Text style={styles.mainValue}>{activeDays}</Text>
      <Text style={styles.mainLabel}>dias ativos</Text>

      {/* Grid de dias */}
      <View style={styles.row}>
        {padded.map((active, i) => (
          <View
            key={i}
            style={[
              styles.box,
              active ? styles.boxActive : styles.boxInactive,
            ]}
          >
            <Text style={[styles.boxText, active ? styles.boxTextActive : styles.boxTextInactive]}>
              {['D','S','T','Q','Q','S','S'][i]}
            </Text>
          </View>
        ))}
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Ativo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#f3f4f6' }]} />
          <Text style={styles.legendText}>Inativo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  mainValue: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  mainLabel: { fontSize: 12, color: '#666', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  box: { 
    width: 34, 
    height: 34, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  boxActive: { backgroundColor: '#22c55e' },        
  boxInactive: { backgroundColor: '#f3f4f6' },      
  boxText: { fontSize: 12, fontWeight: '600' },
  boxTextActive: { color: '#fff' },
  boxTextInactive: { color: '#999' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#666' },
});