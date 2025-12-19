import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Header from './src/components/Header/header';
import Navbar from './src/components/Navbar/navbar';
import Dashboard from './src/components/Dashboard/Dashboard';
import Modo_Foco from './src/components/Modo_Foco/Screens/main';
import Agenda from './src/components/Agenda/Screens/main';
import ModoSonoMain from './src/components/Modo_Sono/asset/main';

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

  const renderScreen = () => {
    switch (screen) {
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

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>{renderScreen()}</View>
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