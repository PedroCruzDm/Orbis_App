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
    key: 'foco', 
    title: 'Tempo de Foco', 
    value: 180, 
    max: 240, 
    description: 'minutos hoje', 
    type: 'gauge' 
  },
  { 
    key: 'dias', 
    title: 'Dias Consecutivos', 
    value: 0, 
    max: 7, 
    description: 'Sequência zerada', 
    type: 'days', 
    // IMPORTANTE: A contagem é regressiva a partir de HOJE (índice 6 = terça-feira)
    // Índices: [0=Qua, 1=Qui, 2=Sex, 3=Sab, 4=Dom, 5=Seg (ontem), 6=Ter (hoje)]
    // 
    // Exemplo 1: Se hoje é terça SEM atividade
    // days: [T,T,T,T,T,T,F] → Contagem = 0 (Ter=false, quebra a sequência no topo)
    // 
    // Exemplo 2: Se hoje é terça COM atividade (mas segunda não)
    // days: [T,T,T,T,T,F,T] → Contagem = 1 (apenas Ter=true, porque Seg=false quebra)
    // 
    // Exemplo 3: Se Segunda e Terça têm atividade (consecutivos até hoje)
    // days: [T,T,T,T,T,T,T] → Contagem = 2+ (Seg=true, Ter=true, e continua...)
    //
    // Regra: Só conta dias CONSECUTIVOS a partir de HOJE voltando no tempo
    // Quando encontra um false, a contagem PARA e reseta
    // 
    // Situação atual: Ontem (segunda, índice 5) NÃO foi realizada tarefa
    // Resultado: Sequência zerada
    days: [false, false, false, false, false, false, false] 
  },
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