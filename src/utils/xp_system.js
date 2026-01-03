/**
 * Sistema de XP e Níveis
 * Nível 1->2: 50 XP
 * Nível 2->3: 50 + (1.5 * 50) = 125 XP
 * Nível 3->4: 125 + (1.5 * 125) = 312.5 XP
 * E assim por diante...
 */

/**
 * Calcula o XP necessário para passar do levelAtual para levelAtual + 1
 * @param {number} currentLevel - O nível atual (1, 2, 3, ...)
 * @returns {number} XP necessário
 */
export const getXpForNextLevel = (currentLevel) => {
  if (currentLevel < 1) return 50;
  
  let xpRequired = 50;
  for (let i = 1; i < currentLevel; i++) {
    xpRequired = xpRequired + xpRequired * 1.5;
  }
  return Math.ceil(xpRequired);
};

/**
 * Calcula o XP total acumulado até o fim de um nível específico
 * @param {number} level - O nível final (1, 2, 3, ...)
 * @returns {number} XP total acumulado
 */
export const getTotalXpForLevel = (level) => {
  if (level <= 0) return 0;
  
  let totalXp = 0;
  for (let i = 1; i <= level; i++) {
    totalXp += getXpForNextLevel(i);
  }
  return Math.ceil(totalXp);
};

/**
 * Calcula o nível atual e progresso baseado no XP total
 * @param {number} totalXp - XP total acumulado
 * @returns {object} { level, currentLevelXp, nextLevelXp, xpForNext, progressPercent }
 */
export const calculateLevelProgress = (totalXp) => {
  if (totalXp < 0) totalXp = 0;
  
  let currentLevel = 1;
  let accumulatedXp = 0;
  
  // Encontra o nível atual
  while (true) {
    const xpNeeded = getXpForNextLevel(currentLevel);
    if (accumulatedXp + xpNeeded > totalXp) {
      break;
    }
    accumulatedXp += xpNeeded;
    currentLevel++;
  }
  
  const xpForNext = getXpForNextLevel(currentLevel);
  const currentLevelXp = totalXp - accumulatedXp;
  const progressPercent = (currentLevelXp / xpForNext) * 100;
  
  return {
    level: currentLevel,
    currentLevelXp: Math.ceil(currentLevelXp),
    nextLevelXp: xpForNext,
    xpForNext: xpForNext - currentLevelXp,
    progressPercent: Math.min(progressPercent, 100),
  };
};

/**
 * Calcula as informações de progresso de forma legível
 * @param {number} totalXp - XP total acumulado
 * @returns {object} Informações formatadas
 */
export const getLevelInfo = (totalXp) => {
  const progress = calculateLevelProgress(totalXp);
  return {
    level: progress.level,
    currentXp: progress.currentLevelXp,
    maxXp: progress.nextLevelXp,
    xpForNext: progress.xpForNext,
    percentage: progress.progressPercent,
    totalXp: Math.ceil(totalXp),
  };
};
