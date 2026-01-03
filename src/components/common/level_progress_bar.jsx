import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import { getLevelInfo } from '../../utils/xp_system';

/**
 * Componente de exibição de nível e progresso de XP
 */
const LevelProgressBar = ({ totalXp = 0, compact = false }) => {
    const levelInfo = getLevelInfo(totalXp);

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <View style={styles.compactLevel}>
                    <Text style={styles.compactLevelNumber}>{levelInfo.level}</Text>
                </View>
                <View style={styles.compactProgress}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${levelInfo.percentage}%` },
                            ]}
                        />
                    </View>
                    <Text style={styles.compactProgressText}>
                        {levelInfo.currentXp}/{levelInfo.maxXp}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.levelHeader}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelNumber}>{levelInfo.level}</Text>
                </View>
                <View style={styles.levelInfo}>
                    <Text style={styles.levelTitle}>Nível {levelInfo.level}</Text>
                    <Text style={styles.totalXpText}>Total: {levelInfo.totalXp} XP</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${levelInfo.percentage}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {levelInfo.currentXp} / {levelInfo.maxXp} XP
                </Text>
            </View>

            <View style={styles.xpInfoContainer}>
                <View style={styles.xpInfoItem}>
                    <MaterialCommunityIcons
                        name="star"
                        size={16}
                        color="#FBBF24"
                    />
                    <Text style={styles.xpInfoLabel}>Para próximo nível</Text>
                    <Text style={styles.xpInfoValue}>{levelInfo.xpForNext} XP</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.lg,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    levelBadge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: theme.colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: `${theme.colors.primary[600]}40`,
    },
    levelNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    levelInfo: {
        flex: 1,
    },
    levelTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    totalXpText: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressContainer: {
        gap: theme.spacing.sm,
    },
    progressBar: {
        height: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary[600],
        borderRadius: 6,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    xpInfoContainer: {
        gap: theme.spacing.sm,
    },
    xpInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: '#FFFBEB',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    xpInfoLabel: {
        fontSize: 12,
        color: '#92400E',
        fontWeight: '500',
        flex: 1,
    },
    xpInfoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F59E0B',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    compactLevel: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary[600],
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactLevelNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    compactProgress: {
        flex: 1,
        gap: 4,
    },
    compactProgressText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default LevelProgressBar;
