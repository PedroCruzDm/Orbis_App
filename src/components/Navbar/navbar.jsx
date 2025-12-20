import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';

const ITEMS = [
  { key: 'foco', label: 'Modo Foco', icon: 'target' },
  { key: 'sono', label: 'Modo Sono', icon: 'sleep' },
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'agenda', label: 'Agenda', icon: 'calendar' },
  { key: 'ranking', label: 'Ranking', icon: 'trophy' },
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
                  <MaterialCommunityIcons name={it.icon} size={24} color="#e9e9e9ff" />
                  <Text style={styles.activeLabel}>{it.label}</Text>
                </View>
              ) : (
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={it.icon} size={24} color="#0EA5A4" />
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
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary[600],
    ...theme.shadows.lg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  icon: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  iconActive: {
    color: theme.colors.text.inverse,
    fontSize: 24,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primary[500],
    width: 64,
    height: 74,
    ...theme.shadows.xl,
  },
  activeLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});