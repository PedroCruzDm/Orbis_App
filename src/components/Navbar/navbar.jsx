import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const ITEMS = [
  { key: 'foco', label: 'Modo Foco', icon: '🎯' },
  { key: 'sono', label: 'Modo Sono', icon: '🛌' },
  { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { key: 'agenda', label: 'Agenda', icon: '📅' },
  { key: 'ranking', label: 'Ranking', icon: '🏆' },
];

export default function Navbar({ current = 'dashboard', onNavigate = () => {} }) {
  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        {ITEMS.map((it) => {
          const active = it.key === current;
          return (
            <TouchableOpacity
              key={it.key}
              style={styles.item}
              onPress={() => onNavigate(it.key)}
              accessibilityRole="button"
              accessibilityLabel={it.label}
            >
              {active ? (
                <View style={[styles.iconWrap, styles.iconWrapActive]}> 
                  <Text style={[styles.icon, styles.iconActive]}>{it.icon}</Text>
                  <Text style={styles.activeLabel}>{it.label}</Text>
                </View>
              ) : (
                <View style={styles.iconWrap}>
                  <Text style={styles.icon}>{it.icon}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(3, 77, 173, 0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  icon: {
    fontSize: 20,
    color: '#6B7280',
  },
  iconActive: {
    color: '#fff',
    fontSize: 24,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: '#5c8bf0ff',
    width: 64,
    height: 64,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  activeLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
});
