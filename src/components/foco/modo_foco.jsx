import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Dimensions } from "react-native";
import { evaluateFocus, formatHMS } from "../../services/evaluator";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase/firebase_config";
import { getUser } from "../../data/user";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";

const isTablet = Dimensions.get("window").width >= 768;

import { focoInitialTasks, focoInitialHistory } from '../../data/data';

export default function Modo_Foco() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // em segundos
  const [result, setResult] = useState(null); // { status, message, xp }
  const [tasks, setTasks] = useState(focoInitialTasks);
  const [taskInput, setTaskInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [history, setHistory] = useState(focoInitialHistory);
  const [pointsToday, setPointsToday] = useState(0);
  const [xpToday, setXpToday] = useState(0);
  const [userUid, setUserUid] = useState(null);
  const timerRef = useRef(null);

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

        setTasks(Array.isArray(tarefas.lista) ? tarefas.lista : []);
        // Prune listas temporárias conforme política
        const pruned = await pruneTemporaryLists(user.uid);
        if (pruned && Array.isArray(pruned.historico)) {
          setHistory(pruned.historico);
        } else {
          setHistory(Array.isArray(tarefas.listaHistorico) ? tarefas.listaHistorico : []);
        }
        setPointsToday(typeof pontos.pontosHoje === "number" ? pontos.pontosHoje : 0);
        setXpToday(typeof nivel.xpHoje === "number" ? nivel.xpHoje : 0);
      } catch (e) {
        // Mantém defaults locais se houver erro
      }
    });
    return () => unsub();
  }, []);

  const onToggle = () => {
    setRunning((v) => !v);
  };

  const onStopAndValidate = async () => {
    setRunning(false);
    const r = evaluateFocus(elapsed);
    setResult(r);
    setElapsed(0); // Reseta o timer após concluir
    
    // Adiciona ao histórico se houver resultado
    if (r) {
      const currentTask = tasks && tasks.length > 0 ? tasks[0] : null;
      const sessionRecord = {
        id: Date.now(),
        title: currentTask ? currentTask.title : "Foco Sem Tarefa",
        // Campos solicitados explicitamente
        titulo: currentTask ? currentTask.title : "Foco Sem Tarefa",
        tempoFoco: formatHMS(elapsed),
        dia: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        xpGerado: r.xp,
        // Campos já existentes para compatibilidade
        timeSpent: formatHMS(elapsed),
        status: r.status,
        xp: r.xp,
        taskId: currentTask ? currentTask.id : null,
        date: new Date().toLocaleString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        timestamp: new Date(),
      };

      setHistory((prev) => [sessionRecord, ...prev]);

      // Salva no Firebase se usuário estiver autenticado
      if (userUid) {
        try {
          const userRef = doc(db, "Usuarios", userUid);
          const updates = {
            "ferramentas.foco.tarefas.listaHistorico": arrayUnion(sessionRecord),
            "ferramentas.foco.nivel.xpHoje": increment(r.xp),
            "ferramentas.foco.nivel.xpTotal": increment(r.xp),
            updatedAt: new Date(),
          };

          // Se falhou, adiciona também à listaFalhada
          if (r.status === 'Falha') {
            updates["ferramentas.foco.tarefas.listaFalhada"] = arrayUnion(sessionRecord);
          }

          // Se parcial (10-20min), adiciona à listaPendente
          if (r.status === 'Parcial') {
            updates["ferramentas.foco.tarefas.listaPendente"] = arrayUnion(sessionRecord);
          }

          // Se sucesso (>=20min), adiciona à listaConcluida e remove da lista principal
          if (r.status === 'Sucesso') {
            updates["ferramentas.foco.tarefas.listaConcluida"] = arrayUnion(sessionRecord);
            if (currentTask) {
              updates["ferramentas.foco.tarefas.lista"] = arrayRemove(currentTask);
            }
          }

          await updateDoc(userRef, updates);

          // Atualiza estado local
          setXpToday((prev) => prev + r.xp);

          // Se sucesso, remove a tarefa concluída da lista local
          if (r.status === 'Sucesso' && currentTask) {
            setTasks((prev) => prev.filter((t) => t.id !== currentTask.id));
          }

          // Após salvar, aplica política de retenção (falhada: 1 semana, histórico: 1 mês)
          const pruned = await pruneTemporaryLists(userUid);
          if (pruned && Array.isArray(pruned.historico)) {
            setHistory(pruned.historico);
          }
        } catch (error) {
          console.error("Erro ao salvar foco no Firebase:", error);
        }
      }
    }
  };

  const onReset = () => {
    setRunning(false);
    setElapsed(0);
    setResult(null);
  };

  const onAddTask = async () => {
    if (taskInput.trim()) {
      const newTask = { id: Date.now(), title: taskInput, durationEstimate: "" };
      setTasks((prev) => [
        ...prev,
        newTask,
      ]);
      // Persiste na lista de tarefas do usuário
      if (userUid) {
        try {
          const userRef = doc(db, "Usuarios", userUid);
          await updateDoc(userRef, {
            "ferramentas.foco.tarefas.lista": arrayUnion(newTask),
            updatedAt: new Date(),
          });
        } catch (e) {
          // silencioso: mantém local mesmo se falhar
        }
      }
      setTaskInput("");
      setShowCreateModal(false);
    }
  };

  const onRemoveTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const TaskPanel = () => (
    <View style={styles.panelContainer}>
      <Text style={styles.panelTitle}>Tarefas Flexíveis</Text>
      <TouchableOpacity style={styles.addTaskBtn} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.addTaskBtnText}>+ Adicionar Tarefa</Text>
      </TouchableOpacity>

      <ScrollView style={styles.taskList}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma tarefa adicionada</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.durationEstimate && (
                  <Text style={styles.taskEstimate}>{task.durationEstimate}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => onRemoveTask(task.id)}>
                <Text style={styles.removeTaskBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const TimerPanel = () => (
    <View style={styles.timerPanelContainer}>
      <Text style={styles.timerTitle}>Cronômetro de Foco</Text>

      <Text style={styles.metricsText}>Pontos Hoje: {pointsToday} • XP Hoje: {xpToday}</Text>

      <View style={styles.timerWrap}>
        <Text style={styles.timerText}>{formatHMS(elapsed)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, running ? styles.btnSecondary : styles.btnPrimary]}
          onPress={onToggle}
        >
          <Text style={styles.btnText}>{running ? "Pausar" : "Iniciar"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAction]} onPress={onStopAndValidate}>
          <Text style={styles.btnText}>Concluir Foco</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onReset}>
          <Text style={styles.btnGhostText}>Resetar</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultBox, result.status === "Sucesso" ? styles.resultSuccess : result.status === "Falha" ? styles.resultFailure : styles.resultPartial]}>
          <Text style={styles.resultTitle}>Resultado: {result.status}</Text>
          <Text style={styles.resultMsg}>{result.message}</Text>
          <Text style={styles.resultXP}>XP: {result.xp > 0 ? `+${result.xp}` : result.xp}</Text>
        </View>
      )}
    </View>
  );

  const HistoryPanel = () => (
    <View style={styles.panelContainer}>
      <Text style={styles.panelTitle}>Histórico de Foco</Text>

      <ScrollView style={styles.historyList}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum registro</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyTime}>{item.timeSpent}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <View style={styles.historyStatus}>
                <Text
                  style={[
                    styles.historyStatusText,
                    item.status === "Sucesso"
                      ? styles.statusSuccess
                      : item.status === "Falha"
                      ? styles.statusFailure
                      : styles.statusPartial,
                  ]}
                >
                  {item.status}
                </Text>
                <Text style={styles.historyXP}>{item.xp > 0 ? `+${item.xp}` : item.xp} XP</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const CreateTaskModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Criar Nova Atividade</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Ex: Estudar Capítulo 3"
          placeholderTextColor="#9CA3AF"
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalBtnCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalBtnSave} onPress={onAddTask}>
            <Text style={styles.modalBtnText}>Salvar Atividade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Modo Foco</Text>

      {isTablet ? (
        <View style={styles.gridLayout}>
          <View style={styles.column}>
            <TaskPanel />
          </View>
          <View style={styles.columnCenter}>
            <TimerPanel />
          </View>
          <View style={styles.column}>
            <HistoryPanel />
          </View>
        </View>
      ) : (
        <ScrollView style={styles.stackedLayout}>
          <TaskPanel />
          <TimerPanel />
          <HistoryPanel />
        </ScrollView>
      )}

      {showCreateModal && <CreateTaskModal />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF8",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },

  // Layout Desktop (Grid 3 colunas)
  gridLayout: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  column: {
    flex: 1,
    minWidth: 250,
  },
  columnCenter: {
    flex: 1.2,
    minWidth: 280,
  },

  // Layout Mobile (Stacked)
  stackedLayout: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // Painel Genérico
  panelContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },

  // Panel de Tarefas
  addTaskBtn: {
    backgroundColor: "#A7727D",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  addTaskBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#E88D67",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  taskEstimate: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  removeTaskBtn: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "700",
  },

  // Panel do Timer
  timerPanelContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  metricsText: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  timerWrap: {
    marginVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 1,
  },
  controls: {
    flexDirection: isTablet ? "column" : "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    flex: isTablet ? 0 : 1,
  },
  btnPrimary: { backgroundColor: "#0EA5A4" },
  btnSecondary: { backgroundColor: "#64748B" },
  btnAction: { backgroundColor: "#E88D67" },
  btnGhost: { backgroundColor: "#F3F4F6" },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  btnGhostText: { color: "#111827", fontWeight: "700", fontSize: 13 },

  resultBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FDFBF8",
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resultSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  resultFailure: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  resultPartial: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  resultTitle: { fontWeight: "800", fontSize: 16, color: "#111827", marginBottom: 6 },
  resultMsg: { color: "#374151", marginBottom: 6, fontSize: 13 },
  resultXP: { fontWeight: "700", color: "#111827", fontSize: 14 },

  // Panel do Histórico
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#A7727D",
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  historyTime: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  historyDate: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  historyStatus: {
    alignItems: "flex-end",
  },
  historyStatusText: {
    fontWeight: "700",
    fontSize: 12,
  },
  statusSuccess: { color: "#22C55E" },
  statusFailure: { color: "#EF4444" },
  statusPartial: { color: "#F59E0B" },
  historyXP: {
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    color: "#111827",
  },

  // Modal de Criação de Tarefa
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalBtnCancelText: {
    color: "#111827",
    fontWeight: "700",
  },
  modalBtnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E88D67",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});