import { View, Text, StyleSheet } from 'react-native';
import theme from '../../theme';

export default function DaysStreak({ currentStreak = 0, days = [], skips = [], totalDays = 7, dates = [] }) {
  // Preenche arrays para garantir tamanho correto
  const paddedDays = Array.from({ length: totalDays }).map((_, i) => days[i] || false);
  const paddedSkips = Array.from({ length: totalDays }).map((_, i) => skips[i] || false);
  
  console.log('=== DaysStreak Props ===');
  console.log('currentStreak recebido:', currentStreak);
  console.log('days recebido:', days);
  console.log('paddedDays calculado:', paddedDays);
  console.log('skips recebido:', skips);
  console.log('paddedSkips calculado:', paddedSkips);
  console.log('dates recebido:', dates);
  
  const datesList = dates && dates.length === totalDays ? dates : Array.from({ length: totalDays }, (_, i) => {
    // Gera datas de fallback a partir de hoje
    const d = new Date();
    d.setDate(d.getDate() - (totalDays - 1 - i));
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  
  // Obtém a letra do dia baseada na data real passada em `dates`
  const getDayLetter = (index) => {
    const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
    if (datesList && datesList[index]) {
      // Converte YYYY-MM-DD para Date local
      const [year, month, day] = datesList[index].split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dow = d.getDay(); // 0 = Dom ... 6 = Sáb
      return dayLetters[dow] || '?';
    }
    return dayLetters[index] || '?';
  };

  // Calcula maior streak (máxima sequência em qualquer ponto), ignorando skips
  const calculateLongestStreak = () => {
    let maxStreak = 0;
    let currentSeq = 0;
    for (let i = 0; i < paddedDays.length; i++) {
      if (paddedDays[i]) {
        currentSeq++;
        maxStreak = Math.max(maxStreak, currentSeq);
      } else if (!paddedSkips[i]) {
        currentSeq = 0; // Reseta apenas em inativos não skipped
      }
      // Se skipped, continua sem resetar nem incrementar
    }
    return maxStreak;
  };

  // Calcula taxa de sucesso (% de dias ativos, excluindo skips do total)
  const calculateSuccessRate = () => {
    const nonSkippedDays = paddedDays.length - paddedSkips.filter(skip => skip).length;
    const activeDays = paddedDays.filter((day) => day).length;
    return nonSkippedDays > 0 ? Math.round((activeDays / nonSkippedDays) * 100) : 0;
  };

  // Determina se um dia faz parte do streak atual
  const isInCurrentStreak = (index) => {
    return index >= paddedDays.length - currentStreak;
  };

  const longestStreak = calculateLongestStreak();
  const successRate = calculateSuccessRate();
  
  console.log('Streak (do componente):', { currentStreak, longestStreak, successRate });

  // Determina estilo de cada box
  const getBoxStyle = (index) => {
    const isActive = paddedDays[index];
    const isSkipped = paddedSkips[index];
    const inStreak = isInCurrentStreak(index);

    if (isSkipped) {
      return styles.boxSkipped; // Azul para skipped
    } else if (isActive && inStreak) {
      return styles.boxStreakActive; // Amarelo para ativos no streak atual
    } else if (isActive) {
      return styles.boxActive; // Verde para ativos fora do streak
    } else {
      return styles.boxInactive; // Cinza para inativos
    }
  };

  const getBoxTextStyle = (index) => {
    const isActive = paddedDays[index];
    const isSkipped = paddedSkips[index];
    
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
        {paddedDays.map((active, i) => (
          <View
            key={i}
            style={[
              styles.box,
              getBoxStyle(i),
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
          <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
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
  boxText: { fontSize: 11, fontWeight: '700' },
  boxTextActive: { color: '#fff' },
  boxTextInactive: { color: '#9CA3AF' },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#6B7280' },
});