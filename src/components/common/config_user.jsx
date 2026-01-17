import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Switch, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import { updateUser, deleteUser } from '../../data/user';
import { auth } from '../../services/firebase/firebase_config';
import { deleteUser as deleteAuthUser } from 'firebase/auth';

const ConfigUserModal = ({ visible, onClose, user, refetch }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.receberNotificacoes ?? true);
    const [gameXPEnabled, setGameXPEnabled] = useState(user?.gameXPAtivado ?? false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [nickname, setNickname] = useState(user?.apelido || '');
    const [age, setAge] = useState(user?.idade?.toString() || '');
    const [initialEvent, setInitialEvent] = useState(user?.eventoFixoInicial || '');

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateUser(user?.uid, {
                notificacao: notificationsEnabled,
                gameXPAtivado: gameXPEnabled,
                apelido: nickname || null,
                idade: age ? Number(age) : null,
                eventoFixoInicial: initialEvent || null,
            });
            
            // Refetch dados do usuário para atualizar em tempo real
            if (refetch) {
                await refetch();
            }
            
            Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
            onClose();
        } catch (err) {
            console.log('Error saving settings:', err);
            Alert.alert('Erro', 'Falha ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Alterar Senha',
            'Funcionalidade de alteração de senha em desenvolvimento',
            [{ text: 'OK' }]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Deletar Conta',
            'Tem certeza que deseja deletar sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.',
            [
                { text: 'Cancelar', onPress: () => {} },
                {
                    text: 'Deletar',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const currentUser = auth.currentUser;
                            if (currentUser) {
                                // Deleta dados do Firestore
                                await deleteUser(currentUser.uid);
                                // Deleta conta de autenticação
                                await deleteAuthUser(currentUser);
                                Alert.alert('Sucesso', 'Conta deletada com sucesso');
                                onClose();
                            }
                        } catch (err) {
                            console.log('Error deleting account:', err);
                            Alert.alert('Erro', 'Falha ao deletar conta: ' + err.message);
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Configurações da Conta</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Informações do Usuário */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Nome</Text>
                                <View style={styles.disabledInput}>
                                    <Text style={styles.disabledInputText}>
                                        {user?.nome || 'Sem nome'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.disabledInput}>
                                    <Text style={styles.disabledInputText}>
                                        {user?.email || 'Sem email'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Apelido (opcional)</Text>
                                <TextInput
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder={user?.apelido || "Para exibição em ranking"}
                                    placeholderTextColor={
                                        theme.colors.text.muted || '#94A3B8'
                                    }
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Idade (opcional)</Text>
                                <TextInput
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Ex.: 25"
                                    placeholderTextColor={
                                        theme.colors.text.muted || '#94A3B8'
                                    }
                                    keyboardType="number-pad"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>
                                    Evento Fixo Inicial (opcional)
                                </Text>
                                <TextInput
                                    value={initialEvent}
                                    onChangeText={setInitialEvent}
                                    placeholder="Ex.: trabalho"
                                    placeholderTextColor={
                                        theme.colors.text.muted || '#94A3B8'
                                    }
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        {/* Preferências */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Preferências</Text>

                            <View style={styles.preferencesItem}>
                                <View style={styles.preferencesLeft}>
                                    <MaterialCommunityIcons
                                        name="bell"
                                        size={24}
                                        color={theme.colors.primary[600]}
                                    />
                                    <View style={styles.preferencesText}>
                                        <Text style={styles.preferencesLabel}>
                                            Notificações
                                        </Text>
                                        <Text style={styles.preferencesDesc}>
                                            Receber alertas e lembretes
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{
                                        false: '#D1D5DB',
                                        true: theme.colors.primary[300],
                                    }}
                                    thumbColor={
                                        notificationsEnabled
                                            ? theme.colors.primary[600]
                                            : '#9CA3AF'
                                    }
                                />
                            </View>

                            <View style={styles.preferencesItem}>
                                <View style={styles.preferencesLeft}>
                                    <MaterialCommunityIcons
                                        name="gamepad-variant"
                                        size={24}
                                        color={theme.colors.primary[600]}
                                    />
                                    <View style={styles.preferencesText}>
                                        <Text style={styles.preferencesLabel}>
                                            Game XP
                                        </Text>
                                        <Text style={styles.preferencesDesc}>
                                            Sistema de pontos e experiência
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={gameXPEnabled}
                                    onValueChange={setGameXPEnabled}
                                    trackColor={{
                                        false: '#D1D5DB',
                                        true: theme.colors.primary[300],
                                    }}
                                    thumbColor={
                                        gameXPEnabled
                                            ? theme.colors.primary[600]
                                            : '#9CA3AF'
                                    }
                                />
                            </View>
                        </View>

                        {/* Ações */}
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleSaveSettings}
                                disabled={isSaving}
                            >
                                <MaterialCommunityIcons
                                    name="content-save"
                                    size={20}
                                    color={theme.colors.text.inverse}
                                />
                                <Text style={styles.primaryButtonText}>
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleChangePassword}
                            >
                                <MaterialCommunityIcons
                                    name="lock-reset"
                                    size={20}
                                    color={theme.colors.primary[600]}
                                />
                                <Text style={styles.secondaryButtonText}>
                                    Alterar Senha
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dangerButton}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                <MaterialCommunityIcons
                                    name="trash-can"
                                    size={20}
                                    color="#EF4444"
                                />
                                <Text style={styles.dangerButtonText}>
                                    {isDeleting ? 'Deletando...' : 'Deletar Conta'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        ...theme.shadows.xl,
    },
    modalContent: {
        paddingBottom: theme.spacing.lg,
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
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.md,
    },
    inputWrap: {
        marginBottom: theme.spacing.md,
    },
    inputLabel: {
        color: '#6B7280',
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: '#F3F4F6',
        color: '#1F2937',
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    disabledInputText: {
        color: '#6B7280',
        fontSize: 16,
    },
    preferencesItem: {
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
    preferencesLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    preferencesText: {
        flex: 1,
    },
    preferencesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    preferencesDesc: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    primaryButton: {
        backgroundColor: theme.colors.primary[600],
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    primaryButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    secondaryButton: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary[300],
    },
    secondaryButtonText: {
        color: theme.colors.primary[600],
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    dangerButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: theme.spacing.sm,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    dangerButtonText: {
        color: '#EF4444',
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});

export default ConfigUserModal;
