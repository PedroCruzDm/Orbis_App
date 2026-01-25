import { useEffect, useState } from 'react';
import { useUserData } from './use_user_data';

// Paleta compartilhada para categorias de foco
const CATEGORY_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#6366F1'];

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

const toLocalDateStr = (msOrDate) => {
  const d = new Date(msOrDate);
  // Converte para YYYY-MM-DD usando a data local, não UTC
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Agrupa minutos por categoria e devolve lista ordenada + total
function computeCategoryStats(entries = []) {
  const categoryMap = {};

  entries.forEach((entry) => {
    const cat = entry.categoria || entry.categoriaTitulo || 'Outro';
    const minutes = parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent);
    categoryMap[cat] = (categoryMap[cat] || 0) + minutes;
  });

  const categories = Object.entries(categoryMap)
    .map(([label, minutes], idx) => ({
      id: idx,
      label,
      minutes: Math.round(minutes),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => (b.minutes || 0) - (a.minutes || 0));

  const totalMinutes = categories.reduce((sum, cat) => sum + (cat.minutes || 0), 0);

  return { categories, totalMinutes };
}

function buildDashboardData(user) {
  if (!user || !user.ferramentas) return null;

  const ferramentas = user.ferramentas;
  const foco = ferramentas.foco || {};
  const tarefas = foco.tarefas || {};
  const historico = Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : [];
  const listaConcluida = Array.isArray(tarefas.listaConcluida) ? tarefas.listaConcluida : [];
  const listaPendente = Array.isArray(tarefas.listaPendente) ? tarefas.listaPendente : [];
  const listaFalhada = Array.isArray(tarefas.listaFalhada) ? tarefas.listaFalhada : [];
  const lista = Array.isArray(tarefas.lista) ? tarefas.lista : [];

  const totalTasks = lista.length + listaConcluida.length + listaPendente.length + listaFalhada.length;
  const completedTasks = listaConcluida.length;

  const sortedHistory = [...historico].sort(
    (a, b) => toDateMs(b.timestamp || b.date || b.id) - toDateMs(a.timestamp || a.date || a.id)
  );

  const today = new Date();
  const todayLocalStr = toLocalDateStr(today);
  const todayStrBR = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const historyToday = sortedHistory.filter((entry) => {
    if (!entry) return false;

    if (entry.dia && typeof entry.dia === 'string' && entry.dia === todayStrBR) {
      return true;
    }

    const dt = toDateMs(entry.timestamp || entry.date || entry.id);
    const entryLocal = dt ? toLocalDateStr(dt) : null;
    return entryLocal ? entryLocal === todayLocalStr : false;
  });

  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const historyWeek = sortedHistory.filter((entry) => {
    const dt = toDateMs(entry.timestamp || entry.date || entry.id);
    return dt && dt >= startOfWeek.getTime();
  });

  const focusMinutesToday = historyToday.reduce(
    (sum, entry) => sum + parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent),
    0
  );

  const focusGoal = 60;
  const streakDays = calculateStreak(sortedHistory);
  const sleepScoreToday = ferramentas.sono?.scoreHoje || 0;

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

  const dayBreakdown = computeCategoryStats(historyToday);
  const weekBreakdown = computeCategoryStats(historyWeek);

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
      dates: streakDays.dates,
    },
  ];

  const recentFocus = sortedHistory.slice(0, 5).map((entry, idx) => ({
    id: entry.id || idx,
    title: entry.nomeTarefa || entry.titulo || entry.title || 'Sessão de foco',
    category: entry.categoria || entry.categoriaTitulo || 'Sem categoria',
    status: entry.statusTarefa || entry.status || 'Falha',
    timeSpent: entry.tempo || entry.tempoFoco || entry.timeSpent || '--:--',
    date: entry.dia || entry.date || '',
  }));

  const weeklyData = calculateWeeklyData(ferramentas, sortedHistory);
  const enhancedDashboard = calculateEnhancedDashboard(ferramentas, sortedHistory, weeklyData);

  const recentActivitiesToday = enhancedDashboard.recentActivities.filter((activity) => {
    if (!activity.date) return false;
    return activity.date === todayStrBR;
  });

  console.log('=== RETORNO DO BUILDBOARD ===');
  console.log('streakDays.current:', streakDays.current);
  console.log('stats[streak]:', stats.find(s => s.key === 'streak'));

  return {
    sleepScoreToday,
    stats,
    recentFocus: recentFocus.length > 0
      ? recentFocus
      : [{ id: 1, title: 'Nenhuma atividade registrada', category: '', status: '', timeSpent: '0:00', date: '--/--' }],
    weekly: weeklyData.summary,
    weeklyDays: weeklyData.days,
    weeklyTargetFocusMinutes: 840,
    focusSummary: {
      totalTasks,
      completedTasks,
      totalTimeMinutes: Math.round(dayBreakdown.totalMinutes),
      weekTotalMinutes: Math.round(weekBreakdown.totalMinutes),
      successTimeMinutes: Math.round(successTimeMinutes),
      qualityPercentage: qualityOfFocusPercentage,
    },
    weeklyData: enhancedDashboard.productivityEvolution,
    currentScore: enhancedDashboard.currentProductivity,
    targetScore: 80,
    hoursSlept: enhancedDashboard.hoursSlept,
    cycles: enhancedDashboard.cycles,
    efficiency: enhancedDashboard.efficiency,
    sleepInsight: enhancedDashboard.sleepInsight,
    weeklyScores: enhancedDashboard.weeklyScores,
    categories: dayBreakdown.categories,
    categoriesDay: dayBreakdown.categories,
    categoriesWeek: weekBreakdown.categories,
    heatmapData: enhancedDashboard.heatmapData,
    weeklyComparisonData: enhancedDashboard.weeklyComparison,
    currentStreak: streakDays.current,
    achievements: enhancedDashboard.achievements,
    recentActivities: enhancedDashboard.recentActivities,
    recentActivitiesToday: recentActivitiesToday,
  };
}

export function useDashboardData() {
  const { user, loading, error, refetch: refetchUser } = useUserData();
  const [dashboardData, setDashboardData] = useState(null);
  const [todayKey, setTodayKey] = useState(() => new Date().toISOString().split('T')[0]);

  const refetch = async () => {
    await refetchUser();
  };

  // Atualiza chave de dia a cada minuto para reagir à virada de data
  useEffect(() => {
    const id = setInterval(() => {
      const currentKey = new Date().toISOString().split('T')[0];
      setTodayKey((prev) => (prev === currentKey ? prev : currentKey));
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user || !user.ferramentas) return;

    const dashboard = buildDashboardData(user);
    if (dashboard) {
      setDashboardData(dashboard);
    }
  }, [user, todayKey]);

  return { dashboardData, loading, error, refetch };
}

// Calcula streak de dias consecutivos com a regra:
// - Último dia de atividade pode ser hoje ou ontem; se for antes de ontem, zera.
// - Conta apenas dias ativos consecutivos até esse último dia ativo.
function calculateStreak(history = []) {
  const today = new Date();
  const todayLocalStr = toLocalDateStr(today);
  const todayStrBR = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Converte BB/MM/YYYY para YYYY-MM-DD
  const convertBRDateToISO = (brDate) => {
    if (!brDate || typeof brDate !== 'string') return null;
    const parts = brDate.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // DEBUG: Log do histórico recebido
  console.log('=== DEBUG STREAK ===');
  console.log('Total de entradas no histórico:', history.length);
  console.log('Primeiras 3 entradas:', history.slice(0, 3));
  
  const activityDays = new Set(
    (history || [])
      .map((entry) => {
        // Tenta primeiro o campo 'dia' em formato BR
        if (entry.dia && typeof entry.dia === 'string') {
          const iso = convertBRDateToISO(entry.dia);
          console.log(`Convertendo BR ${entry.dia} -> ISO ${iso}`);
          if (iso) return iso;
        }
        // Depois tenta converter timestamp/date/id
        const dt = toDateMs(entry.timestamp || entry.date || entry.id);
        const dateStr = dt ? toLocalDateStr(dt) : null;
        if (dateStr) {
          console.log(`Atividade detectada em: ${dateStr}`);
        }
        return dateStr;
      })
      .filter(Boolean)
  );
  
  console.log('Dias com atividade (Set):', Array.from(activityDays));
  console.log('Data de hoje:', todayLocalStr);

  // Calcula o domingo da semana atual
  const sunday = new Date(today);
  sunday.setDate(sunday.getDate() - sunday.getDay()); // Volta para domingo
  
  // Gera os 7 dias começando no domingo
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    return toLocalDateStr(d);
  });

  if (activityDays.size === 0) {
    return { current: 0, week: last7Days.map(() => false), dates: last7Days };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayStr = toLocalDateStr(yesterday);

  // Define o dia-âncora: último dia ativo mais recente (hoje ou ontem)
  let anchorStr = null;
  if (activityDays.has(todayLocalStr)) {
    anchorStr = todayLocalStr;
  } else if (activityDays.has(yesterdayStr)) {
    anchorStr = yesterdayStr;
  }

  // Se não houve atividade nem hoje nem ontem, streak zera
  if (!anchorStr) {
    return { current: 0, week: last7Days.map((day) => activityDays.has(day)), dates: last7Days };
  }

  // Conta dias ativos consecutivos retrocedendo a partir do âncora
  let current = 0;
  // Converte YYYY-MM-DD para Date corretamente
  const [year, month, day] = anchorStr.split('-').map(Number);
  const cursor = new Date(year, month - 1, day); // month é 0-indexed
  
  while (true) {
    const dateStr = toLocalDateStr(cursor);
    console.log('Verificando dia:', dateStr, 'ativo?', activityDays.has(dateStr));
    if (activityDays.has(dateStr)) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  const week = last7Days.map((day) => activityDays.has(day));

  console.log('Resultado final do streak:');
  console.log('- Dias consecutivos:', current);
  console.log('- Semana (7 dias):', week);
  console.log('- Datas:', last7Days);
  console.log('===================');

  return { current, week, dates: last7Days };
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
      date: dateStr,
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

// Calcula dados agregados para os 7 componentes melhorados do dashboard
function calculateEnhancedDashboard(ferramentas, history = [], weeklyData = {}) {
  const sono = ferramentas.sono || {};
  const foco = ferramentas.foco || {};
  const tarefas = foco.tarefas || {};
  const listaConcluida = Array.isArray(tarefas.listaConcluida) ? tarefas.listaConcluida : [];

  // 1. PRODUTIVIDADE GERAL - Evolução semanal
  const productivityEvolution = (weeklyData.days || []).map(day => ({
    day: day.label,
    date: day.date,
    productivity: Math.round((day.focusMinutes / 120) * 100), // 120min = 100%
  }));

  const currentProductivity = Math.round(
    (weeklyData.summary?.focusMinutes || 0) / (120 * 7) * 100
  );

  // 2. SCORE DE SONO - Card com mini-hipnograma
  const sleepHistorico = sono.historicoScore || [];
  const weeklyScores = (weeklyData.days || []).map((day) => {
    const entry = sleepHistorico.find((e) => {
      const dt = toDateMs(e.at || e.date || e.id);
      return dt && new Date(dt).toISOString().split('T')[0] === day.date;
    });
    return entry?.score || day.sleepScore || 0;
  });

  const avgSleepScore = weeklyScores.length > 0
    ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)
    : 0;

  const hoursSlept = sono.horasHoje || sono.avgHorasNoite || 0;
  const cycles = sono.ciclosHoje || (hoursSlept > 0 ? Math.round(hoursSlept / 1.5) : 0);
  const efficiency = sono.eficienciaHoje || sono.avgEficiencia || 0;
  const sleepInsight = avgSleepScore >= 80 ? '✨ Excelente sono! Mantenha essa rotina.' :
                       avgSleepScore >= 60 ? '📊 Sono regular. Tente manter consistência.' :
                       '⚠️ Sono baixo. Priorize descanso hoje.';

  // 3. TEMPO DE FOCO - Breakdown por categoria
  const { categories, totalMinutes: totalFocusMinutes } = computeCategoryStats(history);

  // 4. FOCO BEM GASTO - Heatmap 7 dias x 24 horas
  const heatmapData = {};
  const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  dayLabels.forEach(day => {
    heatmapData[day] = Array(24).fill(0);
  });

  history.forEach(entry => {
    const dt = toDateMs(entry.timestamp || entry.date || entry.id);
    if (!dt) return;
    
    const date = new Date(dt);
    const dayIdx = date.getDay();
    const dayName = dayLabels[(dayIdx + 6) % 7]; // Ajusta para segunda=0
    const hour = date.getHours();
    const minutes = parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent);
    const intensity = Math.min(10, Math.round((minutes / 60) * 10));
    
    if (heatmapData[dayName]) {
      heatmapData[dayName][hour] = Math.max(heatmapData[dayName][hour], intensity);
    }
  });

  // 5. QUALIDADE SONO VS FOCO - Comparação semanal
  const weeklyComparison = (weeklyData.days || []).map(day => ({
    day: day.label,
    date: day.date,
    sleepScore: day.sleepScore || 0,
    focusMinutes: day.focusMinutes || 0,
  }));

  // 6. STREAK e ACHIEVEMENTS
  const achievements = [
    { id: 1, title: '1 Dia', icon: 'flame', color: '#EF4444', unlocked: weeklyData.summary?.streakDays >= 1, target: 1 },
    { id: 2, title: '3 Dias', icon: 'fire', color: '#F59E0B', unlocked: weeklyData.summary?.streakDays >= 3, target: 3 },
    { id: 3, title: '7 Dias', icon: 'star', color: '#FBBF24', unlocked: weeklyData.summary?.streakDays >= 7, target: 7 },
    { id: 4, title: '14 Dias', icon: 'crown', color: '#60A5FA', unlocked: weeklyData.summary?.streakDays >= 14, target: 14 },
    { id: 5, title: '30 Dias', icon: 'trophy', color: '#10B981', unlocked: weeklyData.summary?.streakDays >= 30, target: 30 },
  ];

  // 7. ATIVIDADES RECENTES com XP
  const recentActivities = history.slice(0, 10).map((entry, idx) => {
    const minutes = parseDurationToMinutes(entry.tempo || entry.tempoFoco || entry.timeSpent);
    
    // Verifica status de múltiplas formas para compatibilidade
    const statusTarefa = entry.statusTarefa || '';
    const statusField = entry.status || '';
    const isSuccess = statusTarefa === 'concluida' || statusField === 'Sucesso';
    
    // XP vem do próprio registro ou calcula baseado no sucesso
    const xp = entry.xp || entry.xpGerado || (isSuccess ? Math.round(minutes * 0.5) : 0);
    const time = entry.tempo || entry.tempoFoco || entry.timeSpent || '0:00';
    
    // Capitaliza categoria corretamente
    const rawCategory = entry.categoria || entry.categoriaTitulo || 'Outro';
    const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
    
    return {
      id: entry.id || idx,
      title: entry.nomeTarefa || entry.titulo || entry.title || 'Sessão de foco',
      category: category,
      time: time,
      date: entry.dia || entry.date || new Date().toLocaleDateString('pt-BR'),
      status: isSuccess ? 'concluida' : (statusField === 'Em progresso' ? 'em_progresso' : 'falha'),
      xp,
    };
  });

  return {
    productivityEvolution,
    currentProductivity,
    hoursSlept: Math.round(hoursSlept * 10) / 10,
    cycles,
    efficiency,
    sleepInsight,
    weeklyScores,
    categories,
    heatmapData,
    weeklyComparison,
    achievements,
    recentActivities,
  };
}