import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

export default function DaysStreak({ days = [], skips = [], totalDays = 7, dates = [] }) {
  // Preenche arrays para garantir tamanho correto
  const padded = Array.from({ length: totalDays }).map((_, i) => days[i] || false);
  const skipsArray = Array.from({ length: totalDays }).map((_, i) => skips[i] || false);
  
  // Obtém a letra do dia baseada na data real passada em `dates`
  const getDayLetter = (index) => {
    const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
    if (dates && dates[index]) {
      // Cria data local para evitar shift de timezone
      const [year, month, day] = dates[index].split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dow = d.getDay(); // 0 = Dom ... 6 = Sáb
      return dayLetters[dow] || dayLetters[index] || '?';
    }
    return dayLetters[index] || '?';
  };

  // Calcula streak atual (do final voltando no tempo)
  const calculateCurrentStreak = () => {
    let streak = 0;
    for (let i = padded.length - 1; i >= 0; i--) {
      if (padded[i] || skipsArray[i]) {
        streak++;
      } else {
        break; // Para ao encontrar dia inativo sem skip
      }
    }
    return streak;
  };

  // Calcula maior streak (máxima sequência em qualquer ponto)
  const calculateLongestStreak = () => {
    let maxStreak = 0;
    let currentSeq = 0;
    for (let i = 0; i < padded.length; i++) {
      if (padded[i] || skipsArray[i]) {
        currentSeq++;
        maxStreak = Math.max(maxStreak, currentSeq);
      } else {
        currentSeq = 0;
      }
    }
    return maxStreak;
  };

  // Calcula taxa de sucesso (% de dias ativos, excluindo skips)
  const calculateSuccessRate = () => {
    const activeDays = padded.filter((day, i) => day && !skipsArray[i]).length;
    return Math.round((activeDays / totalDays) * 100);
  };

  // Determina se um dia faz parte do streak atual
  const isInCurrentStreak = (index) => {
    const currentStreak = calculateCurrentStreak();
    return index >= padded.length - currentStreak;
  };

  const currentStreak = calculateCurrentStreak();
  const longestStreak = calculateLongestStreak();
  const successRate = calculateSuccessRate();

  // Determina estilo de cada box
  const getBoxStyle = (index) => {
    const isActive = padded[index];
    const isSkipped = skipsArray[index];
    const inStreak = isInCurrentStreak(index);

    if (isSkipped) {
      return styles.boxSkipped; // Azul para dias com skip
    } else if (isActive && inStreak) {
      return styles.boxStreakActive; // Amarelo para ativos no streak atual
    } else if (isActive) {
      return styles.boxActive; // Verde para ativos fora do streak
    } else {
      return styles.boxInactive; // Cinza para inativos
    }
  };

  const getBoxTextStyle = (index) => {
    const isActive = padded[index];
    const isSkipped = skipsArray[index];
    
    if (isActive || isSkipped) {
      return styles.boxTextActive;
    }
    return styles.boxTextInactive;
  };

  return (
    <View style={styles.container}>
      {/* Estatística principal - Streak atual */}
      <Text style={styles.mainValue}>{currentStreak}</Text>
      <Text style={styles.mainLabel}>
        {currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
      </Text>

      {/* Métricas extras */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{longestStreak}</Text>
          <Text style={styles.metricLabel}>Maior</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{successRate}%</Text>
          <Text style={styles.metricLabel}>Taxa</Text>
        </View>
      </View>

      {/* Grid de dias */}
      <View style={styles.row}>
        {padded.map((active, i) => (
          <View
            key={i}
            style={[
              styles.box,
              getBoxStyle(i),
              skipsArray[i] && styles.boxSkippedBorder,
            ]}
          >
            <Text style={[styles.boxText, getBoxTextStyle(i)]}>
              {getDayLetter(i)}
            </Text>
          </View>
        ))}
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#eab308' }]} />
          <Text style={styles.legendText}>Streak</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Ativo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#3b82f6', borderWidth: 1, borderColor: '#1e40af' }]} />
          <Text style={styles.legendText}>Skip</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  mainValue: { fontSize: 32, fontWeight: '700', color: '#1F2937' },
  mainLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  metricsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#059669' },
  metricLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  metricDivider: { 
    width: 1, 
    height: 24, 
    backgroundColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  box: { 
    width: 34, 
    height: 34, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  boxActive: { backgroundColor: '#22c55e' },        
  boxStreakActive: { backgroundColor: '#eab308' },  
  boxSkipped: { backgroundColor: '#3b82f6' },       
  boxInactive: { backgroundColor: '#f3f4f6' },      
  boxSkippedBorder: { 
    borderWidth: 2, 
    borderColor: '#1e40af' 
  },
  boxText: { fontSize: 11, fontWeight: '700' },
  boxTextActive: { color: '#fff' },
  boxTextInactive: { color: '#9CA3AF' },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#6B7280' },
});