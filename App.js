import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Header from './src/components/common/header.jsx';
import Navbar from './src/components/common/navbar.jsx';
import Dashboard from './src/components/dashboard/Dashboard.jsx';
import Modo_Foco from './src/components/foco/modo_foco.jsx';
import Agenda from './src/components/agenda/agenda.jsx';
import ModoSonoMain from './src/components/sono/modo_sono.jsx';
import Profile from './src/components/common/profile.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase/firebase_config';
import { ToolsProvider, useTools } from './src/contexts/ToolsContext';

function PlaceholderScreen({ title, description }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      {description ? <Text style={styles.placeholderText}>{description}</Text> : null}
    </View>
  );
}

function AppContent() {
  const [screen, setScreen] = useState('dashboard');
  const scrollRef = useRef(null);
  const lastIndexRef = useRef(0); // acompanha o índice mais recente visível
  const isManualNavigatingRef = useRef(false); // Flag para navegação manual via navbar
  const { width } = Dimensions.get('window');
  const { tools, triggerOpenToolsModal } = useTools();
  const hasAnyTool = tools?.modoFoco || tools?.modoSono || tools?.agenda;

  const SCREEN_ORDER = useMemo(() => {
    // Ordem solicitada para swipe: Foco → Sono → Dashboard → Ranking
    const ordered = [];

    if (!hasAnyTool) {
      ordered.push('dashboard', 'adicionar', 'perfil');
      return ordered;
    }

    if (tools?.modoFoco) ordered.push('foco');
    if (tools?.modoSono) ordered.push('sono');
    ordered.push('dashboard');
    if (tools?.agenda) ordered.push('agenda');
    ordered.push('ranking');
    return ordered;
  }, [hasAnyTool, tools?.agenda, tools?.modoFoco, tools?.modoSono]);

  useEffect(() => {
    if (!SCREEN_ORDER.includes(screen)) {
      setScreen(SCREEN_ORDER[0]);
    }
  }, [SCREEN_ORDER, screen]); // (Aviso de desenvolvimento movido para dentro das telas específicas)

  const indexFromKey = (key) => {
    const idx = SCREEN_ORDER.indexOf(key);
    return idx >= 0 ? idx : 0;
  };

  const keyFromIndex = (idx) => SCREEN_ORDER[Math.min(Math.max(idx, 0), SCREEN_ORDER.length - 1)];
  const renderPage = (key) => {
    switch (key) {
      case 'dashboard':
        return <Dashboard />;
      case 'foco':
        return <Modo_Foco />;
      case 'sono':
        return <ModoSonoMain />;
      case 'agenda':
        return <Agenda />;
      case 'ranking':
        return <PlaceholderScreen title="Ranking" description="Ranking e pontuação" />;
      case 'perfil':
        return <Profile />;
      case 'adicionar':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>Adicionar ferramentas</Text>
            <Text style={styles.placeholderText}>Ative Modo Foco, Modo Sono ou Agenda para liberar as telas.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={triggerOpenToolsModal}>
              <Text style={styles.primaryButtonText}>Escolher ferramentas</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return <Dashboard />;
    }
  };

  useEffect(() => { // Scroll to selected page when screen changes (from navbar press)
    const i = indexFromKey(screen);
    if (lastIndexRef.current !== i) {
      lastIndexRef.current = i;
      scrollRef.current?.scrollTo({ x: i * width, animated: true });
    }
  }, [screen, width, SCREEN_ORDER]);

  // Mantém Dashboard como tela inicial, inclusive após login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Independente das ferramentas ativas, mantém Dashboard
      setScreen('dashboard');
    });
    return () => unsub();
  }, []);

  const handleScrollEnd = (e) => {
    const x = e?.nativeEvent?.contentOffset?.x || 0;
    const i = Math.round(x / width);
    const key = keyFromIndex(i);
    
    // Se não estava em navegação manual, atualiza baseado na posição do scroll
    if (!isManualNavigatingRef.current && key && key !== screen) {
      setScreen(key);
    }
    // Reseta flag ao fim do scroll
    isManualNavigatingRef.current = false;
  };

  const handleScroll = (e) => {
    // Se estamos em navegação manual, ignora os eventos de scroll
    if (isManualNavigatingRef.current) return;
    // Atualiza apenas índice recente, sem trocar tela durante o scroll para evitar "pulos"
    const x = e?.nativeEvent?.contentOffset?.x || 0;
    const i = Math.round(x / width);
    if (i !== lastIndexRef.current) {
      lastIndexRef.current = i;
    }
  };

  const handleNavbarNavigate = (key) => {
    const i = indexFromKey(key);
    lastIndexRef.current = i;
    
    // Ativa flag de navegação manual
    isManualNavigatingRef.current = true;
    
    setScreen(key);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {SCREEN_ORDER.map((key) => (
          <View key={key} style={[styles.page, { width }]}> 
            {renderPage(key)}
          </View>
        ))}
      </ScrollView>
      <Navbar current={screen} onNavigate={handleNavbarNavigate} />
    </View>
  );
}

export default function App() {
  return (
    <ToolsProvider>
      <AppContent />
    </ToolsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingBottom: 92,
  },
  page: {
    flex: 1,
    paddingBottom: 92,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  placeholderText: {
    color: '#4B5563',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0EA5A4',
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});