import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import theme from '../../theme/index.js';

/**
 * FocusQualityHeatmap - Heatmap semanal mostrando intensidade por dia/hora
 * Props:
 *  - heatmapData: Array [{day, hours: [0-10 para cada hora]}]
 *  - period: 'Dia' ou 'Semana'
 */
export default function FocusQualityHeatmap({
  heatmapData = {},
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const cellSize = isMobile ? 12 : 16;
  const labelWidth = isMobile ? 30 : 36;
  const gap = isMobile ? 0.5 : 0.8;

  // Converte objeto em array se necessário
  const convertData = (inputData) => {
    if (!inputData) return [];
    
    // Se é array, retorna como está
    if (Array.isArray(inputData)) return inputData;
    
    // Se é objeto, converte para array de {day, hours}
    const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const shortLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return dayLabels.map((fullDay, idx) => ({
      day: shortLabels[idx],
      hours: inputData[fullDay] || Array(24).fill(0),
    }));
  };

  // Dados padrão se não houver
  const data = convertData(heatmapData);

  const todayIndex = (new Date().getDay() + 6) % 7; // normaliza para segunda = 0
  const shortLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const todayLabel = shortLabels[todayIndex];

  // Se for visualização de DIA, mostra apenas o dia de hoje
  const displayData = period === 'Dia' && data.length > 0
    ? data.filter((d) => d.day === todayLabel)
    : data;

  const getHeatColor = (value, max = 10) => {
    if (value === 0) return '#E5E7EB';
    const intensity = Math.min(1, value / max);
    const hue = 120; // Verde
    const lightness = 90 - intensity * 40; // 90% a 50%
    return `hsl(${hue}, 60%, ${lightness}%)`;
  };

  const hoursLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}` : `${i}`;
    // Mostra rótulo de 4 em 4 horas (00, 04, 08, 12, 16, 20)
    return i % 4 === 0 ? hour : '';
  });

  // Retorna todas as 24 horas, independente do período
  const getFilteredHours = (hours) => {
    return hours;
  };

  const getFilteredLabels = (labels) => {
    return labels;
  };

  // Calcula largura do grid após helpers existirem
  const hoursCount = getFilteredLabels(Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`))).length;
  const gridWidth = hoursCount * (cellSize + gap * 2);

  // Se data estiver vazia, mostra estado vazio
  if (!displayData || displayData.length === 0) {
    return (
      <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🔥 Foco Bem Gasto {period}</Text>
            <Text style={styles.subtitle}>Intensidade por {period === 'Dia' ? 'hora' : 'dia/hora'}</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sem dados de foco ainda</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔥 Foco Bem Gasto {period}</Text>
          <Text style={styles.subtitle}>
            {period === 'Dia' ? 'Intensidade por hora' : 'Intensidade por dia/hora'}
          </Text>
        </View>
      </View>

      {/* Heatmap Grid - Scrollável Horizontalmente */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
        <View style={[styles.heatmapWrapper, { minWidth: gridWidth + labelWidth + 12 }]}>
        {/* Header com horas */}
        <View style={styles.hoursHeader}>
          <View style={{ width: labelWidth }} />
          <View style={[styles.hoursGrid, { width: gridWidth }]}>
            {getFilteredLabels(hoursLabels).map((hour, idx) => (
              <View key={idx} style={{ width: cellSize, alignItems: 'center' }}>
                <Text style={styles.hourLabel}>{hour}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Grid de dias */}
        {displayData.map((dayData) => (
          <View key={dayData.day} style={styles.dayRow}>
            <Text style={[styles.dayLabel, { width: labelWidth }]}>
              {dayData.day}
            </Text>
            <View style={[styles.hoursGrid, { width: gridWidth }]}>
              {getFilteredHours(dayData.hours).map((value, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getHeatColor(value),
                    },
                  ]}
                  title={`${dayData.day} ${idx}h: ${Math.round(value)} atividades`}
                />
              ))}
            </View>
          </View>
        ))}
        </View>
      </ScrollView>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Nenhuma</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#86EFAC' }]} />
          <Text style={styles.legendText}>Baixa</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#34D399' }]} />
          <Text style={styles.legendText}>Média</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Alta</Text>
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insight}>
        <Text style={styles.insightText}>
          💡 Pico de atividades nos horários da manhã (8h-12h)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card?.light || '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
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
  heatmapScroll: {
    marginBottom: theme.spacing.lg,
  },
  heatmapWrapper: {
    overflow: 'visible',
  },
  hoursHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hourLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    minWidth: 16,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  cell: {
    borderRadius: 2,
    margin: 0.5,
    borderWidth: 0.3,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginBottom: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  insight: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
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
