import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, findNodeHandle, UIManager, useWindowDimensions } from 'react-native';
import theme from '../../theme';
import './styles/home_apresentacao.css';

/* Design tokens (ajuste conforme seu tema) */
const TOKENS = {
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    font: { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '3xl': 30 },
    weight: { bold: '700', extrabold: '800' },
    lineHeight: { relaxed: 1.625 },
    primary: { '50': '#eff6ff', '200': '#bfdbfe', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '800': '#1e40af' },
    semantic: {
        primary: '#3b82f6',
        muted: '#6b7280',
        bg: '#ffffff',
        card: '#f9fafb',
        textPrimary: '#111827',
        textInverse: '#ffffff',
        borderDefault: '#e5e7eb',
        bgPrimary: '#f3f4f6'
    },
    radius: { md: 8, lg: 12, xl: 16, full: 9999 },
    shadow: {
        sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
        md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }
    }
};

export default function Home_Apresentacao({ onCreateAccount, onLogin }) {
    // Forçar tema claro conforme solicitado
    const dark = false;
    const { width } = useWindowDimensions();
    const styles = createStyles(dark, width);
    const scrollRef = useRef(null);
    const philosophyRef = useRef(null);

    function scrollToPhilosophy() {
        if (!philosophyRef.current || !scrollRef.current) return;
        const handle = findNodeHandle(philosophyRef.current);
        if (!handle) return;
        UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
            scrollRef.current.scrollTo({ y: pageY - 40, animated: true });
        });
    }

    const onStart = () => {
        if (onCreateAccount) onCreateAccount();
    };

    const onEntrar = () => {
        if (onLogin) onLogin();
    };

    return (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
            <View style={styles.headerSpacer} />

            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>IMAGINE UM LUGAR...</Text>
                    <Text style={styles.heroDescription}>
                        ...onde você pode criar rotinas flexíveis que realmente funcionam. Onde seu bem-estar vem primeiro, e onde o progresso constante supera a perfeição impossível. Bem-vindo ao <Text style={{fontWeight:'700'}}>Orbis</Text>.
                    </Text>

                    <View style={styles.heroButtons}>
                        <TouchableOpacity style={styles.btnPrimary} onPress={onStart} activeOpacity={0.85}>
                            <Text style={styles.btnPrimaryText}>🚀 Começar Jornada</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnSecondary} onPress={scrollToPhilosophy} activeOpacity={0.85}>
                            <Text style={styles.btnSecondaryText}>Saiba mais sobre o Orbis</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.heroVisual}>
                    <View style={styles.floatingRow}>
                        <View style={styles.floatingItem}><Text style={styles.floatIcon}>🌙</Text><Text style={styles.floatText}>Sono Inteligente</Text></View>
                        <View style={styles.floatingItem}><Text style={styles.floatIcon}>🎯</Text><Text style={styles.floatText}>Foco Total</Text></View>
                    </View>

                    <View style={styles.orbisVisual}>
                        <View style={styles.orbitRing} />
                        <Text style={styles.centerPlanet}>🌌</Text>
                        <Text style={styles.satellite}>🛰️</Text>
                    </View>

                    <View style={styles.floatingRow}>
                        <View style={styles.floatingItem}><Text style={styles.floatIcon}>⚡</Text><Text style={styles.floatText}>Adaptável</Text></View>
                        <View style={styles.floatingItem}><Text style={styles.floatIcon}>📈</Text><Text style={styles.floatText}>Progresso Real</Text></View>
                    </View>
                </View>
            </View>

            {/* Features Section */}
            <View style={styles.featuresSection}>
                <View style={styles.featureCard}>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Crie rotinas que se adaptam à sua vida</Text>
                        <Text style={styles.featureText}>
                            Orbis entende que a vida real tem imprevistos. Nossa agenda inteligente e blocos de foco flexíveis se ajustam ao seu dia, não o contrário. Mantenha o momentum sem a pressão de um planejamento rígido.
                        </Text>
                    </View>
                    <View style={styles.featureVisualSmall}>
                        <View style={styles.calendarPreview}>
                            <Text style={styles.calendarHeader}>📅 Sua Agenda</Text>
                            <View style={styles.calendarEvents}>
                                <Text style={[styles.event, styles.eventWork]}>💼 Reunião - 14h</Text>
                                <Text style={[styles.event, styles.eventFocus]}>🎯 Foco - 15h30</Text>
                                <Text style={[styles.event, styles.eventFlex]}>⚡ Tempo Livre - 17h</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.featureCard, styles.featureCardReverse]}>
                    <View style={styles.featureVisualSmall}>
                        <View style={styles.sleepPreview}>
                            <View style={styles.sleepCircle}><Text style={styles.sleepQuality}>82%</Text><Text style={styles.sleepLabel}>Qualidade</Text></View>
                            <View style={styles.sleepCycles}><Text>🌙 Ciclo 1</Text><Text>🌙 Ciclo 2</Text><Text style={{fontWeight:'700'}}>🌙 Ciclo 3</Text></View>
                        </View>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Desperte revigorado com gestão inteligente do sono</Text>
                        <Text style={styles.featureText}>
                            Monitore seus ciclos naturais de 90 minutos e desperte no momento ideal. Nosso alarme inteligente garante que você acorde descansado, não no meio de um sono profundo.
                        </Text>
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Foco profundo quando você mais precisa</Text>
                        <Text style={styles.featureText}>
                            Sessões de foco baseadas na técnica Pomodoro, mas adaptadas ao seu ritmo. Elimine distrações, maximize sua concentração e veja sua produtividade crescer de forma sustentável.
                        </Text>
                    </View>
                    <View style={styles.featureVisualSmall}>
                        <View style={styles.focusTimer}><Text style={styles.timerText}>25:00</Text><Text>Foco</Text></View>
                    </View>
                </View>

                <View style={[styles.featureCard, styles.featureCardReverse]}>
                    <View style={styles.featureVisualSmall}>
                        <View style={styles.dashboardPreview}>
                            <Text style={styles.dashboardHeader}>📊 Resumo Semanal</Text>
                        </View>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Acompanhe seu progresso com insights personalizados</Text>
                        <Text style={styles.featureText}>
                            Visualize sua evolução através de relatórios semanais inteligentes. Entenda seus padrões, identifique oportunidades de melhoria e celebre suas conquistas.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Philosophy Section */}
            <View style={styles.philosophySection} ref={philosophyRef}>
                <Text style={styles.philosophyTitle}>Nossa Filosofia</Text>
                <Text style={styles.philosophyText}>
                    "Orbis se ajusta a você, não o contrário. Priorizamos o progresso constante sobre a perfeição inatingível."
                </Text>
                <View style={styles.ctaRow}>
                    <TouchableOpacity style={styles.btnPrimary} onPress={onStart} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Começar Agora</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} activeOpacity={0.85}><Text style={styles.btnSecondaryText}>Voltar ao Topo</Text></TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

function createStyles(dark, width) {
    const bg = dark ? theme.colors.background.dark : theme.colors.background.light;
    const muted = theme.colors.text.secondary;
    const primary = theme.colors.primary[500];

    const isSmall = width < 600;

    return StyleSheet.create({
        container: {
            padding: theme.spacing.lg,
            backgroundColor: bg,
        },
        headerSpacer: { height: theme.spacing.sm },
        heroSection: {
            flexDirection: isSmall ? 'column' : 'row',
            flexWrap: 'wrap',
            marginBottom: theme.spacing.lg,
        },
        heroContent: {
            flex: isSmall ? undefined : 1,
            width: isSmall ? '100%' : undefined,
            minWidth: isSmall ? undefined : 260,
            paddingRight: isSmall ? 0 : theme.spacing.md,
            justifyContent: 'center',
            marginBottom: isSmall ? theme.spacing.md : 0,
        },
        heroTitle: { 
            fontSize: theme.typography.fontSize['3xl'], 
            fontWeight: theme.typography.fontWeight.extrabold, 
            color: theme.colors.primary[800], 
            marginBottom: theme.spacing.sm 
        },
        heroDescription: { 
            color: muted, 
            fontSize: theme.typography.fontSize.base, 
            lineHeight: theme.typography.lineHeight.relaxed, 
            marginBottom: theme.spacing.md 
        },
        heroButtons: { flexDirection: 'row' },
        btnPrimary: { 
            backgroundColor: primary, 
            paddingVertical: theme.spacing.md, 
            paddingHorizontal: theme.spacing.lg, 
            borderRadius: theme.borderRadius.lg, 
            marginRight: theme.spacing.sm,
            ...theme.shadows.md,
        },
        btnPrimaryText: { 
            color: theme.colors.text.inverse, 
            fontWeight: theme.typography.fontWeight.bold 
        },
        btnSecondary: { 
            borderWidth: 1, 
            borderColor: primary, 
            paddingVertical: theme.spacing.md, 
            paddingHorizontal: theme.spacing.lg, 
            borderRadius: theme.borderRadius.lg 
        },
        btnSecondaryText: { 
            color: primary, 
            fontWeight: theme.typography.fontWeight.bold 
        },
        heroVisual: { width: isSmall ? '100%' : 220, alignItems: 'center', justifyContent: 'center' },
        floatingRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: theme.spacing.xs },
        floatingItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
        floatIcon: { fontSize: 22 },
        floatText: { color: muted, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs },
        orbisVisual: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginVertical: theme.spacing.sm },
        orbitRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: theme.colors.border.light, position: 'absolute' },
        centerPlanet: { fontSize: 36 },
        satellite: { position: 'absolute', right: 8, top: 8 },
        featuresSection: { marginTop: theme.spacing.md },
        featureCard: { 
            flexDirection: isSmall ? 'column' : 'row', 
            marginBottom: theme.spacing.lg, 
            backgroundColor: theme.colors.card.light, 
            borderRadius: theme.borderRadius.xl, 
            padding: theme.spacing.lg,
            ...theme.shadows.sm,
        },
        featureCardReverse: { flexDirection: isSmall ? 'column' : 'row-reverse' },
        featureContent: { flex: 1, padding: theme.spacing.sm },
        featureTitle: { 
            fontSize: theme.typography.fontSize.lg, 
            fontWeight: theme.typography.fontWeight.bold, 
            color: theme.colors.text.primary, 
            marginBottom: theme.spacing.xs 
        },
        featureText: { color: muted, fontSize: theme.typography.fontSize.sm },
        featureVisualSmall: { 
            width: isSmall ? '100%' : 140, 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: theme.spacing.sm, 
            marginTop: isSmall ? theme.spacing.sm : 0 
        },
        calendarPreview: { backgroundColor: theme.colors.background.subtle, padding: theme.spacing.sm, borderRadius: theme.borderRadius.md, width: '100%' },
        calendarHeader: { fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.sm },
        calendarEvents: {},
        event: { paddingVertical: theme.spacing.xs },
        eventWork: {},
        eventFocus: {},
        eventFlex: {},
        sleepPreview: { flexDirection: 'row', alignItems: 'center' },
        sleepCircle: { 
            width: 80, 
            height: 80, 
            borderRadius: theme.borderRadius.full, 
            backgroundColor: primary, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: theme.spacing.sm 
        },
        sleepQuality: { 
            color: theme.colors.text.inverse, 
            fontWeight: theme.typography.fontWeight.extrabold, 
            fontSize: theme.typography.fontSize.lg 
        },
        sleepLabel: { 
            color: theme.colors.text.inverse, 
            fontSize: theme.typography.fontSize.xs 
        },
        sleepCycles: { flexDirection: 'row' },
        focusTimer: { flexDirection: 'row', alignItems: 'center' },
        timerText: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold },
        dashboardPreview: { alignItems: 'center' },
        dashboardHeader: { fontWeight: theme.typography.fontWeight.bold },
        philosophySection: { 
            marginTop: theme.spacing.xl, 
            padding: theme.spacing.lg, 
            backgroundColor: theme.colors.card.light, 
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.md,
        },
        philosophyTitle: { 
            fontSize: theme.typography.fontSize.xl, 
            fontWeight: theme.typography.fontWeight.extrabold, 
            marginBottom: theme.spacing.sm,
            color: theme.colors.text.primary,
        },
        philosophyText: { 
            color: muted, 
            marginBottom: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
        },
        ctaRow: { flexDirection: isSmall ? 'column' : 'row', justifyContent: 'flex-start' },
    });
}