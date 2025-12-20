import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, TextInput, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import { auth, db } from '../../hooks/Firebase/config';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const Header = () => {
    const [showUserModal, setShowUserModal] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // new signup fields
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState('');
    const [initialEvent, setInitialEvent] = useState(''); // ex.: trabalho
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [gameXPEnabled, setGameXPEnabled] = useState(false);

    const openUser = () => setShowUserModal(true);
    const closeUser = () => setShowUserModal(false);
    const toggleMode = () => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'));

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
                const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
                if (name) {
                    await updateProfile(cred.user, { displayName: name });
                }

                const uid = cred.user.uid;
                await setDoc(doc(db, 'Usuarios', uid), {
                    nome: name,
                    apelido: nickname || null,
                    email: email.trim(),
                    idade: age ? Number(age) : null,
                    eventoFixoInicial: initialEvent || null,
                    receberNotificacoes: notificationsEnabled,
                    gameXPAtivado: gameXPEnabled,
                });

                Alert.alert('Sucesso', 'Conta criada com sucesso!');
                closeUser();
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
                Alert.alert('Sucesso', 'Login realizado!');
                closeUser();
            }
        } catch (err) {
            console.log('Auth error:', err);
            Alert.alert('Erro', err?.message ?? 'Falha na operação.');
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.nav} accessible accessibilityRole="header">
                <Text style={styles.brand}>Orbis</Text>
                <TouchableOpacity onPress={openUser} style={styles.userButton}>
                    <MaterialCommunityIcons name="account-circle" size={32} color={theme.colors.text.inverse} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={showUserModal}
                transparent
                animationType="fade"
                onRequestClose={closeUser}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeUser}>
                    <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalCard}>
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
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    brand: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        letterSpacing: 0.2,
    },
    right: {
        minWidth: 48,
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
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadows.xl,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#1F2937',
        marginBottom: theme.spacing.md,
        textAlign: 'center',
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
        color: theme.colors.primary[200],
        fontSize: theme.typography.fontSize.xs,
        textDecorationLine: 'underline',
    },
});

export default Header;