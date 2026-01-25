import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme/index.js';

/**
 * StreakCarousel - Carousel de conquistas com badges e flame icon
 * Props:
 *  - currentStreak: número de dias consecutivos
 *  - achievements: Array [{id, title, icon, color, unlocked}]
 */
export default function StreakCarousel({
  currentStreak = 0,
  achievements = []
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;

  const defaultAchievements = [
    { id: '1day', title: '1 Dia', icon: 'fire', color: '#FF6B6B', target: 1, unlocked: currentStreak >= 1 },
    { id: '3days', title: '3 Dias', icon: 'flame', color: '#FFA500', target: 3, unlocked: currentStreak >= 3 },
    { id: '7days', title: '7 Dias', icon: 'star', color: '#FFD700', target: 7, unlocked: currentStreak >= 7 },
    { id: '14days', title: '14 Dias', icon: 'crown', color: '#C0C0C0', target: 14, unlocked: currentStreak >= 14 },
    { id: '30days', title: '30 Dias', icon: 'trophy', color: '#FFD700', target: 30, unlocked: currentStreak >= 30 },
  ];

  const badges = achievements.length > 0 ? achievements : defaultAchievements;

  return (
    <View style={[styles.card, { paddingHorizontal: isMobile ? theme.spacing.md : theme.spacing.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔥 Streak & Conquistas</Text>
          <Text style={styles.subtitle}>Mantenha a consistência</Text>
        </View>
      </View>

      {/* Streak Atual */}
      <View style={styles.streakBox}>
        <View style={styles.streakContent}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Dias</Text>
        </View>
        <View style={styles.streakFire}>
          <MaterialCommunityIcons
            name="fire"
            size={48}
            color={currentStreak > 0 ? '#FF6B6B' : '#D1D5DB'}
          />
        </View>
      </View>

      {/* Badges Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeWrapper}>
            <View
              style={[
                styles.badge,
                badge.unlocked
                  ? { backgroundColor: badge.color, opacity: 1 }
                  : { backgroundColor: '#D1D5DB', opacity: 0.5 },
              ]}
            >
              <MaterialCommunityIcons
                name={badge.icon || 'star'}
                size={28}
                color={badge.unlocked ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
            <Text style={styles.badgeLabel}>{badge.title}</Text>
            {badge.target && (
              <Text style={[styles.badgeTarget, { color: badge.unlocked ? badge.color : '#9CA3AF' }]}>
                {badge.target}d
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Próxima Meta */}
      <View style={styles.nextGoal}>
        <View>
          <Text style={styles.goalLabel}>Próxima Meta</Text>
          {currentStreak < 7 ? (
            <Text style={styles.goalValue}>
              {7 - currentStreak} dias para 7 dias 🎯
            </Text>
          ) : currentStreak < 30 ? (
            <Text style={styles.goalValue}>
              {30 - currentStreak} dias para 30 dias 🏆
            </Text>
          ) : (
            <Text style={styles.goalValue}>
              Parabéns! Você é um campeão! 👑
            </Text>
          )}
        </View>
      </View>

      {/* Motivação */}
      <View style={styles.motivation}>
        <Text style={styles.motivationText}>
          💡 Mantenha o foco! Cada dia consistente te traz mais perto da sua meta.
        </Text>
      </View>
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
  streakBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 100%)',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  streakContent: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FF6B6B',
  },
  streakLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: '#9CA3AF',
    marginTop: theme.spacing.xs,
  },
  streakFire: {
    alignItems: 'center',
  },
  carousel: {
    marginBottom: theme.spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgeLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  badgeTarget: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  nextGoal: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
    marginBottom: theme.spacing.md,
  },
  goalLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  goalValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  motivation: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  motivationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
});
