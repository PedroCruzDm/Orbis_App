# Sistema de Níveis e XP - Orbis App

## Visão Geral

O sistema de níveis do Orbis App calcula automaticamente o nível do usuário baseado no XP total acumulado através de todas as ferramentas (Modo Foco, Modo Sono, Agenda).

## Fórmula de Progressão

O XP necessário para upar de nível aumenta progressivamente:

- **Nível 1→2**: 50 XP
- **Nível 2→3**: 50 + (1.5 × 50) = 125 XP
- **Nível 3→4**: 125 + (1.5 × 125) = 312.5 XP
- **Nível N→N+1**: XP_anterior + (1.5 × XP_anterior)

### Exemplos de Progressão:

| Nível | XP Necessário | XP Total Acumulado |
|-------|---------------|--------------------|
| 1→2   | 50            | 50                 |
| 2→3   | 125           | 175                |
| 3→4   | 312.5         | 487.5              |
| 4→5   | 468.75        | 956.25             |
| 5→6   | 703.125       | 1659.375           |

## Como Usar

### 1. Importar as Funções Utilitárias

```javascript
import { 
  getLevelInfo,
  calculateLevelProgress,
  getXpForNextLevel,
  getTotalXpForLevel 
} from '../../utils/xp_system';
```

### 2. Calcular o Nível Atual

```javascript
const totalXp = 500; // XP total do usuário
const levelInfo = getLevelInfo(totalXp);

console.log(levelInfo);
// {
//   level: 3,
//   currentXp: 12,           // XP no nível atual
//   maxXp: 313,              // XP máximo do nível
//   xpForNext: 301,          // XP faltando para próximo nível
//   percentage: 3.83,        // Percentual da barra de progresso
//   totalXp: 500             // Total de XP acumulado
// }
```

### 3. Usar o Componente LevelProgressBar

#### Versão Completa:
```javascript
import LevelProgressBar from '../../components/common/level_progress_bar';

<LevelProgressBar totalXp={500} compact={false} />
```

Exibe:
- Badge com o número do nível
- Barra de progresso visual
- XP atual / XP máximo do nível
- XP faltando para o próximo nível

#### Versão Compacta:
```javascript
<LevelProgressBar totalXp={500} compact={true} />
```

Exibe uma versão mais compacta, ideal para header ou cards.

### 4. Mostrar no Modal de Perfil

O modal de perfil já está integrado com o sistema de XP:

```javascript
import ProfileModal from '../../components/common/profile_modal';

<ProfileModal visible={visible} onClose={onClose} user={user} />
```

A seção de "Nível e XP" será exibida automaticamente calculando o XP total de:
- `user.ferramentas.foco.nivel.xpTotal`
- `user.ferramentas.sono.nivel.xpTotal`
- `user.ferramentas.agenda.nivel.xpTotal`

## Estrutura de Dados do Usuário

O XP está armazenado no Firestore na seguinte estrutura:

```javascript
{
  ferramentas: {
    foco: {
      nivel: {
        nivelAtual: 1,
        xpTotal: 150,      // ← Somado no total
        xpHoje: 25,
        historico: []
      }
    },
    sono: {
      nivel: {
        nivelAtual: 1,
        xpTotal: 200,      // ← Somado no total
        xpHoje: 50,
        historico: []
      }
    },
    agenda: {
      nivel: {
        nivelAtual: 1,
        xpTotal: 100,      // ← Somado no total
        xpHoje: 10,
        historico: []
      }
    }
  }
}
```

**Total XP = 150 + 200 + 100 = 450 XP**

## Funções Disponíveis

### `getLevelInfo(totalXp)`
Retorna informações de nível formatadas para exibição.

**Parâmetros:**
- `totalXp` (number): XP total acumulado

**Retorna:**
```javascript
{
  level: number,           // Nível atual
  currentXp: number,       // XP dentro do nível atual
  maxXp: number,           // XP máximo do nível
  xpForNext: number,       // XP faltando para próximo nível
  percentage: number,      // Percentual (0-100) para barra
  totalXp: number          // Total de XP acumulado
}
```

### `calculateLevelProgress(totalXp)`
Retorna cálculos brutos de progresso.

**Parâmetros:**
- `totalXp` (number): XP total acumulado

**Retorna:**
```javascript
{
  level: number,           // Nível atual
  currentLevelXp: number,  // XP no nível atual
  nextLevelXp: number,     // XP máximo do nível
  xpForNext: number,       // XP faltando
  progressPercent: number  // Percentual (0-100)
}
```

### `getXpForNextLevel(currentLevel)`
Retorna o XP necessário para passar de um nível para o próximo.

**Parâmetros:**
- `currentLevel` (number): Nível atual (1, 2, 3...)

**Retorna:**
- `number`: XP necessário

### `getTotalXpForLevel(level)`
Retorna o XP total acumulado até o fim de um nível específico.

**Parâmetros:**
- `level` (number): Nível desejado (1, 2, 3...)

**Retorna:**
- `number`: XP total acumulado

## Exemplo Completo

```javascript
import { View } from 'react-native';
import LevelProgressBar from '../../components/common/level_progress_bar';
import { getLevelInfo } from '../../utils/xp_system';

export default function MyComponent({ user }) {
  // Calcula XP total
  const totalXp = 
    (user?.ferramentas?.foco?.nivel?.xpTotal || 0) +
    (user?.ferramentas?.sono?.nivel?.xpTotal || 0) +
    (user?.ferramentas?.agenda?.nivel?.xpTotal || 0);

  const levelInfo = getLevelInfo(totalXp);

  return (
    <View>
      {/* Barra de progresso completa */}
      <LevelProgressBar totalXp={totalXp} compact={false} />
      
      {/* Ou versão compacta */}
      <LevelProgressBar totalXp={totalXp} compact={true} />
      
      {/* Ou usar os dados manualmente */}
      <Text>Nível: {levelInfo.level}</Text>
      <Text>XP Total: {levelInfo.totalXp}</Text>
      <Text>Próximo nível: {levelInfo.xpForNext} XP</Text>
    </View>
  );
}
```

## Integração com Modo Foco

Ao adicionar XP nas tarefas do Modo Foco, atualize o banco de dados:

```javascript
// Em modo_foco.jsx
await updateDoc(doc(db, 'Usuarios', uid), {
  'ferramentas.foco.nivel.xpTotal': increment(xpGanho),
  'ferramentas.foco.nivel.xpHoje': increment(xpGanho),
  // ... outros campos
});
```

O sistema calculará automaticamente o nível baseado no XP total.
