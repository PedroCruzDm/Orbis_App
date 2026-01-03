import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Dimensions, Modal, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatHMS } from "../../services/evaluator";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase/firebase_config";
import { getUser } from "../../data/user";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { focoInitialHistory } from '../../data/data';

const isTablet = Dimensions.get("window").width >= 768;
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
  const [currentFocusTaskName, setCurrentFocusTaskName] = useState(""); // Nome da tarefa atual durante foco
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [history, setHistory] = useState(focoInitialHistory);
  const [pointsToday, setPointsToday] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [userUid, setUserUid] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [timerMode, setTimerMode] = useState('cronometro'); // 'cronometro' ou 'tempo'
  const [customTime, setCustomTime] = useState(1200); // 20 minutos em segundos
  const [timeInput, setTimeInput] = useState('20');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const timerRef = useRef(null);

  const sortHistoryRecords = (list = []) => {
    return [...list].sort((a, b) => toDateMs(b.timestamp || b.date || b.id) - toDateMs(a.timestamp || a.date || a.id));
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

  // Ao logar, carrega dados de foco do usuário (com defaults 0 se vazio)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserUid(null);
        return;
      }
      setUserUid(user.uid);
      try {
        const data = await getUser(user.uid);
        const foco = data?.ferramentas?.foco || {};
        const tarefas = foco?.tarefas || {};
        const pontos = foco?.pontos || {};
        const nivel = foco?.nivel || {};

        // Prune listas temporárias conforme política
        const pruned = await pruneTemporaryLists(user.uid);
        if (pruned && Array.isArray(pruned.historico)) {
          setHistory(sortHistoryRecords(pruned.historico));
        } else {
          setHistory(sortHistoryRecords(Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : []));
        }
        setPointsToday(typeof pontos.pontosHoje === "number" ? pontos.pontosHoje : 0);
        setXpToday(typeof nivel.xpHoje === "number" ? nivel.xpHoje : 0);
      } catch (e) {
        // Mantém defaults locais se houver erro
      }
    });
    return () => unsub();
  }, []);

  const onStopAndValidate = async () => {
    setRunning(false);
    
    let validationResult = null;
    
    if (timerMode === 'cronometro') {
      // Modo cronômetro: XP (5-10) após 20min; falha se <20min
      const minutes = Math.floor(elapsed / 60);
      if (minutes >= 20) {
        const xpGenerated = Math.floor(Math.random() * 6) + 5; // 5-10
        validationResult = {
          status: 'Sucesso',
          message: 'Foco Profundo Concluído! Excelente trabalho.',
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
            "ferramentas.foco.nivel.xpHoje": increment(validationResult.xp),
            "ferramentas.foco.nivel.xpTotal": increment(validationResult.xp),
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

          // Atualiza estado local
          setXpToday((prev) => prev + validationResult.xp);

          // Após salvar, aplica política de retenção (falhada: 1 semana, histórico: 1 mês)
          const pruned = await pruneTemporaryLists(userUid);
          if (pruned && Array.isArray(pruned.historico)) {
            setHistory(sortHistoryRecords(pruned.historico));
          }
        } catch (error) {
          console.error("Erro ao salvar foco no Firebase:", error);
        }
      }
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

        {/* Timer Mode Toggle */}


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
                    onPress={() => setShowSettingsModal(true)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="cog-outline" size={24} color="#9CA3AF" />
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
            {timerMode === 'cronometro' ? (
              <Text style={styles.timerText}>
                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              </Text>
            ) : (
              <View style={styles.timerCountdown}>
                {elapsed >= customTime ? (
                  <>
                    <Text style={[styles.timerText, { color: '#10B981', fontSize: 40 }]} numberOfLines={1}>
                      +{String(Math.floor((elapsed - customTime) / 60)).padStart(2, '0')}:{String((elapsed - customTime) % 60).padStart(2, '0')}
                    </Text>
                    <Text style={styles.timerSubtext}>tempo extra</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.timerText}>
                      {String(Math.floor((customTime - elapsed) / 60)).padStart(2, '0')}:{String((customTime - elapsed) % 60).padStart(2, '0')}
                    </Text>
                    <Text style={styles.timerSubtext}>de {Math.floor(customTime / 60)} min</Text>
                  </>
                )}
              </View>
            )}
          </View>
          {running && currentCategory && (
            <View style={styles.activeCategoryPill}>
              <MaterialCommunityIcons name={currentCategory.icon} size={16} color="#0EA5A4" />
              <Text style={styles.activeCategoryText}>{currentCategory.label}</Text>
            </View>
          )}
        </View>

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
              <Text style={styles.historyModalTitle}>Histórico de Tarefas</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {history && history.length > 0 ? (
              <FlatList
                data={sortedHistory}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator
                contentContainerStyle={styles.historyListContent}
                renderItem={({ item }) => {
                  const statusLabel = item.statusTarefa === 'concluida' ? 'Concluída' : 
                                     item.statusTarefa === 'pendente' ? 'Pendente' : 
                                     item.statusTarefa === 'falha' ? 'Falha' : 
                                     (item.status === 'Sucesso' ? 'Concluída' : 
                                      item.status === 'Parcial' ? 'Pendente' : 'Falha');
                  
                  const statusColor = item.statusTarefa === 'concluida' || item.status === 'Sucesso' ? '#10B981' :
                                     item.statusTarefa === 'pendente' || item.status === 'Parcial' ? '#F59E0B' : '#EF4444';
                  
                  return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyItemLeft}>
                      <View style={[
                        styles.historyStatusIndicator,
                        { backgroundColor: statusColor }
                      ]} />
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle} numberOfLines={1}>
                          {item.nomeTarefa || item.titulo || item.title || 'Tarefa sem nome'}
                        </Text>
                        <Text style={styles.historyItemCategory}>
                          {item.categoria || item.categoriaTitulo || 'Sem categoria'} • {item.tempo || item.tempoFoco || item.timeSpent}
                        </Text>
                        <View style={styles.historyItemMeta}>
                          <Text style={styles.historyItemDate}>
                            {item.dia || item.date}
                          </Text>
                          <Text style={[styles.historyItemStatus, { color: statusColor }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyItemXp}>+{item.xpGerado || item.xp}xp</Text>
                    </View>
                  </View>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyHistory}>
                <MaterialCommunityIcons name="history" size={48} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>Nenhuma tarefa completada</Text>
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
                <Text style={styles.helpSectionTitle}>Modo Cronômetro</Text>
                <Text style={styles.helpSectionText}>
                  Cronômetro livre onde você pode focar o tempo que quiser. Ao concluir com 20 minutos ou mais, você ganha 5-10 XP. Se falhar (menos de 20 minutos), ganha 0 XP.
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Modo Tempo Definido</Text>
                <Text style={styles.helpSectionText}>
                  Você define um tempo específico. Se completar o tempo, ganha 5-10 XP. Se interromper antes, perde 5-10 XP.
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>XP e Recompensas</Text>
                <Text style={styles.helpSectionText}>
                  • Sucesso: +5 a +10 XP{'\n'}
                  • Falha: 0 XP (cronômetro) ou -5 a -10 XP (tempo definido){'\n'}
                  • XP acumula diariamente e conta para seu nível
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

      {/* Modal - Configurações */}
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
    width: 190,
    height: 190,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1F2937",
    fontFamily: "monospace",
    textAlign: "center",
    includeFontPadding: false,
  },
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
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
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
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0EA5A4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirmText: {
    fontSize: 15,
    fontWeight: "600",
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
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  historyListContent: {
    paddingBottom: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  historyStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  statusSuccess: {
    backgroundColor: "#10B981",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
});