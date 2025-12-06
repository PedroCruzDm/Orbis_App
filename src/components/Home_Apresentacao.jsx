import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Appearance,
    ScrollView,
    findNodeHandle,
    UIManager,
    useWindowDimensions,
} from 'react-native';

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
    const bg = dark ? '#0F172A' : '#FFFFFF';
    const muted = dark ? '#94A3B8' : '#6B7280';
    const primary = '#2563EB';

    const isSmall = width < 600;

    return StyleSheet.create({
        container: {
            padding: 20,
            backgroundColor: bg,
        },
        headerSpacer: { height: 8 },
        heroSection: {
            flexDirection: isSmall ? 'column' : 'row',
            flexWrap: 'wrap',
            marginBottom: 20,
        },
        heroContent: {
            flex: isSmall ? undefined : 1,
            width: isSmall ? '100%' : undefined,
            minWidth: isSmall ? undefined : 260,
            paddingRight: isSmall ? 0 : 12,
            justifyContent: 'center',
            marginBottom: isSmall ? 12 : 0,
        },
        heroTitle: { fontSize: 28, fontWeight: '800', color: '#1E3A8A', marginBottom: 8 },
        heroDescription: { color: muted, fontSize: 15, lineHeight: 20, marginBottom: 12 },
        heroButtons: { flexDirection: 'row' },
        btnPrimary: { backgroundColor: primary, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginRight: 8 },
        btnPrimaryText: { color: '#fff', fontWeight: '700' },
        btnSecondary: { borderWidth: 1, borderColor: primary, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
        btnSecondaryText: { color: primary, fontWeight: '700' },
        heroVisual: { width: isSmall ? '100%' : 220, alignItems: 'center', justifyContent: 'center' },
        floatingRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 6 },
        floatingItem: { alignItems: 'center', width: isSmall ? '48%' : '48%' },
        floatIcon: { fontSize: 22 },
        floatText: { color: muted, fontSize: 12, marginTop: 4 },
        orbisVisual: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative', marginVertical: 8 },
        orbitRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: '#D1D5DB', position: 'absolute' },
        centerPlanet: { fontSize: 36 },
        satellite: { position: 'absolute', right: 8, top: 8 },
        featuresSection: { marginTop: 12 },
        featureCard: { flexDirection: isSmall ? 'column' : 'row', marginBottom: 16, backgroundColor: dark ? '#071127' : '#F8FAFF', borderRadius: 12, padding: 12 },
        featureCardReverse: { flexDirection: isSmall ? 'column' : 'row-reverse' },
        featureContent: { flex: 1, padding: 8 },
        featureTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
        featureText: { color: muted },
        featureVisualSmall: { width: isSmall ? '100%' : 140, alignItems: 'center', justifyContent: 'center', padding: 8, marginTop: isSmall ? 8 : 0 },
        calendarPreview: { backgroundColor: '#fff', padding: 8, borderRadius: 8, width: '100%' },
        calendarHeader: { fontWeight: '700', marginBottom: 8 },
        calendarEvents: {},
        event: { paddingVertical: 6 },
        eventWork: {},
        eventFocus: {},
        eventFlex: {},
        sleepPreview: { alignItems: 'center' },
        sleepCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
        sleepQuality: { color: '#fff', fontWeight: '800', fontSize: 18 },
        sleepLabel: { color: '#fff', fontSize: 12 },
        sleepCycles: { flexDirection: 'row' },
        focusTimer: { alignItems: 'center' },
        timerText: { fontSize: 20, fontWeight: '700' },
        dashboardPreview: { alignItems: 'center' },
        dashboardHeader: { fontWeight: '700' },
        philosophySection: { marginTop: 20, padding: 12, backgroundColor: dark ? '#071127' : '#FFFFFF', borderRadius: 12 },
        philosophyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
        philosophyText: { color: muted, marginBottom: 12 },
        ctaRow: { flexDirection: isSmall ? 'column' : 'row', justifyContent: 'flex-start' },
    });
}
