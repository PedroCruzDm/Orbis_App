import { useState, useEffect } from 'react';
import { useUserData } from './use_user_data';

export function useDashboardData() {
  const { user, loading, error } = useUserData();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!user || !user.ferramentas) return;

    const ferramentas = user.ferramentas;
    
    // Calcula dados do dashboard a partir do Firebase
    const sleepScoreToday = ferramentas.sono?.scoreHoje || 0;
    
    // Calcula minutos de foco hoje
    const focusMinutesToday = ferramentas.foco?.pontos?.pontosHoje || 0;
    const focusGoal = 240; // Meta padrão, pode vir do usuário
    
    // Dias consecutivos (baseado no histórico)
    const streakDays = calculateStreak(ferramentas.foco?.pontos?.historico || []);
    
    const stats = [
      { 
        key: 'focus', 
        title: 'Tempo de Foco', 
        value: focusMinutesToday, 
        max: focusGoal, 
        description: 'minutos hoje', 
        type: 'gauge' 
      },
      { 
        key: 'sleep', 
        title: 'Qualidade do Sono', 
        value: sleepScoreToday, 
        max: 100, 
        description: 'score hoje', 
        type: 'gauge' 
      },
      { 
        key: 'streak', 
        title: 'Dias Consecutivos', 
        value: streakDays.current, 
        max: 7, 
        description: 'Sequência ativa', 
        type: 'days', 
        days: streakDays.week 
      },
    ];

    // Atividades recentes (últimas 3 do histórico de foco)
    const recent = (ferramentas.foco?.pontos?.historico || [])
      .slice(-3)
      .reverse()
      .map((entry, idx) => ({
        id: idx + 1,
        title: 'Sessão de foco concluída',
        time: new Date(entry.at?.seconds * 1000 || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duration: `${entry.pontos} min`,
      }));

    // Dados semanais
    const weeklyData = calculateWeeklyData(ferramentas);

    setDashboardData({
      sleepScoreToday,
      stats,
      recent: recent.length > 0 ? recent : [
        { id: 1, title: 'Nenhuma atividade registrada', time: '--:--', duration: '0 min' }
      ],
      weekly: weeklyData.summary,
      weeklyDays: weeklyData.days,
      weeklyTargetFocusMinutes: 1200, // Pode vir do perfil do usuário
    });
  }, [user]);

  return { dashboardData, loading, error };
}

// Calcula streak de dias consecutivos
function calculateStreak(historico) {
  if (!historico || historico.length === 0) {
    return { current: 0, week: [false, false, false, false, false, false, false] };
  }

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const daysWithActivity = historico.map(entry => {
    const date = new Date(entry.at?.seconds * 1000 || entry.at);
    return date.toISOString().split('T')[0];
  });

  const week = last7Days.map(day => daysWithActivity.includes(day));
  
  // Conta streak atual (dias consecutivos a partir de hoje)
  let current = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    if (week[i]) current++;
    else break;
  }

  return { current, week };
}

// Calcula dados semanais
function calculateWeeklyData(ferramentas) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const days = last7Days.map(date => {
    const dayLabel = dayLabels[date.getDay()];
    const dateStr = date.toISOString().split('T')[0];

    // Busca minutos de foco deste dia
    const focusEntry = (ferramentas.foco?.pontos?.historico || [])
      .find(entry => {
        const entryDate = new Date(entry.at?.seconds * 1000 || entry.at);
        return entryDate.toISOString().split('T')[0] === dateStr;
      });

    // Busca score de sono deste dia
    const sleepEntry = (ferramentas.sono?.historicoScore || [])
      .find(entry => {
        const entryDate = new Date(entry.at?.seconds * 1000 || entry.at);
        return entryDate.toISOString().split('T')[0] === dateStr;
      });

    return {
      label: dayLabel,
      focusMinutes: focusEntry?.pontos || 0,
      sleepScore: sleepEntry?.score || 0,
    };
  });

  const totalFocusMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0);
  const avgSleepScore = Math.round(
    days.reduce((sum, d) => sum + d.sleepScore, 0) / days.filter(d => d.sleepScore > 0).length || 0
  );

  return {
    days,
    summary: {
      focusMinutes: totalFocusMinutes,
      avgSleepScore,
      avgSleepEfficiency: 85, // Pode ser calculado se tiver dados de eficiência
      weeklyXP: totalFocusMinutes * 0.5, // Exemplo: 0.5 XP por minuto
      streakDays: calculateStreak(ferramentas.foco?.pontos?.historico || []).current,
    },
  };
}