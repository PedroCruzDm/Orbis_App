import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Dimensions, Modal, Alert } from "react-native";
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatHMS } from "../../services/evaluator";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase/firebase_config";
import { getUser } from "../../data/user";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { focoInitialHistory } from '../../data/data';

const FOCUS_CATEGORIES = [ // Categorias de foco com ícones
  { id: 'ler', label: 'Ler', icon: 'book-open-page-variant', color: '#3B82F6' },
  { id: 'estudar', label: 'Estudar', icon: 'school', color: '#8B5CF6' },
  { id: 'praticar', label: 'Praticar', icon: 'dumbbell', color: '#10B981' },
  { id: 'revisar', label: 'Revisar', icon: 'magnify', color: '#F59E0B' },
  { id: 'descanso', label: 'Descanso', icon: 'coffee', color: '#EC4899' },
  { id: 'treinar', label: 'Treinar', icon: 'run', color: '#EF4444' },
  { id: 'assistir', label: 'Assistir', icon: 'monitor', color: '#6366F1' },
];

export default function Modo_Foco() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // em segundos
  const [result, setResult] = useState(null); // { status, message, xp }
  const [currentFocusTaskName, setCurrentFocusTaskName] = useState(""); // Nome da tarefa atual
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [history, setHistory] = useState(focoInitialHistory);
  const [pointsToday, setPointsToday] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [userUid, setUserUid] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [timerMode, setTimerMode] = useState('cronometro'); // 'cronometro' ou 'tempo'
  const [customTime, setCustomTime] = useState(1200); // 20 minutos em segundos
  const [timeInput, setTimeInput] = useState('20');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [daysStreak, setDaysStreak] = useState([]);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const timerRef = useRef(null);

  const formatMMSS = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const sortHistoryRecords = (list = []) => {
    return [...list].sort((a, b) => toDateMs(b.timestamp || b.date || b.id) - toDateMs(a.timestamp || a.date || a.id));
  };

  // Soma XP apenas de sessões concluídas com sucesso (XP positivo)
  const computeTotalFocusXp = (list = []) => {
    return list.reduce((acc, item) => {
      const isSuccess = item?.statusTarefa === 'concluida' || item?.status === 'Sucesso';
      if (!isSuccess) return acc;
      const rawXp = Number(item?.xpGerado ?? item?.xp ?? 0);
      const xp = Number.isFinite(rawXp) ? rawXp : 0;
      return xp > 0 ? acc + xp : acc;
    }, 0);
  };

  // Calcula os dias da semana com tarefas bem-sucedidas
  const computeDaysStreak = (list = []) => {
    const today = new Date();
    const dayIndices = {};
    
    // Preenche os últimos 7 dias a partir de hoje
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dayIndices[dayStr] = i;
    }
    
    const days = Array(7).fill(false);
    list.forEach((item) => {
      const isSuccess = item?.statusTarefa === 'concluida' || item?.status === 'Sucesso';
      if (!isSuccess) return;
      const itemDate = item?.dia || item?.date;
      if (itemDate && dayIndices[itemDate] !== undefined) {
        days[dayIndices[itemDate]] = true;
      }
    });
    
    return days;
  };

  const computeConsecutiveDays = (days = []) => {
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i]) {
        count++;
      } else {
        break; // Para na primeira inatividade (reinicia a contagem)
      }
    }
    return count;
  };

  useEffect(() => {
    if (running && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    }
    if (!running && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    setHistory((prev) => sortHistoryRecords(prev));
  }, []);

  // Util helpers para retenção
  const toDateMs = (ts) => {
    if (!ts) return 0;
    try {
      if (typeof ts.toDate === 'function') return ts.toDate().getTime();
      if (ts instanceof Date) return ts.getTime();
      const d = new Date(ts);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  const pruneTemporaryLists = async (uid) => {
    try {
      const data = await getUser(uid);
      const foco = data?.ferramentas?.foco || {};
      const tarefas = foco?.tarefas || {};

      const historico = Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : [];
      const falhada = Array.isArray(tarefas.listaFalhada) ? tarefas.listaFalhada : [];

      const now = Date.now();
      const cutoffWeek = now - 7 * 24 * 60 * 60 * 1000;
      const cutoffMonth = now - 30 * 24 * 60 * 60 * 1000;

      const historicoFiltered = historico.filter((it) => toDateMs(it.timestamp) >= cutoffMonth);
      const falhadaFiltered = falhada.filter((it) => toDateMs(it.timestamp) >= cutoffWeek);

      const needUpdate = historicoFiltered.length !== historico.length || falhadaFiltered.length !== falhada.length;
      if (needUpdate) {
        await updateDoc(doc(db, 'Usuarios', uid), {
          'ferramentas.foco.tarefas.listaHistorico': historicoFiltered,
          'ferramentas.foco.tarefas.listaFalhada': falhadaFiltered,
          updatedAt: new Date(),
        });
      }
      return { historico: historicoFiltered, falhada: falhadaFiltered };
    } catch (e) {
      return null;
    }
  };

  // Função para recarregar dados do histórico
  const reloadFocusHistory = async (uid) => {
    if (!uid) return;
    try {
      const data = await getUser(uid);
      const foco = data?.ferramentas?.foco || {};
      const tarefas = foco?.tarefas || {};
      const pontos = foco?.pontos || {};
      const nivel = foco?.nivel || {};

      // Prune listas temporárias conforme política
      const pruned = await pruneTemporaryLists(uid);
      const historicoList = pruned && Array.isArray(pruned.historico)
        ? pruned.historico
        : Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : [];

      setHistory(sortHistoryRecords(historicoList));
      const storedXpTotal = typeof nivel.xpTotal === "number" ? nivel.xpTotal : 0;
      const computedXpTotal = computeTotalFocusXp(historicoList);
      setXpTotal(Math.max(storedXpTotal, computedXpTotal));
      const streak = computeDaysStreak(historicoList);
      setDaysStreak(streak);
      setConsecutiveDays(computeConsecutiveDays(streak));
      setPointsToday(typeof pontos.pontosHoje === "number" ? pontos.pontosHoje : 0);
      setXpToday(typeof nivel.xpHoje === "number" ? nivel.xpHoje : 0);
    } catch (e) {
      console.error("Erro ao recarregar histórico:", e);
    }
  };

  // Ao logar, carrega dados de foco do usuário (com defaults 0 se vazio)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserUid(null);
        setXpToday(0);
        setXpTotal(0);
        return;
      }
      setUserUid(user.uid);
      await reloadFocusHistory(user.uid);
    });
    return () => unsub();
  }, []);

  // Recarrega dados quando o modal de histórico é aberto (mas apenas se o timer não estiver rodando)
  useEffect(() => {
    if (showHistoryModal && userUid && !running) {
      reloadFocusHistory(userUid);
    }
  }, [showHistoryModal, userUid]);

  const onStopAndValidate = async () => {
    setRunning(false);
    let validationResult = null;
    
    if (timerMode === 'cronometro') {
      
      // Modo cronômetro: XP (5-10) após 20min; falha se <20min
      const minutes = Math.floor(elapsed / 60);  // Bônus: +2 XP a cada 10 minutos extras
      if (minutes >= 20) {
        const baseXp = Math.floor(Math.random() * 6) + 5; // 5-10
        const extraMinutes = minutes - 20; // Minutos além dos 20 iniciais
        const bonusXp = Math.floor(extraMinutes / 10) * 2; // +2 XP a cada 10 min
        const xpGenerated = baseXp + bonusXp;
        validationResult = {
          status: 'Sucesso',
          message: `Foco Profundo Concluído! Excelente trabalho.${bonusXp > 0 ? ` +${bonusXp} XP bônus!` : ''}`,
          xp: xpGenerated
        };
      } else {
        validationResult = {
          status: 'Falha',
          message: 'Foco Incompleto: O tempo gasto é muito curto para ser considerado foco profundo. Tente novamente!',
          xp: 0
        };
      }
    } else {
      // Modo tempo definido: XP se concluir >= tempo; perda se interromper antes
      if (elapsed >= customTime) {
        const xpGenerated = Math.floor(Math.random() * 6) + 5; // 5-10
        validationResult = {
          status: 'Sucesso',
          message: 'Tempo Completado! Excelente dedicação.',
          xp: xpGenerated
        };
      } else {
        const xpLoss = -(Math.floor(Math.random() * 6) + 5); // -(5-10)
        validationResult = {
          status: 'Falha',
          message: 'Você interrompeu o foco antes de completar o tempo. Tente novamente!',
          xp: xpLoss
        };
      }
    }

    setResult(validationResult);
    setShowResultModal(true);
    const categoryInfo = FOCUS_CATEGORIES.find((cat) => cat.id === selectedCategory);

    // XP que conta para nível (somente sucessos)
    const xpDelta = validationResult?.status === 'Sucesso' ? validationResult.xp : 0;
    let xpApplied = false;
    
    // Adiciona ao histórico se houver resultado
    if (validationResult) {
      const taskName = currentFocusTaskName.trim() || "Foco Sem Nome";
      const sessionRecord = {
        id: Date.now(),
        title: taskName,
        categoriaId: categoryInfo ? categoryInfo.id : "sem-categoria",
        categoriaTitulo: categoryInfo ? categoryInfo.label : "Sem Categoria",
        // Campos solicitados explicitamente
        nomeTarefa: taskName,
        categoria: categoryInfo ? categoryInfo.label : "Sem Categoria",
        tempo: formatHMS(elapsed),
        tempoFoco: formatHMS(elapsed),
        statusTarefa: validationResult.status === 'Sucesso' ? 'concluida' : 'falha',
        dia: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        xpGerado: validationResult.xp,
        // Campos já existentes para compatibilidade
        timeSpent: formatHMS(elapsed),
        status: validationResult.status,
        xp: validationResult.xp,
        taskId: null,
        date: new Date().toLocaleString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        timestamp: new Date(),
      };

      setHistory((prev) => sortHistoryRecords([sessionRecord, ...prev]));

      // Salva no Firebase se usuário estiver autenticado
      if (userUid) {
        try {
          const userRef = doc(db, "Usuarios", userUid);
          const updates = {
            "ferramentas.foco.tarefas.listaHistorico": arrayUnion(sessionRecord),
            "ferramentas.foco.nivel.xpHoje": increment(xpDelta),
            "ferramentas.foco.nivel.xpTotal": increment(xpDelta),
            updatedAt: new Date(),
          };

          // Se falhou, adiciona também à listaFalhada
          if (validationResult.status === 'Falha') {
            updates["ferramentas.foco.tarefas.listaFalhada"] = arrayUnion(sessionRecord);
          }

          // Se sucesso, adiciona à listaConcluida
          if (validationResult.status === 'Sucesso') {
            updates["ferramentas.foco.tarefas.listaConcluida"] = arrayUnion(sessionRecord);
          }

          await updateDoc(userRef, updates);

          // Atualiza estado local apenas quando há XP de sucesso
          setXpToday((prev) => prev + xpDelta);
          setXpTotal((prev) => prev + xpDelta);
          xpApplied = true;

          // Após salvar, aplica política de retenção (falhada: 1 semana, histórico: 1 mês)
          const pruned = await pruneTemporaryLists(userUid);
          if (pruned && Array.isArray(pruned.historico)) {
            setHistory(sortHistoryRecords(pruned.historico));
            setXpTotal(computeTotalFocusXp(pruned.historico));
            const streak = computeDaysStreak(pruned.historico);
            setDaysStreak(streak);
            setConsecutiveDays(computeConsecutiveDays(streak));
          }
        } catch (error) {
          console.error("Erro ao salvar foco:", error);
        }
      }
    }

    // Mesmo offline, aplica XP ao nível local quando sucesso (sem duplicar)
    if (validationResult && !xpApplied && xpDelta > 0) {
      setXpToday((prev) => prev + xpDelta);
      setXpTotal((prev) => prev + xpDelta);
    }
    
    // Reseta timer após 2 segundos
    setTimeout(() => {
      setElapsed(0);
      setCurrentFocusTaskName(""); // Limpa o nome da tarefa
      setShowResultModal(false);
    }, 2000);
  };

  const onReset = () => {
    setRunning(false);
    setElapsed(0);
    setResult(null);
  };

  const onToggle = () => {
    if (timerMode === 'tempo' && !customTime) {
      Alert.alert("Configure o tempo", "Por favor, defina o tempo antes de começar");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Selecione uma categoria", "Por favor, selecione uma categoria para começar");
      return;
    }
    // Se não tiver nome da tarefa, usa a categoria
    if (!currentFocusTaskName.trim()) {
      const categoryLabel = FOCUS_CATEGORIES.find(cat => cat.id === selectedCategory)?.label || "Foco";
      setCurrentFocusTaskName(categoryLabel);
    }
    setRunning((v) => !v);
  };

  const onTimerModeChange = (mode) => {
    if (running) {
      Alert.alert("Pausar timer", "Pause o cronômetro antes de alterar o modo");
      return;
    }
    setTimerMode(mode);
    setElapsed(0);
  };

  const onSetCustomTime = () => {
    const minutes = parseInt(timeInput, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert("Tempo inválido", "Digite um número maior que 0");
      return;
    }
    setCustomTime(minutes * 60);
    setShowTimeModal(false);
  };

  const currentCategory = FOCUS_CATEGORIES.find((cat) => cat.id === selectedCategory);
  const sortedHistory = sortHistoryRecords(history);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
  
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Modo Foco</Text>
            <Text style={styles.headerSubtitle}>Concentre-se no que realmente importa</Text>
          </View>
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.timerActionGroup}>
              <TouchableOpacity style={styles.headerIconButton}
                onPress={() => setShowHelpModal(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.headerIconButton}
                onPress={() => setShowHistoryModal(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="history" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
              <View style={styles.timerModeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, timerMode === 'cronometro' && styles.modeButtonActive]}
            onPress={() => onTimerModeChange('cronometro')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeButtonText, timerMode === 'cronometro' && styles.modeButtonTextActive]}>
              Cronômetro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, timerMode === 'tempo' && styles.modeButtonActive]}
            onPress={() => onTimerModeChange('tempo')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeButtonText, timerMode === 'tempo' && styles.modeButtonTextActive]}>
              Tempo Definido
            </Text>
          </TouchableOpacity>
        </View>

          <View style={styles.timerCircle}>
            {/* Circular progress */}
            {(() => {
              const size = 220;
              const strokeWidth = 10;
              const radius = (size - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;
              const total = timerMode === 'tempo' ? customTime : 1500; // 25min padrão para cronômetro
              const effectiveElapsed = timerMode === 'tempo' ? Math.min(elapsed, customTime) : elapsed % total;
              const pct = Math.max(0, Math.min(100, Math.round((effectiveElapsed / total) * 100)));
              const dashOffset = circumference - (pct / 100) * circumference;
              const label = selectedCategory === 'descanso' ? 'Pausa Curta' : (currentFocusTaskName?.trim() || (currentCategory?.label || 'Foco'));
              const timeText = timerMode === 'tempo'
                ? (elapsed >= customTime ? `+${formatMMSS(elapsed - customTime)}` : formatMMSS(customTime - elapsed))
                : (elapsed >= 3600 ? formatHMS(elapsed) : formatMMSS(elapsed));
              return (
                <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={size} height={size} style={styles.timerSvg}>
                    <Circle cx={size/2} cy={size/2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
                    <Circle
                      cx={size/2}
                      cy={size/2}
                      r={radius}
                      stroke="#10B981"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform={`rotate(-270 ${size/2} ${size/2})`}
                    />
                  </Svg>
                  <View style={styles.timerCenter}> 
                    <Text style={[styles.timerValueText, elapsed >= 3600 && { fontSize: 40 }]} numberOfLines={1} adjustsFontSizeToFit>
                      {timeText}
                    </Text>
                    <Text style={styles.timerLabelText}>{label}</Text>
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Dots + sessões hoje */}
          {(() => {
            const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const sessionsToday = history.filter(h => (h.dia || h.date || '').includes(todayStr)).length;
            const dots = 5;
            return (
              <View style={styles.sessionsRow}> 
                <View style={styles.dotsRow}>
                  {Array.from({ length: dots }, (_, i) => (
                    <View key={`dot-${i}`} style={[styles.dot, i < Math.min(sessionsToday, dots) && styles.dotActive]} />
                  ))}
                </View>
                <Text style={styles.sessionsText}>{sessionsToday} sessões hoje</Text>
              </View>
            );
          })()}
          {running && currentCategory && (
            <View style={styles.activeCategoryPill}>
              <MaterialCommunityIcons name={currentCategory.icon} size={16} color="#0EA5A4" />
              <Text style={styles.activeCategoryText}>{currentCategory.label}</Text>
            </View>
          )}
        </View>

        {/* Task Name Input */}
        {!running && (
          <View style={styles.taskNameSection}>
            <Text style={styles.taskNameLabel}>Nome da Tarefa (Opcional):</Text>
            <TextInput
              style={styles.taskNameInput}
              placeholder="Digite o nome da tarefa..."
              placeholderTextColor="#9CA3AF"
              value={currentFocusTaskName}
              onChangeText={setCurrentFocusTaskName}
              editable={!running}
            />
            {currentFocusTaskName.trim() === '' && selectedCategory && (
              <Text style={styles.taskNameHint}>
                Se não preenchido, será usado: "{FOCUS_CATEGORIES.find(cat => cat.id === selectedCategory)?.label || 'Foco'}"
              </Text>
            )}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.btnStart} onPress={onToggle} activeOpacity={0.7}>
            <MaterialCommunityIcons name={running ? "pause" : "play"} size={20} color="#fff" />
            <Text style={styles.btnStartText}>{running ? "Pausar" : "Iniciar"}</Text>
          </TouchableOpacity>
          {timerMode === 'tempo' && !running && (
            <TouchableOpacity style={styles.btnTime} onPress={() => setShowTimeModal(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="clock-edit-outline" size={20} color="#fff" />
              <Text style={styles.btnTimeText}>{Math.floor(customTime / 60)}m</Text>
            </TouchableOpacity>
          )}
          {running && (
            <TouchableOpacity style={styles.btnStop} onPress={onStopAndValidate} activeOpacity={0.7}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.btnStopText}>Concluir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Drag hint */}
        <Text style={styles.dragHint}>Arraste uma categoria aqui para começar</Text>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoryTitle}>Selecione uma categoria:</Text>
          <View style={styles.categoryGrid}>
            {FOCUS_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={28}
                  color={selectedCategory === cat.id ? '#fff' : cat.color}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Modal de Histórico de Tarefas */}
      <Modal visible={showHistoryModal} transparent animationType="fade">
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyModalHeader}>
              <View>
                <Text style={styles.historyModalTitle}>Histórico de Tarefas</Text>
                <Text style={styles.historyModalSubtitle}>{history.length} {history.length === 1 ? 'sessão registrada' : 'sessões registradas'}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowHistoryModal(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {history && history.length > 0 ? (
              <FlatList
                data={sortedHistory}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.historyListContent}
                renderItem={({ item }) => {
                  const statusLabel = item.statusTarefa === 'concluida' ? 'Concluída' : 
                    item.statusTarefa === 'pendente' ? 'Pendente' : 
                    item.statusTarefa === 'falha' ? 'Falha' : 
                    (item.status === 'Sucesso' ? 'Concluída' : 
                    item.status === 'Parcial' ? 'Pendente' : 'Falha');
                  
                  const isSuccess = item.statusTarefa === 'concluida' || item.status === 'Sucesso';
                  const isFailed = item.statusTarefa === 'falha' || item.status === 'Falha';
                  
                  const categoryInfo = FOCUS_CATEGORIES.find(
                    cat => cat.id === item.categoriaId || cat.label === item.categoria
                  );
                  
                  return (
                    <View style={styles.historyCard}>
                      {/* Icon & Category */}
                      <View style={styles.historyCardHeader}>
                        <View style={[
                          styles.categoryIconContainer,
                          { backgroundColor: categoryInfo?.color ? `${categoryInfo.color}15` : '#F3F4F6' }
                        ]}>
                          <MaterialCommunityIcons 
                            name={categoryInfo?.icon || 'bookmark-outline'} 
                            size={20} 
                            color={categoryInfo?.color || '#9CA3AF'} 
                          />
                        </View>
                        <View style={styles.historyCardHeaderText}>
                          <Text style={styles.historyCardTitle} numberOfLines={1}>
                            {item.nomeTarefa || item.titulo || item.title || 'Tarefa sem nome'}
                          </Text>
                          <Text style={styles.historyCardCategory}>
                            {item.categoria || item.categoriaTitulo || 'Sem categoria'}
                          </Text>
                        </View>
                      </View>

                      {/* Info Row */}
                      <View style={styles.historyCardInfo}>
                        <View style={styles.infoItem}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                          <Text style={styles.infoText}>{item.tempo || item.tempoFoco || item.timeSpent}</Text>
                        </View>
                        <View style={styles.infoItem}>
                          <MaterialCommunityIcons name="calendar-outline" size={14} color="#6B7280" />
                          <Text style={styles.infoText}>{item.dia || item.date}</Text>
                        </View>
                      </View>

                      {/* Footer: Status & XP */}
                      <View style={styles.historyCardFooter}>
                        <View style={[
                          styles.statusBadge,
                          isSuccess && styles.statusBadgeSuccess,
                          isFailed && styles.statusBadgeFail
                        ]}>
                          <MaterialCommunityIcons 
                            name={isSuccess ? 'check-circle' : isFailed ? 'close-circle' : 'alert-circle'} 
                            size={12} 
                            color={isSuccess ? '#059669' : isFailed ? '#DC2626' : '#D97706'} 
                          />
                          <Text style={[
                            styles.statusBadgeText,
                            isSuccess && styles.statusBadgeTextSuccess,
                            isFailed && styles.statusBadgeTextFail
                          ]}>
                            {statusLabel}
                          </Text>
                        </View>
                        <View style={styles.xpBadge}>
                          <MaterialCommunityIcons 
                            name="star-circle" 
                            size={16} 
                            color={isSuccess ? '#10B981' : '#EF4444'} 
                          />
                          <Text style={[
                            styles.xpBadgeText,
                            isSuccess && styles.xpBadgeTextPositive
                          ]}>
                            {(item.xpGerado || item.xp) > 0 ? '+' : ''}{item.xpGerado || item.xp} XP
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyHistory}>
                <View style={styles.emptyHistoryIcon}>
                  <MaterialCommunityIcons name="history" size={56} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyHistoryTitle}>Nenhuma tarefa registrada</Text>
                <Text style={styles.emptyHistoryText}>
                  Complete uma sessão de foco para ver seu histórico aqui
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal - Como Funciona */}
      <Modal visible={showHelpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Como Funciona?</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpContent} showsVerticalScrollIndicator={false}>
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>O Que é Foco?</Text>
                <Text style={styles.helpSectionText}>
                  Foco é a capacidade de direcionar sua atenção para uma tarefa específica, ignorando distrações. É uma habilidade treinável influenciada por sono, nutrição e ambiente.
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Benefícios do Foco</Text>
                <Text style={styles.helpSectionText}>
                  • Produtividade: Aumenta eficiência em até 25%{'\n'}
                  • Saúde: Melhora cognição, humor e energia{'\n'}
                  • Bem-estar: Reduz estresse e ansiedade{'\n'}
                  • Realização: Cria motivação positiva
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Dicas para Melhorar o Foco</Text>
                <Text style={styles.helpSectionText}>
                  • Técnica Pomodoro: Blocos de 25 min + pausas{'\n'}
                  • Meditação: 10-15 min diários{'\n'}
                  • Exercício: 150 min de atividade aeróbica/semana{'\n'}
                  • Ambiente: Espaço organizado, sem distrações{'\n'}
                  • Sono: 7-9 horas por noite{'\n'}
                  • Metas: 3-5 objetivos diários
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Ferramentas do Modo Foco</Text>
                <Text style={styles.helpSectionText}>
                  O Modo Foco oferece várias ferramentas para ajudar você a se concentrar e acompanhar seu progresso:
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>📱 Modo Cronômetro</Text>
                <Text style={styles.helpSectionText}>
                  Cronômetro livre onde você pode focar o tempo que quiser. Ao concluir com 20 minutos ou mais, você ganha 5-10 XP. Se falhar (menos de 20 minutos), ganha 0 XP.{'\n\n'}
                  • Ideal para: Sessões flexíveis e adaptáveis{'\n'}
                  • Mínimo: 20 minutos para ganhar XP{'\n'}
                  • Recompensa: 5-10 XP por sucesso
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>⏱️ Modo Tempo Definido</Text>
                <Text style={styles.helpSectionText}>
                  Você define um tempo específico. Se completar o tempo, ganha 5-10 XP. Se interromper antes, perde 5-10 XP.{'\n\n'}
                  • Ideal para: Sessões estruturadas e metas claras{'\n'}
                  • Penalidade: -5 a -10 XP por interrupção{'\n'}
                  • Recompensa: 5~10 XP ao completar + tempo extra em destaque
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>🏷️ Categorias</Text>
                <Text style={styles.helpSectionText}>
                  Classifique suas sessões em categorias para melhor organização:{'\n'}
                  • Ler: Para leitura e estudos de textos{'\n'}
                  • Estudar: Para aprendizado e aulas{'\n'}
                  • Praticar: Para exercícios e treinos{'\n'}
                  • Revisar: Para revisão de conteúdo{'\n'}
                  • Descanso: Para atividades relaxantes{'\n'}
                  • Treinar: Para atividades físicas{'\n'}
                  • Assistir: Para vídeos e conteúdo visual
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>📊 Histórico de Tarefas</Text>
                <Text style={styles.helpSectionText}>
                  Visualize todas as suas sessões de foco concluídas. O histórico mostra:{'\n'}
                  • Nome e categoria da tarefa{'\n'}
                  • Tempo investido{'\n'}
                  • Status (Concluída, Pendente, Falha){'\n'}
                  • XP ganho ou perdido{'\n'}
                  • Data e hora da sessão
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Categorias</Text>
                <Text style={styles.helpSectionText}>
                  Selecione uma categoria (Ler, Estudar, Praticar, Revisar, Descanso, Treinar, Assistir) para organizar suas sessões de foco.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalBtnConfirm}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.modalBtnConfirmText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal - Configurações  EM BREVE   */}
      <Modal visible={showSettingsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Preferências</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Notificações</Text>
                  <TouchableOpacity style={styles.settingToggle}>
                    <MaterialCommunityIcons name="toggle-switch-off-outline" size={28} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Som de Conclusão</Text>
                  <TouchableOpacity style={styles.settingToggle}>
                    <MaterialCommunityIcons name="toggle-switch-off-outline" size={28} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtnConfirm, { paddingVertical: 16, marginTop: 8 }]}
              onPress={() => setShowSettingsModal(false)}
              accessibilityLabel="Salvar alterações de foco"
              testID="btn-salvar-alteracoes"
            >
              <Text style={styles.modalBtnConfirmText}>Salvar alterações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal - Selecionar Tempo */}
      <Modal visible={showTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Definir Tempo</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                placeholder="Digite minutos"
                placeholderTextColor="#9CA3AF"
                value={timeInput}
                onChangeText={setTimeInput}
                keyboardType="numeric"
              />
              <Text style={styles.timeInputLabel}>minutos</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={onSetCustomTime}>
                <Text style={styles.modalBtnConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Resultado */}
      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContent}>
            <View style={[
              styles.resultCard,
              result?.status === 'Sucesso' && styles.resultCardSuccess,
              result?.status === 'Falha' && styles.resultCardFail
            ]}>
              <MaterialCommunityIcons
                name={result?.status === 'Sucesso' ? 'check-circle' : 'alert-circle'}
                size={56}
                color={result?.status === 'Sucesso' ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.resultStatus}>{result?.status}</Text>
              <Text style={styles.resultMessage}>{result?.message}</Text>
              <View style={styles.resultXpContainer}>
                <Text style={[styles.resultXpValue, result?.xp > 0 && styles.resultXpPositive]}>
                  {result?.xp > 0 ? '+' : ''}{result?.xp} XP
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 2.5,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerButtonsGroup: {
    flexDirection: "row",
    gap: 8,
    marginTop: -8,
    marginRight: -8,
  },
  timerActionGroup: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-end",
    marginRight: 4,
    marginBottom: 8,
  },
  headerIconButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  timerModeToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    backgroundColor: "#FFF",
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modeButtonActive: {
    backgroundColor: "#0EA5A4",
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  modeButtonTextActive: {
    color: "#FFF",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 28,
    backgroundColor: "#FFF",
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timerCircle: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  timerSvg: { position: 'absolute' },
  timerCenter: { alignItems: 'center', justifyContent: 'center' },
  timerValueText: {
    fontSize: 46,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "monospace",
    textAlign: "center",
    includeFontPadding: false,
  },
  timerLabelText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  timerCountdown: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  activeCategoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#E0F2F1",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  activeCategoryText: {
    color: "#0EA5A4",
    fontWeight: "700",
    fontSize: 13,
  },
  taskNameSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  taskNameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  taskNameInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  taskNameHint: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  roundControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 12, marginBottom: 8 },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  roundBtnPrimary: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  roundBtnPrimaryActive: { backgroundColor: '#6366F1' },
  sessionsRow: { alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#6EE7B7' },
  sessionsText: { fontSize: 12, color: '#6B7280' },
  btnStart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnStartText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  btnTime: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#F59E0B",
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnTimeText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  btnStop: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0EA5A4",
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnStopText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  dragHint: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 24,
    fontStyle: "italic",
  },
  streakSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  streakMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
    marginTop: 8,
    textAlign: "center",
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "31%",
    aspectRatio: 0.95,
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardActive: {
    backgroundColor: "#0EA5A4",
    borderColor: "#0EA5A4",
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 8,
    textAlign: "center",
  },
  categoryLabelActive: {
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalBtnConfirm: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0EA5A4",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  helpContent: {
    marginBottom: 16,
    maxHeight: 300,
  },
  helpSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  helpSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  helpSectionText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  settingsScrollContent: {
    marginBottom: 16,
    maxHeight: 400,
  },
  settingSection: {
    marginBottom: 20,
    paddingBottom: 16,
  },
  settingSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  settingToggle: {
    padding: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  resultModalContent: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resultCardSuccess: {
    backgroundColor: "#F0FDF4",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  resultCardFail: {
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  resultXpContainer: {
    marginTop: 12,
  },
  resultXpValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#EF4444",
  },
  resultXpPositive: {
    color: "#10B981",
  },
  historyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  historyModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "92%",
    maxHeight: "75%",
    paddingTop: 20,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  historyModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  historyModalSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  historyListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  historyCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCardHeaderText: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  historyCardCategory: {
    fontSize: 12,
    color: "#6B7280",
  },
  historyCardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  historyCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
  },
  statusBadgeSuccess: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeFail: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  statusBadgeTextSuccess: {
    color: "#059669",
  },
  statusBadgeTextFail: {
    color: "#DC2626",
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },
  xpBadgeTextPositive: {
    color: "#10B981",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyHistoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});