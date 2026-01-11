// Central data store for app modules (Dashboard, Agenda, Modo Foco, Modo Sono)
// Dashboard data
export const dashboardSleepScoreToday = 72;
export const dashboardStats = [
	{ key: 'prod', title: 'Produtividade', value: 12, max: 20, description: 'Hoje', type: 'gauge' },
	{ key: 'foco', title: 'Tempo de Foco', value: 180, max: 240, description: 'minutos hoje', type: 'gauge' },
	{ key: 'dias', title: 'Dias Consecutivos', value: 0, max: 7, description: 'Sequência ativa', type: 'days', days: [false, false, false, false, false, false, false] },
];

export const dashboardRecent = [
	{ id: 1, title: 'Sessão de foco concluída', time: '14:30', duration: '45 min' },
	{ id: 2, title: 'Relatório mensal finalizado', time: '13:15', duration: '30 min' },
	{ id: 3, title: 'Planejamento do dia', time: '09:30', duration: '15 min' },
];

export const dashboardWeekly = {
	focusMinutes: 930,
	avgSleepScore: 78,
	avgSleepEfficiency: 85,
	weeklyXP: 520,
	streakDays: 6,
};

export const dashboardWeeklyDays = [
	{ label: 'Seg', focusMinutes: 120, sleepScore: 80 },
	{ label: 'Ter', focusMinutes: 150, sleepScore: 82 },
	{ label: 'Qua', focusMinutes: 180, sleepScore: 88 },
	{ label: 'Qui', focusMinutes: 160, sleepScore: 76 },
	{ label: 'Sex', focusMinutes: 140, sleepScore: 68 },
	{ label: 'Sáb', focusMinutes: 100, sleepScore: 74 },
	{ label: 'Dom', focusMinutes: 80, sleepScore: 70 },
];

export const dashboardWeeklyTargetFocusMinutes = 1200;

// Agenda initial data
export const agendaInitialFixedCommitments = [
	{ id: 1, title: 'Trabalho', type: 'Trabalho', startTime: '09:00', duration: 480, recurrence: 'Diário', status: 'Pending' },
	{ id: 2, title: 'Reunião com Equipe', type: 'Trabalho', startTime: '14:00', duration: 60, recurrence: 'Semanal', status: 'Pending' },
];

export const agendaInitialFlexibleTasks = [
	{ id: 101, title: 'Estudar Capítulo 5', estimatedDuration: 120, priority: 'HIGH', preferredSlot: 'AFTERNOON', status: 'Undated' },
	{ id: 102, title: 'Projeto Pessoal', estimatedDuration: 90, priority: 'MEDIUM', preferredSlot: 'EVENING', status: 'Undated' },
];

export const agendaInitialEssentialActivities = [
	{ id: 201, title: 'Almoço', duration: 60, timeSlot: '11:30-13:00' },
	{ id: 202, title: 'Café da Manhã', duration: 30, timeSlot: '07:00-07:30' },
	{ id: 203, title: 'Jantar', duration: 45, timeSlot: '18:30-19:15' },
];

export const agendaInitialFocusBlocks = [
	{ id: 301, title: 'Foco: Estudar Capítulo 5', startTime: '15:00', duration: 120, task: 'Estudar Capítulo 5', status: 'Pending' },
	{ id: 302, title: 'Foco: Projeto Pessoal', startTime: '19:30', duration: 90, task: 'Projeto Pessoal', status: 'Pending' },
];

// Modo Sono weekly data feeding charts
export const sleepWeeklyData = [
	{ day: 'Seg', hours: 7.5, score: 78, deepPct: 18, cycles: 4 },
	{ day: 'Ter', hours: 6.8, score: 70, deepPct: 16, cycles: 3 },
	{ day: 'Qua', hours: 8.1, score: 85, deepPct: 20, cycles: 4 },
	{ day: 'Qui', hours: 7.0, score: 74, deepPct: 17, cycles: 3 },
	{ day: 'Sex', hours: 6.5, score: 68, deepPct: 15, cycles: 3 },
	{ day: 'Sáb', hours: 8.3, score: 88, deepPct: 22, cycles: 5 },
	{ day: 'Dom', hours: 7.9, score: 82, deepPct: 19, cycles: 4 },
];

// Modo Foco defaults (if needed)
export const focoInitialTasks = [];
export const focoInitialHistory = [];