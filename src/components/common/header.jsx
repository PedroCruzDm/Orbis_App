import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Switch, Alert, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import { createUser, loginUser } from '../../data/user';
import { auth } from '../../services/firebase/firebase_config';
import {signOut } from 'firebase/auth';
import { useUserData } from '../../hooks/use_user_data';
import ProfileModal from './profile_modal';

const Header = () => {
    const { user, loading } = useUserData();
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [showToolsModal, setShowToolsModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState('');
    const [initialEvent, setInitialEvent] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [gameXPEnabled, setGameXPEnabled] = useState(false);
    const [tools, setTools] = useState({
        modoFoco: true,
        modoSono: true,
        agenda: true,
    });

    const openUser = () => {
        if (user) {
            setShowAccountMenu(true);
        } else {
            setShowUserModal(true);
        }
    };
    const closeUser = () => setShowUserModal(false);
    const closeAccountMenu = () => setShowAccountMenu(false);
    const toggleMode = () => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'));

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setShowAccountMenu(false);
            Alert.alert('Sucesso', 'Você saiu da sua conta!');
        } catch (err) {
            Alert.alert('Erro', 'Falha ao sair da conta.');
        }
    };

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Informe email e senha.');
            return;
        }

        try {
            if (authMode === 'signup') {
                if (!name) {
                    Alert.alert('Erro', 'Informe seu nome.');
                    return;
                }

                await createUser({
                  email,
                  password,
                  nome: name,
                  apelido: nickname || null,
                  idade: age,
                  eventoFixoInicial: initialEvent,
                  notificacao: notificationsEnabled,
                  gameXPAtivado: gameXPEnabled,
                  ferramentas: Object.entries(tools)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => {
                      if (key === 'modoFoco') return 'foco';
                      if (key === 'modoSono') return 'sono';
                      return key;
                    }),
                });

                Alert.alert('Sucesso', 'Conta criada com sucesso!');
                closeUser();
            } else {
                await loginUser(email, password);
                Alert.alert('Sucesso', 'Login realizado!');
                closeUser();
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            console.log('Auth error:', err);
            Alert.alert('Erro', err?.message ?? 'Falha na operação.');
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.nav}>
                <Text style={styles.brand}>Orbis</Text>
                <View style={styles.navRight}>
                    {user && (
                        <View style={styles.userInfo}>
                            <Text style={styles.userNameBadge}>{user.nome?.split(' ')[0] || 'Usuário'}</Text>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                        </View>
                    )}
                    <TouchableOpacity onPress={openUser} style={styles.userButton}>
                        <MaterialCommunityIcons name="account-circle" size={32} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal de Login/Signup */}
            <Modal
                visible={showUserModal}
                transparent
                animationType="fade"
                onRequestClose={closeUser}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeUser}>
                    <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalCard}>
                        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{authMode === 'login' ? 'Entrar' : 'Criar Conta'}</Text>

                            {authMode === 'signup' && (
                                <>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Nome</Text>
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="Seu nome"
                                            placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Apelido (opcional)</Text>
                                        <TextInput
                                            value={nickname}
                                            onChangeText={setNickname}
                                            placeholder="Exibição em ranking"
                                            placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                            style={styles.input}
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="voce@email.com"
                                    placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Senha</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                    secureTextEntry
                                    style={styles.input}
                                />
                            </View>

                            {authMode === 'signup' && (
                                <>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Idade (opcional)</Text>
                                        <TextInput
                                            value={age}
                                            onChangeText={setAge}
                                            placeholder="Ex.: 25"
                                            placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                            keyboardType="number-pad"
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Evento Fixo Inicial (opcional)</Text>
                                        <TextInput
                                            value={initialEvent}
                                            onChangeText={setInitialEvent}
                                            placeholder="Ex.: trabalho"
                                            placeholderTextColor={theme.colors.text.muted || '#94A3B8'}
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={{ marginTop: theme.spacing.xs }}>
                                        <Text style={styles.inputLabel}>Receber Notificações</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Text style={{ color: '#1F2937' }}>Permitir alertas</Text>
                                            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
                                        </View>
                                    </View>

                                    <View style={{ marginTop: theme.spacing.xs }}>
                                        <Text style={styles.inputLabel}>Uso de Ferramentas</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Text style={{ color: '#1F2937' }}>Ativar Game XP</Text>
                                            <Switch value={gameXPEnabled} onValueChange={setGameXPEnabled} />
                                        </View>
                                    </View>

                                    <View style={{ marginTop: theme.spacing.xs }}>
                                        <Text style={styles.inputLabel}>Selecionar ferramentas</Text>
                                        <View style={styles.toolsGrid}>
                                            {[
                                                { key: 'modoFoco', label: 'Modo Foco' },
                                                { key: 'modoSono', label: 'Modo Sono' },
                                                { key: 'agenda', label: 'Agenda' },
                                            ].map(({ key, label }) => (
                                                <TouchableOpacity
                                                    key={key}
                                                    style={[styles.toolChip, tools[key] && styles.toolChipActive]}
                                                    onPress={() => setTools((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                    accessibilityRole="checkbox"
                                                    accessibilityState={{ checked: tools[key] }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <MaterialCommunityIcons
                                                            name={tools[key] ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                            size={20}
                                                            color={tools[key] ? theme.colors.primary[600] : '#6B7280'}
                                                        />
                                                        <Text style={{ color: '#1F2937' }}>{label}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}

                            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                                <Text style={styles.primaryButtonText}>{authMode === 'login' ? 'Entrar' : 'Cadastrar'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleMode} style={styles.switchWrap}>
                                <Text style={styles.switchText}>
                                    {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Menu de Conta (quando logado) */}
            <Modal
                visible={showAccountMenu}
                transparent
                animationType="fade"
                onRequestClose={closeAccountMenu}
            >
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeAccountMenu}>
                    <View style={styles.accountMenu}>
                        <TouchableOpacity 
                            style={styles.menuHeader}
                            onPress={() => {
                                setShowProfileModal(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="account" size={40} color={theme.colors.primary[600]} />
                            <View style={styles.menuHeaderText}>
                                <Text style={styles.menuUserName}>{user?.nome || 'Usuário'}</Text>
                                <Text style={styles.menuUserEmail}>{user?.email || ''}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setShowAccountMenu(false);
                            // Aqui você pode adicionar navegação para configurações
                            Alert.alert('Configurações', 'Página de configurações em breve');
                        }}>
                            <MaterialCommunityIcons name="cog" size={20} color={theme.colors.primary[600]} />
                            <Text style={styles.menuItemText}>Configurações</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setShowAccountMenu(false);
                            setShowToolsModal(true);
                        }}>
                            <MaterialCommunityIcons name="tools" size={20} color={theme.colors.primary[600]} />
                            <Text style={styles.menuItemText}>Ferramentas</Text>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => {
                            Alert.alert('Sair da Conta', 'Deseja realmente sair?', [
                                { text: 'Cancelar', onPress: () => {} },
                                { text: 'Sair', onPress: handleLogout, style: 'destructive' },
                            ]);
                        }}>
                            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sair da Conta</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de Ferramentas */}
            <Modal
                visible={showToolsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowToolsModal(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowToolsModal(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Configurar Ferramentas</Text>
                            <TouchableOpacity onPress={() => setShowToolsModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.toolsSection}>
                            <Text style={styles.toolsSectionTitle}>Selecione as ferramentas ativas</Text>
                            {[
                                { key: 'modoFoco', label: 'Modo Foco', icon: 'target' },
                                { key: 'modoSono', label: 'Modo Sono', icon: 'moon-waning-crescent' },
                                { key: 'agenda', label: 'Agenda', icon: 'calendar' },
                            ].map(({ key, label, icon }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.toolsItem}
                                    onPress={() => setTools((prev) => ({ ...prev, [key]: !prev[key] }))}
                                >
                                    <View style={styles.toolsItemLeft}>
                                        <MaterialCommunityIcons 
                                            name={icon} 
                                            size={24} 
                                            color={tools[key] ? theme.colors.primary[600] : '#9CA3AF'} 
                                        />
                                        <Text style={styles.toolsItemText}>{label}</Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={tools[key] ? 'toggle-switch' : 'toggle-switch-off'}
                                        size={32}
                                        color={tools[key] ? theme.colors.primary[600] : '#D1D5DB'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowToolsModal(false)}>
                            <Text style={styles.primaryButtonText}>Salvar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Modal de Perfil */}
            <ProfileModal 
                visible={showProfileModal} 
                onClose={() => setShowProfileModal(false)} 
                user={user}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        width: '100%',
        top: 0,
        left: 0,
        zIndex: 1000,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.primary[600],
        ...theme.shadows.sm,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    brand: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        letterSpacing: 0.2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    userNameBadge: {
        color: theme.colors.text.inverse,
        fontSize: 12,
        fontWeight: '600',
    },
    userButton: {
        padding: theme.spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    accountMenu: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: 32,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#F9FAFB',
    },
    menuHeaderText: {
        flex: 1,
    },
    menuUserName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    menuUserEmail: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: theme.spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary[600],
        flex: 1,
    },
    menuItemDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    menuItemTextDanger: {
        color: '#EF4444',
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    modalContent: {
        paddingBottom: theme.spacing.md,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#1F2937',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        flex: 1,
    },
    inputWrap: {
        marginBottom: theme.spacing.sm,
    },
    inputLabel: {
        color: '#6B7280',
        fontSize: theme.typography.fontSize.xs,
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
    primaryButton: {
        backgroundColor: theme.colors.primary[600],
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    primaryButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    switchWrap: {
        marginTop: theme.spacing.sm,
        alignItems: 'center',
    },
    switchText: {
        color: theme.colors.primary[600],
        fontSize: theme.typography.fontSize.xs,
        textDecorationLine: 'underline',
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    toolChip: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: theme.borderRadius.md,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
    },
    toolChipActive: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50],
    },
    toolsSection: {
        marginBottom: theme.spacing.lg,
    },
    toolsSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: theme.spacing.md,
    },
    toolsItem: {
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
    toolsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    toolsItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
});

export default Header;