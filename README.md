# Orbis - Aplicativo de Rotina e Foco

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

<!--![Orbis Logo](https://via.placeholder.com/150?text=Orbis) <!-- Substitua por um logo real se disponível -->

Orbis é um aplicativo móvel projetado para ajudar usuários a criar, organizar e melhorar suas rotinas diárias de forma sustentável e adaptativa. Em vez de promover a produtividade exaustiva, o app prioriza o bem-estar, ajustando-se às necessidades individuais de sono, foco e tempo livre. Diferente de ferramentas tradicionais que impõem metas rígidas, o Orbis se adapta ao usuário, reconhecendo imprevistos da vida real e focando no progresso constante, não na perfeição.

**Por que Orbis?**  
Em um mundo onde a produtividade frequentemente leva à exaustão, o Orbis oferece uma abordagem humana: planejamento realista com margens de flexibilidade, análise de sono personalizada e gamificação motivadora. Baseado em princípios científicos como ciclos de sono de 90 minutos, o app promove hábitos saudáveis e equilibra recuperação, execução e adaptação.

## Funcionalidades Principais

O Orbis é construído sobre pilares tecnológicos e funcionais para uma experiência integrada:

### 1. Agenda Inteligente (Planejamento Realista)
- **Eventos Fixos**: Compromissos imutáveis (ex.: trabalho das 9h às 17h, aula de espanhol toda terça-feira) com repetição automática em dias da semana ou datas específicas.
- **Eventos Flexíveis**: Atividades reajustáveis (ex.: tempo de estudos, descanso, atividade física), com datas fáceis de editar ou mover.
- **Notificações Inteligentes**: Resumos diários (ex.: "Seu resumo: Trabalho (9h), Estudo Flexível (19h)") e lembretes antecipados (1h antes para eventos importantes), configuráveis para evitar sobrecarga.
- **Margem de Flexibilidade**: Insere automaticamente "espaços em branco" na rotina para lidar com imprevistos.
- **CRUD Completo**: Criar, visualizar, editar e deletar eventos, com integração a calendários externos (ex.: Google Calendar).

### 2. Modo Foco (Execução Gamificada)
- **Tarefas Diárias e Pontuais**: Defina hábitos recorrentes (ex.: estudar 1h, beber água) ou atividades únicas, com notificações personalizadas.
- **Mecanismo de Foco**: Cronômetro personalizável (ex.: 25min de foco + pausa), com validação rigorosa – abandone e registre como "tarefa destruída".
- **Blocos de Foco**: Encoraja trabalho profundo sem microgerenciamento, integrando a eventos flexíveis.
- **Histórico**: Registro de sessões com status (cumprida/destruída) e análise de padrões.

### 3. Gestão Inteligente do Sono (Recuperação)
- **Monitoramento e Análise**: Usa actigrafia acústica (microfone) para rastrear estágios (leve, profundo, REM), duração de ciclos e qualidade geral.
- **Ciclos de Sono**: Baseado em ciclos de 90-110 minutos; planeja horários para maximizar descanso revigorante (ex.: 6h30 de sono de qualidade > 8h fragmentado).
- **Despertador Inteligente**: Acorda suavemente em janela de 30min na fase leve, com sons suaves.
- **Score de Sono**: Fórmula: (Horas × 0.4) + (Ciclos × 0.3) + (Consistência × 0.3); ajusta agenda se score baixo (ex.: blocos mais curtos).
- **Integração com Wearables**: Suporte opcional a dispositivos como Apple Watch ou Fitbit para precisão maior.

### 4. Dashboard (Relatórios e Visualização de Progresso)
- **Conteúdo**: Visões diária, semanal e mensal com gráficos (hipnograma para sono, barras para performance).
- **Métricas**: Tarefas realizadas, tempo de foco, qualidade de sono (score 0-100), progresso de metas, streak de dias de foco.
- **Insights de Tendência**: Análises IA (ex.: "Produtividade alta nas quartas, sono baixo nas sextas – sugira descanso na quinta").
- **Heatmap Semanal**: Visual de picos de foco (estilo GitHub).

### 5. Modo Game XP (Gamificação Opcional)
- **Ativação**: Habilitável no cadastro; transforma rotinas em jogo.
- **Sistema de XP**: +50 por tarefa com hora, +30 por bloco de foco, +20 por registro de sono, +100 bônus diário por 100% de conclusão.
- **Níveis e Tags**: Jornada de 1-100+:
  - Início (1-10): Aprendiz, Explorador, Discípulo, Estudioso, Praticante.
  - Consolidação (11-25): Organizado, Consciente, Determinado, Persistente.
  - Maestria (26-45): Resiliente, Mestre do Foco, Guardião da Rotina, Estrategista.
  - Lenda (46-100+): Visionário, Mentor, Sábio do Tempo, Arquiteto da Vida.
  - Especiais: Senhor dos Ciclos (desenvolvedores/testers), Orbis Supremo (responsáveis pelo projeto).
- **Moedas Virtuais**: Ganhas por dias 100% completos; usadas para customizações (paletas de cores, ícones, sons) ou "salvar streak".
- **Ranking**: Competição com amigos ou global, com ligas de foco.


## Tecnologias e Arquitetura

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

- **Frontend**: ![React Native Badge](https://img.shields.io/badge/-React%20Native-61DAFB?logo=react&logoColor=white&style=flat) com ![Expo Badge](https://img.shields.io/badge/-Expo-000020?logo=expo&logoColor=white&style=flat) para cross-platform (iOS/Android).
- **Backend**: ![Firebase Badge](https://img.shields.io/badge/-Firebase-039BE5?logo=firebase&logoColor=white&style=flat) (Auth para login, Firestore para dados em tempo real, Storage para customizações).
- **Sensores**: Expo AV para áudio (sono), Sensors para acelerômetro.
- **Gráficos**: react-native-chart-kit para hipnogramas e barras.
- **Outras Dependências**: @react-native-community/datetimepicker para pickers, expo-vector-icons para ícones.

### Estrutura do Projeto
```
src/
├── components/
│   ├── Agenda/          # Componentes da Agenda Inteligente
│   ├── Dashboard/       # Métricas e gráficos
│   ├── ModoFoco/        # Cronômetro e tarefas
│   ├── ModoSono/        # Monitoramento e análise de sono
│   ├── Header/          # Cabeçalho fixo com gamificação
│   └── Navbar/          # Barra de navegação inferior
├── data/                # Stubs de dados (ex.: Data_Dashboard.js)
├── hooks/               # Hooks personalizados (ex.: Firebase config)
├── screens/             # Telas principais (Dashboard.js, Agenda.js, etc.)
├── theme/               # Tema global (cores, fontes, espaçamentos)
└── utils/               # Utilitários (ex.: fórmulas de score)
```

## Instalação e Execução

1. Clone o repositório: `git clone https://github.com/seu-usuario/orbis.git`
2. Instale dependências: `npm install` ou `yarn install`
3. Configure Firebase: Adicione chaves em `src/hooks/Firebase.js`
4. Rode o app: `expo start` (use emulador ou dispositivo via Expo Go)
5. Build para produção: `expo build:android` ou `expo build:ios`

**Requisitos**: Node.js 14+, Expo CLI instalado globalmente.

## Contribuição

Contribuições são bem-vindas! Siga estes passos:
1. Fork o repositório.
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request.

Por favor, siga o código de conduta e teste suas mudanças.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE). Para mais detalhes, veja o arquivo LICENSE.

## Contato

- **Desenvolvedores**: Apenas Pedro (joaope14dro@gmail.com)
- **Data de Lançamento**: Fevereiro 2026 (versão beta)

Obrigado por usar o Orbis! Vamos construir rotinas que elevam o bem-estar. 🚀
