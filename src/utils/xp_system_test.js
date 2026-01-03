/**
 * Exemplos de teste do sistema de XP
 * Descomente para testar no console
 */

import {
  getLevelInfo,
  calculateLevelProgress,
  getXpForNextLevel,
  getTotalXpForLevel,
} from './xp_system';

// ============ TESTE 1: Progresso em diferentes XPs ============
console.log('=== TESTE 1: Progresso em diferentes XPs ===');
const testXps = [0, 50, 100, 175, 250, 488, 1000, 2000];

testXps.forEach((xp) => {
  const info = getLevelInfo(xp);
  console.log(`XP: ${xp}`);
  console.log(`  Nível: ${info.level}`);
  console.log(`  Progresso: ${info.currentXp}/${info.maxXp} (${info.percentage.toFixed(2)}%)`);
  console.log(`  XP para próximo: ${info.xpForNext}`);
  console.log('');
});

// ============ TESTE 2: Calcular XP necessário por nível ============
console.log('=== TESTE 2: XP necessário por nível ===');
for (let i = 1; i <= 10; i++) {
  const xpNeeded = getXpForNextLevel(i);
  const totalUntilLevel = getTotalXpForLevel(i);
  console.log(`Nível ${i}→${i + 1}: ${Math.ceil(xpNeeded)} XP (Total até ${i}: ${Math.ceil(totalUntilLevel)})`);
}

// ============ TESTE 3: Simulação de jogador ============
console.log('=== TESTE 3: Simulação de jogador ===');
const jogador = {
  ferramentas: {
    foco: { nivel: { xpTotal: 300 } },
    sono: { nivel: { xpTotal: 150 } },
    agenda: { nivel: { xpTotal: 50 } },
  },
};

const totalXp =
  (jogador.ferramentas.foco?.nivel?.xpTotal || 0) +
  (jogador.ferramentas.sono?.nivel?.xpTotal || 0) +
  (jogador.ferramentas.agenda?.nivel?.xpTotal || 0);

const info = getLevelInfo(totalXp);
console.log('Dados do jogador:');
console.log(`  Foco: ${jogador.ferramentas.foco.nivel.xpTotal} XP`);
console.log(`  Sono: ${jogador.ferramentas.sono.nivel.xpTotal} XP`);
console.log(`  Agenda: ${jogador.ferramentas.agenda.nivel.xpTotal} XP`);
console.log(`  TOTAL: ${totalXp} XP`);
console.log('');
console.log('Resultado:');
console.log(`  Nível: ${info.level}`);
console.log(`  XP atual no nível: ${info.currentXp}/${info.maxXp}`);
console.log(`  Progresso: ${info.percentage.toFixed(2)}%`);
console.log(`  Faltam ${info.xpForNext} XP para o próximo nível`);

// ============ TESTE 4: Ganho de XP ============
console.log('\n=== TESTE 4: Simulação de ganho de XP ===');
let jogadorXp = 100;
console.log(`Começando com ${jogadorXp} XP`);

for (let i = 0; i < 5; i++) {
  const xpGanho = Math.floor(Math.random() * 100) + 50; // 50-150 XP
  jogadorXp += xpGanho;
  const info = getLevelInfo(jogadorXp);
  console.log(`Ganhou ${xpGanho} XP → Total: ${jogadorXp} XP (Nível ${info.level}, ${info.percentage.toFixed(1)}%)`);
}

export { getLevelInfo, calculateLevelProgress, getXpForNextLevel, getTotalXpForLevel };
