import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Non-blocking overlay: does not intercept touches (pointerEvents="none").
export default function DevelopmentModal({ visible, title = 'Em desenvolvimento', message = 'Em breve nas próximas atualizações' }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
});
