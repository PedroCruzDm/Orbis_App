import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import theme from '../../theme';
import { useUserData } from '../../hooks/use_user_data';
import { useTools } from '../../contexts/ToolsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profile() {
  const { user, loading, error } = useUserData();
  const { tools } = useTools();
  // Hooks devem ser chamados antes de qualquer retorno condicional
  const [expanded, setExpanded] = useState({ foco: false, sono: false, agenda: false });
  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Erro ao carregar usuário: {String(error)}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.muted}>Faça login para ver suas informações.</Text>
      </View>
    );
  }

  const boolText = (v) => (v ? 'Sim' : 'Não');

  const focoNivel = user?.ferramentas?.foco?.nivel;
  const sonoNivel = user?.ferramentas?.sono?.nivel;
  const agendaNivel = user?.ferramentas?.agenda?.nivel;


  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <Row label="Nome" value={user?.nome} />
        <Row label="Apelido" value={user?.apelido || '—'} />
        <Row label="Email" value={user?.email || '—'} />
        <Row label="Idade" value={user?.idade != null ? String(user.idade) : '—'} />
        <Row label="Evento Fixo Inicial" value={user?.eventoFixoInicial || '—'} />
        <Row label="Receber Notificações" value={boolText(user?.receberNotificacoes)} />
        <Row label="Game XP Ativado" value={boolText(user?.gameXPAtivado)} />
        <Row label="Dias consecutivos" value={String(user?.dias_consecutivos ?? 0)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ferramentas</Text>

        {[
          { key: 'foco', label: 'Modo Foco', active: tools?.modoFoco, nivel: focoNivel, extra: user?.ferramentas?.foco },
          { key: 'sono', label: 'Modo Sono', active: tools?.modoSono, nivel: sonoNivel, extra: user?.ferramentas?.sono },
          { key: 'agenda', label: 'Agenda', active: tools?.agenda, nivel: agendaNivel, extra: user?.ferramentas?.agenda },
        ].map(({ key, label, active, nivel, extra }) => (
          <View key={key} style={styles.accBlock}>
            <TouchableOpacity style={styles.accHeader} onPress={() => toggle(key)}>
              <Text style={styles.accTitle}>{label}</Text>
              <View style={styles.accRight}>
                <View style={[styles.statusChip, active ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusText, active ? styles.statusTextOn : styles.statusTextOff]}>
                    {active ? 'Ativa' : 'Inativa'}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={expanded[key] ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={theme.colors.text.secondary}
                />
              </View>
            </TouchableOpacity>

            {expanded[key] && (
              <View style={styles.accDetails}>
                <Row label="Nível" value={String(nivel?.nivelAtual ?? 1)} />
                <Row label="Progresso (%)" value={String(nivel?.progresso ?? 0)} />
                <Row label="XP Total" value={String(nivel?.xpTotal ?? 0)} />
                <Row label="XP Hoje" value={String(nivel?.xpHoje ?? 0)} />

                {key === 'foco' && (
                  <>
                    <Row label="Pontos (total)" value={String(extra?.pontos?.total ?? 0)} />
                    <Row label="Pontos hoje" value={String(extra?.pontos?.pontosHoje ?? 0)} />
                  </>
                )}
                {key === 'sono' && (
                  <>
                    <Row label="Score hoje" value={String(extra?.scoreHoje ?? '—')} />
                    <Row label="Lembretes" value={boolText(extra?.lembretesAtivados)} />
                  </>
                )}
                {key === 'agenda' && (
                  <>
                    <Row label="Eventos fixos" value={String(extra?.eventosFixos?.length ?? 0)} />
                    <Row label="Eventos flexíveis" value={String(extra?.eventosFlexiveis?.length ?? 0)} />
                  </>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '—'}</Text>
    </View>
  );
}

function SubSection({ title, data }) {
  const nivel = data?.nivelAtual ?? 1;
  const progresso = data?.progresso ?? 0;
  const xpTotal = data?.xpTotal ?? 0;
  const xpHoje = data?.xpHoje ?? 0;
  return (
    <View style={{ marginTop: theme.spacing.sm }}>
      <Text style={styles.subTitle}>{title}</Text>
      <Row label="Nível" value={String(nivel)} />
      <Row label="Progresso (%)" value={String(progresso)} />
      <Row label="XP Total" value={String(xpTotal)} />
      <Row label="XP Hoje" value={String(xpHoje)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: theme.colors.background?.light || '#F6F7F9' },
  content: { padding: theme.spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.card?.light || '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  accBlock: {
    marginBottom: theme.spacing.sm,
  },
  accHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  accTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  accRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  statusOn: {
    backgroundColor: theme.colors.primary[50],
  },
  statusOff: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statusTextOn: {
    color: theme.colors.primary[700],
  },
  statusTextOff: {
    color: theme.colors.text.secondary,
  },
  accDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border?.light || '#E5E7EB',
    marginTop: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border?.light || '#E5E7EB',
  },
  rowLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  rowValue: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.sm,
  },
  muted: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
});
