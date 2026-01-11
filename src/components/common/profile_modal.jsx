import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import LevelProgressBar from './level_progress_bar';
import { getLevelInfo } from '../../utils/xp_system';

const ProfileModal = ({ visible, onClose, user }) => {
    const focusHistoryXp = () => {
        const list = user?.ferramentas?.foco?.tarefas?.listaHistorico;
        if (!Array.isArray(list)) return 0;
        return list.reduce((acc, item) => {
            const success = item?.statusTarefa === 'concluida' || item?.status === 'Sucesso';
            if (!success) return acc;
            const raw = Number(item?.xpGerado ?? item?.xp ?? 0);
            const xp = Number.isFinite(raw) ? raw : 0;
            return xp > 0 ? acc + xp : acc;
        }, 0);
    };

    const getToolXp = (key) => {
        const ferramentas = user?.ferramentas || {};
        if (key === 'foco') {
            const stored = ferramentas.foco?.nivel?.xpTotal;
            if (typeof stored === 'number' && Number.isFinite(stored)) return Math.max(stored, 0);
            return Math.max(focusHistoryXp(), 0);
        }
        if (key === 'sono') {
            const stored = ferramentas.sono?.nivel?.xpTotal;
            return typeof stored === 'number' && Number.isFinite(stored) ? Math.max(stored, 0) : 0;
        }
        if (key === 'agenda') {
            const stored = ferramentas.agenda?.nivel?.xpTotal;
            return typeof stored === 'number' && Number.isFinite(stored) ? Math.max(stored, 0) : 0;
        }
        return 0;
    };

    const toolsData = [
        { key: 'foco', label: 'Modo Foco', icon: 'target' },
        { key: 'sono', label: 'Modo Sono', icon: 'moon-waning-crescent' },
        { key: 'agenda', label: 'Agenda', icon: 'calendar' },
    ].map((tool) => {
        const xp = getToolXp(tool.key);
        const levelInfo = getLevelInfo(xp);
        return { ...tool, xp, level: levelInfo.level };
    });

    const totalXp = toolsData.reduce((acc, tool) => acc + (tool.xp || 0), 0);

    const renderLevelStars = (level) => {
        return (
            <View style={{ flexDirection: 'row', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                        key={star}
                        name={star <= level ? 'star' : 'star-outline'}
                        size={16}
                        color={star <= level ? '#FBBF24' : '#D1D5DB'}
                    />
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.modalCard}>
                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                    >
                        {/* Header com botão fechar */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Meu Perfil</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Seção de Informações do Usuário */}
                        <View style={styles.profileSection}>
                            <View style={styles.profileHeader}>
                                <View style={styles.profileAvatar}>
                                    <MaterialCommunityIcons
                                        name="account"
                                        size={56}
                                        color={theme.colors.primary[600]}
                                    />
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.profileName}>
                                        {user?.nome || 'Usuário'}
                                    </Text>
                                    <Text style={styles.profileEmail}>
                                        {user?.email || ''}
                                    </Text>
                                </View>
                            </View>

                            {/* Dados adicionais */}
                            <View style={styles.detailsGrid}>
                                {user?.apelido && (
                                    <View style={styles.detailCard}>
                                        <Text style={styles.detailLabel}>Apelido</Text>
                                        <Text style={styles.detailValue}>
                                            {user.apelido}
                                        </Text>
                                    </View>
                                )}

                                {user?.idade && (
                                    <View style={styles.detailCard}>
                                        <Text style={styles.detailLabel}>Idade</Text>
                                        <Text style={styles.detailValue}>
                                            {user.idade} anos
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>
                                        Notificações
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <MaterialCommunityIcons
                                            name={
                                                user?.notificacao
                                                    ? 'bell-check'
                                                    : 'bell-off'
                                            }
                                            size={20}
                                            color={
                                                user?.notificacao
                                                    ? '#10B981'
                                                    : '#EF4444'
                                            }
                                        />
                                        <Text style={styles.detailValue}>
                                            {user?.notificacao
                                                ? 'Ativadas'
                                                : 'Desativadas'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>
                                        Game XP
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <MaterialCommunityIcons
                                            name={
                                                user?.gameXPAtivado
                                                    ? 'gamepad-variant'
                                                    : 'gamepad-variant-off'
                                            }
                                            size={20}
                                            color={
                                                user?.gameXPAtivado
                                                    ? '#10B981'
                                                    : '#EF4444'
                                            }
                                        />
                                        <Text style={styles.detailValue}>
                                            {user?.gameXPAtivado
                                                ? 'Ativo'
                                                : 'Inativo'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Divisor */}
                        <View style={styles.divider} />

                        {/* Seção de Nível e XP */}
                        <View style={styles.levelSection}>
                            <LevelProgressBar totalXp={totalXp} compact={false} />
                        </View>

                        {/* Divisor */}
                        <View style={styles.divider} />
                        <View style={styles.toolsSection}>
                            <Text style={styles.sectionTitle}>
                                Nível das Ferramentas
                            </Text>

                            {toolsData.map((tool) => (
                                <View key={tool.key} style={styles.toolItem}>
                                    <View style={styles.toolLeft}>
                                        <View
                                            style={[
                                                styles.toolIcon,
                                                {
                                                    backgroundColor: `${theme.colors.primary[600]}20`,
                                                },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={tool.icon}
                                                size={24}
                                                color={
                                                    theme.colors.primary[600]
                                                }
                                            />
                                        </View>
                                        <View style={styles.toolInfo}>
                                            <Text style={styles.toolName}>
                                                {tool.label}
                                            </Text>
                                            <Text style={styles.toolLevel}>
                                                Nível {tool.level}
                                            </Text>
                                        </View>
                                    </View>
                                    <View>
                                        {renderLevelStars(tool.level)}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Evento fixo inicial */}
                        {user?.eventoFixoInicial && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.eventSection}>
                                    <Text style={styles.sectionTitle}>
                                        Evento Fixo Inicial
                                    </Text>
                                    <View
                                        style={[
                                            styles.eventCard,
                                            {
                                                borderLeftColor:
                                                    theme.colors.primary[600],
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="calendar-check"
                                            size={20}
                                            color={
                                                theme.colors.primary[600]
                                            }
                                        />
                                        <Text style={styles.eventName}>
                                            {user.eventoFixoInicial}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Botão fechar no rodapé */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        position: 'relative',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.xl,
        overflow: 'hidden',
        flexDirection: 'column',
    },
    scrollArea: {
        maxHeight: '100%',
    },
    modalContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        paddingBottom: theme.spacing.xl + theme.spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#1F2937',
        flex: 1,
    },
    profileSection: {
        marginBottom: theme.spacing.lg,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.primary[600]}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 13,
        color: '#6B7280',
    },
    detailsGrid: {
        gap: theme.spacing.sm,
    },
    detailCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: theme.spacing.lg,
    },
    toolsSection: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: theme.spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toolItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: '#F9FAFB',
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    toolLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    toolIcon: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolInfo: {
        flex: 1,
    },
    toolName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    toolLevel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    eventSection: {
        marginBottom: theme.spacing.lg,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: '#F9FAFB',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
    },
    eventName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    closeButton: {
        backgroundColor: theme.colors.primary[600],
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    closeButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    levelSection: {
        marginBottom: theme.spacing.lg,
    },
});

export default ProfileModal;
