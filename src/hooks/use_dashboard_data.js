import { useEffect, useState } from 'react';
import { useUserData } from './use_user_data';

// Converte Timestamp/Date/string em epoch para ordenação
function toDateMs(value) {
  try {
    if (!value) return 0;
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  } catch (e) {
    return 0;
  }
}

// Converte "HH:MM:SS" ou "MM:SS" em minutos
function parseDurationToMinutes(str) {
  if (!str || typeof str !== 'string') return 0;
  const parts = str.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 60 + m + s / 60;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m + s / 60;
  }
  if (parts.length === 1) return parts[0];
  return 0;
}

export function useDashboardData() {
  const { user, loading, error } = useUserData();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!user || !user.ferramentas) return;

    const ferramentas = user.ferramentas;
    const foco = ferramentas.foco || {};
    const tarefas = foco.tarefas || {};
    const historico = Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : [];
    const listaConcluida = Array.isArray(tarefas.listaConcluida) ? tarefas.listaConcluida : [];
    const listaPendente = Array.isArray(tarefas.listaPendente) ? tarefas.listaPendente : [];
    const listaFalhada = Array.isArray(tarefas.listaFalhada) ? tarefas.listaFalhada : [];
    const lista = Array.isArray(tarefas.lista) ? tarefas.lista : [];

    // Totais de tarefas criadas/concluídas
    const totalTasks = lista.length + listaConcluida.length + listaPendente.length + listaFalhada.length;
    const completedTasks = listaConcluida.length;

    // Ordena histórico (mais recente primeiro)
    const sortedHistory = [...historico].sort(
      (a, b) => toDateMs(b.timestamp || b.date || b.id) - toDateMs(a.timestamp || a.date || a.id)
    );

    // Minutos de foco do dia (somatório do histórico de hoje)
    const todayStr = new Date().toISOString().split('T')[0];
    const historyToday = sortedHistory.filter((entry) => {
      const dt = toDateMs(entry.timestamp || entry.date || entry.id);
      return dt && new Date(dt).toISOString().split('T')[0] === todayStr;
    });

    const focusMinutesToday = historyToday.reduce(
      (sum, entry) => sum + parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent),
      0
    );

    const focusGoal = 60  ; // Meta padrão (minutos)

    // Streak baseado no histórico de foco
    const streakDays = calculateStreak(sortedHistory);

    const sleepScoreToday = ferramentas.sono?.scoreHoje || 0;

    // Calcula tempo bem gasto (tarefas bem-sucedidas vs. total) - apenas de hoje
    const totalTimeMinutes = historyToday.reduce(
      (sum, entry) => sum + parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent),
      0
    );
    
    const successTimeMinutes = historyToday
      .filter((entry) => entry.statusTarefa === 'concluida' || entry.status === 'Sucesso')
      .reduce(
        (sum, entry) => sum + parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent),
        0
      );
    
    const qualityOfFocusPercentage = totalTimeMinutes > 0 ? Math.round((successTimeMinutes / totalTimeMinutes) * 100) : 0;

    const stats = [
      {
        key: 'focus',
        title: 'Tempo de Foco',
        value: Math.round(focusMinutesToday),
        max: focusGoal,
        description: 'minutos hoje',
        type: 'gauge',
      },
      {
        key: 'quality',
        title: 'Foco Bem Gasto',
        value: qualityOfFocusPercentage,
        max: 100,
        description: '% de qualidade',
        type: 'gauge',
      },
      {
        key: 'sleep',
        title: 'Qualidade do Sono',
        value: sleepScoreToday,
        max: 100,
        description: 'score hoje',
        type: 'gauge',
      },
      {
        key: 'streak',
        title: 'Dias Consecutivos',
        value: streakDays.current,
        max: 7,
        description: 'Sequência ativa',
        type: 'days',
        days: streakDays.week,
      },
    ];

    // Atividades recentes (tarefas executadas) com tempo gasto
    const recentFocus = sortedHistory.slice(0, 5).map((entry, idx) => ({
      id: entry.id || idx,
      title: entry.nomeTarefa || entry.titulo || entry.title || 'Sessão de foco',
      category: entry.categoria || entry.categoriaTitulo || 'Sem categoria',
      status: entry.statusTarefa || entry.status || 'Falha',
      timeSpent: entry.tempo || entry.tempoFoco || entry.timeSpent || '--:--',
      date: entry.dia || entry.date || '',
    }));

    // Dados semanais baseados no histórico real
    const weeklyData = calculateWeeklyData(ferramentas, sortedHistory);

    setDashboardData({
      sleepScoreToday,
      stats,
      recentFocus: recentFocus.length > 0
        ? recentFocus
        : [{ id: 1, title: 'Nenhuma atividade registrada', category: '', status: '', timeSpent: '0:00', date: '--/--' }],
      weekly: weeklyData.summary,
      weeklyDays: weeklyData.days,
      weeklyTargetFocusMinutes: 1200,
      focusSummary: { 
        totalTasks, 
        completedTasks,
        totalTimeMinutes: Math.round(totalTimeMinutes),
        successTimeMinutes: Math.round(successTimeMinutes),
        qualityPercentage: qualityOfFocusPercentage,
      },
    });
  }, [user]);

  return { dashboardData, loading, error };
}

// Calcula streak de dias consecutivos baseado no histórico de foco
function calculateStreak(history = []) {
  if (!history || history.length === 0) {
    return { current: 0, week: [false, false, false, false, false, false, false] };
  }

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const daysWithActivity = history.map((entry) => {
    const dt = toDateMs(entry.timestamp || entry.date || entry.id);
    return dt ? new Date(dt).toISOString().split('T')[0] : null;
  }).filter(Boolean);

  const week = last7Days.map((day) => daysWithActivity.includes(day));

  let current = 0;
  for (let i = week.length - 1; i >= 0; i -= 1) {
    if (week[i]) current += 1;
    else break;
  }

  return { current, week };
}

// Calcula dados semanais: minutos de foco e score de sono por dia
function calculateWeeklyData(ferramentas, history = []) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const days = last7Days.map((date) => {
    const dayLabel = dayLabels[date.getDay()];
    const dateStr = date.toISOString().split('T')[0];

    const focusMinutes = history
      .filter((entry) => {
        const dt = toDateMs(entry.timestamp || entry.date || entry.id);
        return dt && new Date(dt).toISOString().split('T')[0] === dateStr;
      })
      .reduce((sum, entry) => sum + parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent), 0);

    const sleepEntry = (ferramentas.sono?.historicoScore || []).find((entry) => {
      const entryDate = toDateMs(entry.at || entry.date || entry.id);
      return entryDate && new Date(entryDate).toISOString().split('T')[0] === dateStr;
    });

    return {
      label: dayLabel,
      focusMinutes,
      sleepScore: sleepEntry?.score || 0,
    };
  });

  const totalFocusMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0);
  const avgSleepScore = Math.round(
    days.reduce((sum, d) => sum + d.sleepScore, 0) /
      (days.filter((d) => d.sleepScore > 0).length || 1)
  );

  return {
    days,
    summary: {
      focusMinutes: totalFocusMinutes,
      avgSleepScore,
      avgSleepEfficiency: 85,
      weeklyXP: totalFocusMinutes * 0.5,
      streakDays: calculateStreak(history).current,
    },
  };
}