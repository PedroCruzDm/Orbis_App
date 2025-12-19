import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Dimensions } from "react-native";
import { evaluateFocus, formatHMS } from "../rules/evaluator";

const isTablet = Dimensions.get("window").width >= 768;

import { focoInitialTasks, focoInitialHistory } from '../../../hooks/Users/data';

export default function Modo_Foco() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // em segundos
  const [result, setResult] = useState(null); // { status, message, xp }
  const [tasks, setTasks] = useState(focoInitialTasks);
  const [taskInput, setTaskInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [history, setHistory] = useState(focoInitialHistory);
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

  const onToggle = () => {
    setRunning((v) => !v);
  };

  const onStopAndValidate = () => {
    setRunning(false);
    const r = evaluateFocus(elapsed);
    setResult(r);
    
    // Adiciona ao histórico se houver resultado
    if (r) {
      setHistory((prev) => [
        {
          id: Date.now(),
          title: tasks.length > 0 ? tasks[0]?.title : "Foco Sem Tarefa",
          timeSpent: formatHMS(elapsed),
          status: r.status,
          xp: r.xp,
          date: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  };

  const onReset = () => {
    setRunning(false);
    setElapsed(0);
    setResult(null);
  };

  const onAddTask = () => {
    if (taskInput.trim()) {
      setTasks((prev) => [
        ...prev,
        { id: Date.now(), title: taskInput, durationEstimate: "" },
      ]);
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