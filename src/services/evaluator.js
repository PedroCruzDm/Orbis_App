// Avaliador baseado em tempo de foco
// Regras:
// - Abaixo de 10min (600s): perde 5 XP
// - Entre 10-20min (600s-1200s): neutro, 0 XP
// - Acima de 20min (1200s): ganha XP positivo

export const THRESHOLDS = {
  minSuccess: 1200, // 20 minutos - ganha XP
  minNeutral: 600,  // 10 minutos - não ganha nem perde
};

export function evaluateFocus(seconds) {
  const t = Math.max(0, Math.floor(seconds || 0));

  if (t < THRESHOLDS.minNeutral) {
    return {
      status: 'Falha',
      message:
        'Foco Incompleto: O tempo é muito curto. Tente novamente!',
      xp: -5,
    };
  }

  if (t >= THRESHOLDS.minSuccess) {
    return {
      status: 'Sucesso',
      message: 'Foco Profundo Concluído! Excelente trabalho.',
      xp: +30,
    };
  }

  return {
    status: 'Parcial',
    message:
      'Foco Parcial: Você se dedicou, mas tente estender o foco para ganhar XP.',
    xp: 0,
  };
}

export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
