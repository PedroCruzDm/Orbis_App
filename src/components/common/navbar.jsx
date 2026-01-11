import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../theme';
import { useTools } from '../../contexts/ToolsContext';

const ALL_ITEMS = [
  { key: 'foco', label: 'Modo Foco', icon: 'target', toolKey: 'modoFoco' },
  { key: 'sono', label: 'Modo Sono', icon: 'sleep', toolKey: 'modoSono' },
  { key: 'dashboard', label: 'Dashboard', icon: 'home', toolKey: null },
  { key: 'agenda', label: 'Agenda', icon: 'calendar', toolKey: 'agenda' },
  { key: 'ranking', label: 'Ranking', icon: 'trophy', toolKey: null },
];

export default function Navbar({ current = 'dashboard', onNavigate = () => {} }) {
  const { tools, triggerOpenToolsModal } = useTools();

  // Filtra apenas ferramentas ativas
  const activeItems = ALL_ITEMS.filter(item => { // Dashboard e Ranking sempre aparecem
    if (!item.toolKey) return true; // Outras ferramentas aparecem se estiverem ativas
    return tools[item.toolKey];
  });

  // Se todas as ferramentas estão desativadas, mostra opções mínimas
  const hasNoTools = !tools.modoFoco && !tools.modoSono && !tools.agenda;
  const ITEMS = hasNoTools 
    ? [
        { key: 'adicionar', label: 'Adicionar ferramentas', icon: 'plus-circle' },
        { key: 'dashboard', label: 'Dashboard', icon: 'home' },
        { key: 'perfil', label: 'Perfil', icon: 'account' },
      ]
    : activeItems;
  const handlePress = (key) => {
    if (key === 'adicionar') {
      onNavigate('adicionar');
      triggerOpenToolsModal();
      return;
    }

    if (key === 'perfil') {
      onNavigate('perfil');
      return;
    }

    onNavigate(key);
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        {ITEMS.map((it) => {
          const active = it.key === current;
          return (
            <TouchableOpacity
              key={it.key}
              style={styles.item}
              onPress={() => handlePress(it.key)}
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
    alignItems: 'stretch',
    height: 64,
    backgroundColor: theme.colors.primary[600],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primary[500],
  },
  activeLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});