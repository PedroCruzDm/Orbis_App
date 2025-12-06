import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View, Alert, Text } from 'react-native';
import Header from './src/components/Header/header';
import Navbar from './src/components/Navbar/navbar';
import CadastroInicial from './src/components/CadastroInicial';
import Dashboard from './src/components/Dashboard/Dashboard';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'cadastro' | 'login'

  function handleCreate() {
    setScreen('cadastro');
  }

  function handleLogin() {
    // Placeholder: show simple alert or navigate to real login screen later
    setScreen('login');
    Alert.alert('Entrar', 'Tela de login ainda não implementada.');
  }

  return (
    <View style={styles.container}>
      <Header />
      {screen === 'home' && (
        <>
          <Navbar current="dashboard" onNavigate={(key) => Alert.alert('Navegar para', key)} />
            <Dashboard />
          
        </>
      )}

      {screen === 'cadastro' && <CadastroInicial />}

      {screen === 'login' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Tela de login (a implementar)</Text>
        </View>
      )}
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
    paddingBottom: 92, // leave space for bottom navbar
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#374151',
    fontSize: 16,
  },
});