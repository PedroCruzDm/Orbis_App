import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import Header from './src/components/Header/header';
import Navbar from './src/components/Navbar/navbar';
import Dashboard from './src/components/Dashboard/Dashboard';
import Modo_Foco from './src/components/Modo_Foco/Screens/main';
import Agenda from './src/components/Agenda/Screens/main';
import ModoSonoMain from './src/components/Modo_Sono/asset/main';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/hooks/Firebase/config';


//Alert.alert('DB Config', JSON.stringify(database, null, 2));
//console.log('Firebase Config:', firebaseConfig);

function PlaceholderScreen({ title, description }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      {description ? <Text style={styles.placeholderText}>{description}</Text> : null}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('dashboard'); // 'dashboard' | 'foco' | 'sono' | 'agenda' | 'ranking'
  const scrollRef = useRef(null);
  const { width } = Dimensions.get('window');

  const SCREEN_ORDER = ['foco', 'sono', 'dashboard', 'agenda', 'ranking'];
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
      default:
        return <Dashboard />;
    }
  };

  // Scroll to selected page when screen changes (from navbar press)
  useEffect(() => {
    const i = indexFromKey(screen);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  }, [screen, width]);

  // After user logs in, start on Focus mode
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setScreen('foco');
      }
    });
    return () => unsub();
  }, []);

  const handleScrollEnd = (e) => {
    const x = e?.nativeEvent?.contentOffset?.x || 0;
    const i = Math.round(x / width);
    const key = keyFromIndex(i);
    if (key && key !== screen) setScreen(key);
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {SCREEN_ORDER.map((key) => (
          <View key={key} style={[styles.page, { width }]}> 
            {renderPage(key)}
          </View>
        ))}
      </ScrollView>
      <Navbar current={screen} onNavigate={setScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingBottom: 92, // espaço para a navbar inferior
  },
  page: {
    flex: 1,
    paddingBottom: 92, // espaço para a navbar inferior
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
});