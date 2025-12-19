import react from "react";

// Dados diários
const sleepScoreToday = 72; // 0-100
const stats = [
  { 
    key: 'prod',
    title: 'Produtividade',
    value: 12,
    max: 20,
    description: 'Hoje',
    type: 'gauge' 
  },
  { 
    key: 'foco', title: 'Tempo de Foco', value: 180, max: 240, description: 'minutos hoje', type: 'gauge' },
  { key: 'dias', title: 'Dias Consecutivos', value: 5, max: 7, description: 'Sequência ativa', type: 'days', days: [false,true,true,true,true,true,true] },
];

const recent = [
  { id: 1, title: 'Sessão de foco concluída', time: '14:30', duration: '45 min' },
  { id: 2, title: 'Relatório mensal finalizado', time: '13:15', duration: '30 min' },
  { id: 3, title: 'Planejamento do dia', time: '09:30', duration: '15 min' },
];

// Dados semanais (amostra)
const weekly = {
  focusMinutes: 930, // total semana
  avgSleepScore: 78,
  avgSleepEfficiency: 85,
  weeklyXP: 520,
  streakDays: 6,
};

// Distribuição por dia (Seg-Dom)
const weeklyDays = [
  { label: 'Seg', focusMinutes: 120, sleepScore: 80 },
  { label: 'Ter', focusMinutes: 150, sleepScore: 82 },
  { label: 'Qua', focusMinutes: 180, sleepScore: 88 },
  { label: 'Qui', focusMinutes: 160, sleepScore: 76 },
  { label: 'Sex', focusMinutes: 140, sleepScore: 68 },
  { label: 'Sáb', focusMinutes: 100, sleepScore: 74 },
  { label: 'Dom', focusMinutes: 80, sleepScore: 70 },
];

const weeklyTargetFocusMinutes = 1200; // meta 20h/semana

export { stats, recent, sleepScoreToday, weekly, weeklyDays, weeklyTargetFocusMinutes };