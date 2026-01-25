import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme/index.js';

/**
 * RecentActivityList - Lista scrollable com status icons e filtro
 * Props:
 *  - activities: Array [{id, title, category, time, date, status, xp}]
 *  - onFilterCategory: func(categoryId)
 *  - selectedCategory: string ou null
 *  - period: 'Dia' ou 'Semana'
 */
export default function RecentActivityList({
  activities = [],
  onFilterCategory = () => {},
  selectedCategory = null,
  period = 'Dia'
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [showAll, setShowAll] = useState(false);

  const CATEGORY_ICONS = {
    Ler: 'book-open-page-variant',
    Estudar: 'school',
    Praticar: 'dumbbell',
    Revisar: 'magnify',
    Descanso: 'coffee',
    Treinar: 'run',
    Assistir: 'monitor',
  };

  const CATEGORY_COLORS = {
    Ler: '#3B82F6',
    Estudar: '#8B5CF6',
    Praticar: '#10B981',
    Revisar: '#F59E0B',
    Descanso: '#EC4899',
    Treinar: '#EF4444',
    Assistir: '#6366F1',
  };

  // Filtra atividades se houver categoria selecionada
  const filteredActivities = selectedCategory
    ? activities.filter(a => a.category === selectedCategory)
    : activities;

  // Limita exibição quando não está expandido
  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5);
  const hasMore = filteredActivities.length > 5;

  // Agrupa atividades por categoria para contar
  const categoryCounts = activities.reduce((acc, act) => {
    acc[act.category] = (acc[act.category] || 0) + 1;
    return acc;
  }, {});

  const getStatusIcon = (status) => {
    if (status === 'concluida' || status === 'sucesso') {
      return { icon: 'check-circle', color: '#22C55E' };
    }
    if (status === 'falha') {
      return { icon: 'close-circle', color: '#EF4444' };
    }
    return { icon: 'clock', color: '#F59E0B' };
  };

  const renderActivity = ({ item, index }) => {
    const statusIcon = getStatusIcon(item.status);
    const categoryColor = CATEGORY_COLORS[item.category] || '#9CA3AF';

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityRank}>
          <Text style={styles.rankNumber}>#{index + 1}</Text>
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityTop}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.xpBadge, { backgroundColor: item.xp >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
              <Text style={[styles.xpText, { color: item.xp >= 0 ? '#22C55E' : '#EF4444' }]}>
                {item.xp >= 0 ? '+' : ''}{item.xp} XP
              </Text>
            </View>
          </View>

          <View style={styles.activityMeta}>
            <View style={styles.categoryTag}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name={statusIcon.icon}
          size={22}
          color={statusIcon.color}
        />
      </View>
    );
  };

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📋 Atividades Recentes {period}</Text>
          <Text style={styles.subtitle}>Histórico de foco</Text>
        </View>
      </View>

      {/* Filtro por Categoria */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          onPress={() => onFilterCategory(null)}
          style={[
            styles.filterChip,
            !selectedCategory && styles.filterChipActive,
          ]}
        >
          <Text style={[
            styles.filterText,
            !selectedCategory && styles.filterTextActive,
          ]}>
            Todos ({activities.length})
          </Text>
        </TouchableOpacity>

        {Object.entries(categoryCounts).map(([catId, count]) => (
          <TouchableOpacity
            key={catId}
            onPress={() => onFilterCategory(catId)}
            style={[
              styles.filterChip,
              selectedCategory === catId && styles.filterChipActive,
              { borderColor: CATEGORY_COLORS[catId] || '#D1D5DB' },
            ]}
          >
            <View
              style={[
                styles.filterDot,
                { backgroundColor: CATEGORY_COLORS[catId] || '#9CA3AF' },
              ]}
            />
            <Text style={[
              styles.filterText,
              selectedCategory === catId && styles.filterTextActive,
            ]}>
              {catId.charAt(0).toUpperCase() + catId.slice(1)} ({count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Atividades */}
      {filteredActivities.length > 0 ? (
        <>
          <FlatList
            data={displayedActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            style={styles.list}
          />
          
          {/* Botão Exibir Mais */}
          {hasMore && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'Exibir menos' : `Exibir mais (${filteredActivities.length - 5})`}
              </Text>
              <MaterialCommunityIcons 
                name={showAll ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color={theme.colors.primary[500]} 
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {selectedCategory ? `Nenhuma atividade em ${selectedCategory}` : 'Sem atividades ainda'}
          </Text>
        </View>
      )}

      {/* Resumo */}
      {filteredActivities.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Atividades</Text>
            <Text style={styles.summaryValue}>{filteredActivities.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Taxa de Sucesso</Text>
            <Text style={styles.summaryValue}>
              {Math.round(
                (filteredActivities.filter(a => a.status === 'concluida').length / filteredActivities.length) * 100
              )}%
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>XP Total</Text>
            <Text style={[
              styles.summaryValue,
              { color: filteredActivities.reduce((sum, a) => sum + a.xp, 0) >= 0 ? '#22C55E' : '#EF4444' }
            ]}>
              +{filteredActivities.reduce((sum, a) => sum + a.xp, 0)}
            </Text>
          </View>
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
  filterScroll: {
    marginBottom: theme.spacing.lg,
    flexGrow: 0,
  },
  filterContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingRight: theme.spacing.lg,
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.light,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary[700],
    borderColor: theme.colors.primary[700],
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  filterText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    marginBottom: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  activityRank: {
    width: 30,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  activityContent: {
    flex: 1,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  activityTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  xpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
    minWidth: 48,
    alignItems: 'center',
  },
  xpText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(200,200,200,0.1)',
    borderRadius: theme.borderRadius.md,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border.light,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  showMoreText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[500],
  },
});
