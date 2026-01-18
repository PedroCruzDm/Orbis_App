import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Modal,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from "../../hooks/use_user_data";

const FOCUS_CATEGORIES = [
  { id: 'ler', label: 'Ler', icon: 'book-open-page-variant', color: '#3B82F6' },
  { id: 'estudar', label: 'Estudar', icon: 'school', color: '#8B5CF6' },
  { id: 'praticar', label: 'Praticar', icon: 'dumbbell', color: '#10B981' },
  { id: 'revisar', label: 'Revisar', icon: 'magnify', color: '#F59E0B' },
  { id: 'descanso', label: 'Descanso', icon: 'coffee', color: '#EC4899' },
  { id: 'treinar', label: 'Treinar', icon: 'run', color: '#EF4444' },
  { id: 'assistir', label: 'Assistir', icon: 'monitor', color: '#6366F1' },
];

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalType, setModalType] = useState("fixed");
  const { user } = useUserData();
  
  // Estados para cada tipo de evento
  const [fixedCommitments, setFixedCommitments] = useState([]);
  const [flexibleTasks, setFlexibleTasks] = useState([]);
  const [essentialActivities, setEssentialActivities] = useState([]);
  const [focusBlocks, setFocusBlocks] = useState([]);
  const [focusPendingLocal, setFocusPendingLocal] = useState([]);
  
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    duration: "60",
    type: "Trabalho",
    priority: "MEDIUM",
    recurrence: "Nenhuma",
    preferredSlot: "AFTERNOON",
    category: "estudar",
  });

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() &&
           currentMonth.getMonth() === selectedDate.getMonth() &&
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayPress = (day) => {
    if (day) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };

  const handleAddEvent = () => {
    if (!form.title.trim()) return;
    
    const newEvent = {
      id: Date.now(),
      ...form,
      date: selectedDate.toISOString().split("T")[0],
      status: "Pending",
    };
    
    switch(modalType) {
      case "fixed":
        setFixedCommitments([...fixedCommitments, newEvent]);
        break;
      case "flexible":
        setFlexibleTasks([...flexibleTasks, newEvent]);
        break;
      case "essential":
        setEssentialActivities([...essentialActivities, newEvent]);
        break;
      case "focus":
        setFocusBlocks([...focusBlocks, newEvent]);
        savePendingFocusTask(newEvent);
        break;
    }
    
    setForm({ title: "", startTime: "09:00", duration: "60", type: "Trabalho", priority: "MEDIUM", recurrence: "Nenhuma", preferredSlot: "AFTERNOON", category: "estudar" });
    setShowEventModal(false);
  };

  // Salva evento de foco como pendente para o Modo Foco
  const savePendingFocusTask = async (event) => {
    try {
      // Apenas marca como pendente se for hoje ou futuro
      const todayStr = new Date().toISOString().split("T")[0];
      const isFutureOrToday = event.date >= todayStr;
      if (!isFutureOrToday) return;

      const raw = await AsyncStorage.getItem('@orbis_focus_pending');
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.some((it) => String(it.id) === String(event.id));
      const pendingItem = {
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime || null,
        duration: parseInt(event.duration, 10) || 0,
        type: event.type || 'Foco',
        category: event.category || 'estudar',
        eventType: 'focus',
        status: 'pendente',
      };
      const updated = exists ? list.map((it) => it.id === event.id ? pendingItem : it) : [ ...list, pendingItem ];
      await AsyncStorage.setItem('@orbis_focus_pending', JSON.stringify(updated));
    } catch (e) {
      // Silencia erros de persistência local
    }
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Helpers para normalizar tarefas externas (Modo Foco) vindas do usuário
  const parseDurationToMinutesLocal = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    if (typeof str === 'string') {
      const parts = str.split(':').map((p) => Number(p));
      if (parts.every((n) => !Number.isNaN(n))) {
        if (parts.length === 3) {
          const [h, m, s] = parts; return h * 60 + m + s / 60;
        }
        if (parts.length === 2) {
          const [m, s] = parts; return m + s / 60;
        }
        if (parts.length === 1) return parts[0];
      }
      const n = Number(str); return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const getTaskDateStr = (item) => {
    try {
      if (item?.dia) return String(item.dia);
      if (item?.date) {
        if (typeof item.date === 'string') return item.date;
        const d = new Date(item.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      }
      if (item?.timestamp) {
        const d = typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate() : new Date(item.timestamp);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      }
    } catch {}
    return selectedDate.toISOString().split('T')[0];
  };

  const normalizeFocusTask = (item, status) => {
    const durationMin = parseDurationToMinutesLocal(item?.tempo || item?.tempoFoco || item?.duration || item?.duracao);
    return {
      id: item?.id || `${status}-${getTaskDateStr(item)}-${item?.titulo || item?.nomeTarefa || Math.random()}`,
      title: item?.nomeTarefa || item?.titulo || item?.title || 'Tarefa',
      date: getTaskDateStr(item),
      startTime: item?.horario || item?.startTime || null,
      duration: Math.round(durationMin) || 0,
      type: item?.tipo || 'Estudo',
      category: item?.categoria || item?.categoriaTitulo || 'estudar',
      eventType: 'focus',
      status,
    };
  };

  const normalizeAgendaEvent = (item, status) => {
    const dateStr = item?.date || item?.dia || getTaskDateStr(item);
    const durationMin = parseDurationToMinutesLocal(item?.duracao || item?.duration || item?.tempo);
    return {
      id: item?.id || `${status}-agenda-${dateStr}-${item?.titulo || Math.random()}`,
      title: item?.titulo || item?.title || 'Evento',
      date: dateStr,
      startTime: item?.horario || item?.startTime || null,
      duration: Math.round(durationMin) || 0,
      type: item?.tipo || 'Agenda',
      category: item?.categoria || 'agenda',
      eventType: 'agenda',
      status,
    };
  };

  useEffect(() => {
    const loadPendingFromStorage = async () => {
      try {
        const raw = await AsyncStorage.getItem('@orbis_focus_pending');
        const list = raw ? JSON.parse(raw) : [];
        setFocusPendingLocal(Array.isArray(list) ? list : []);
      } catch {}
    };
    loadPendingFromStorage();
  }, []);

  const allEvents = [
    ...fixedCommitments.map(e => ({ ...e, eventType: "fixed" })),
    ...flexibleTasks.map(e => ({ ...e, eventType: "flexible" })),
    ...essentialActivities.map(e => ({ ...e, eventType: "essential" })),
    ...focusBlocks.map(e => ({ ...e, eventType: "focus" })),
  ];

  // Tarefas pendentes e concluídas do usuário (Modo Foco)
  const focoTarefas = user?.ferramentas?.foco?.tarefas || {};
  const pendingTasks = Array.isArray(focoTarefas.listaPendente) ? focoTarefas.listaPendente.map((it) => normalizeFocusTask(it, 'pendente')) : [];
  const completedTasks = Array.isArray(focoTarefas.listaConcluida) ? focoTarefas.listaConcluida.map((it) => normalizeFocusTask(it, 'concluida')) : [];
  const localPendingNormalized = Array.isArray(focusPendingLocal) ? focusPendingLocal.map((it) => normalizeFocusTask(it, 'pendente')) : [];

  const agendaHistorico = user?.ferramentas?.agenda?.historicoEventos || {};
  const agendaPendentes = Array.isArray(agendaHistorico.pendentes) ? agendaHistorico.pendentes.map((it) => normalizeAgendaEvent(it, 'pendente')) : [];
  const agendaConcluidos = Array.isArray(agendaHistorico.concluidos) ? agendaHistorico.concluidos.map((it) => normalizeAgendaEvent(it, 'concluida')) : [];

  const externalEvents = [...pendingTasks, ...completedTasks, ...localPendingNormalized, ...agendaPendentes, ...agendaConcluidos];
  const allEventsWithExternal = [...allEvents, ...externalEvents];
  
  const todayEvents = allEventsWithExternal
    .filter(e => e.date === selectedDate.toISOString().split("T")[0])
    .sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons name="cog-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Botões de Ferramentas */}
        <View style={styles.toolsGroup}>
          <TouchableOpacity 
            style={[styles.toolBtn, { backgroundColor: "#3B82F6" }]} 
            onPress={() => { setModalType("fixed"); setShowEventModal(true); }}
          >
            <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
            <Text style={styles.toolBtnText}>Fixo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolBtn, { backgroundColor: "#8B5CF6" }]} 
            onPress={() => { setModalType("flexible"); setShowEventModal(true); }}
          >
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFFFFF" />
            <Text style={styles.toolBtnText}>Flexível</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolBtn, { backgroundColor: "#10B981" }]} 
            onPress={() => { setModalType("essential"); setShowEventModal(true); }}
          >
            <MaterialCommunityIcons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.toolBtnText}>Essencial</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolBtn, { backgroundColor: "#F59E0B" }]} 
            onPress={() => { setModalType("focus"); setShowEventModal(true); }}
          >
            <MaterialCommunityIcons name="target" size={20} color="#FFFFFF" />
            <Text style={styles.toolBtnText}>Foco</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.primary[600]} />
            </TouchableOpacity>
            
            <Text style={styles.monthText}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {dayNames.map((day, index) => (
              <View key={index} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {generateCalendar().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  day === null && styles.dayCellEmpty,
                  isSelected(day) && styles.dayCellSelected,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={day === null}
              >
                {day !== null && (
                  <>
                    <Text style={[
                      styles.dayText,
                      isToday(day) && styles.dayTextToday,
                      isSelected(day) && styles.dayTextSelected,
                    ]}>
                      {day}
                    </Text>
                    {allEventsWithExternal.some(e => {
                      const eventDate = new Date(e.date);
                      return eventDate.getDate() === day && 
                             eventDate.getMonth() === currentMonth.getMonth() &&
                             eventDate.getFullYear() === currentMonth.getFullYear();
                    }) && !isSelected(day) && (
                      <View style={styles.eventIndicator} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
            </Text>
            <View style={styles.eventsCount}>
              <Text style={styles.eventsCountText}>{todayEvents.length}</Text>
            </View>
          </View>

          {todayEvents.length > 0 ? (
            <View style={styles.eventsContainerCard}>
              <View style={styles.eventsGrid}>
                {todayEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>{event.startTime || "--:--"}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.eventDuration}>{event.duration}min</Text>
                        <View style={[styles.categoryBadge, { backgroundColor: getEventTypeColor(event.eventType) + "20" }]}>        
                          <Text style={[styles.categoryBadgeText, { color: getEventTypeColor(event.eventType) }]}>
                            {getEventTypeLabel(event.eventType)}
                          </Text>
                        </View>
                        {(event.status === 'pendente' || event.status === 'concluida') && (
                          <View style={[styles.statusBadge, { backgroundColor: (event.status === 'concluida' ? '#10B98120' : '#F59E0B15') }]}>        
                            <Text style={[styles.statusBadgeText, { color: (event.status === 'concluida' ? '#10B981' : '#F59E0B') }]}>{event.status === 'concluida' ? 'Concluída' : 'Pendente'}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum evento</Text>
              <Text style={styles.emptySubtext}>Use as ferramentas abaixo</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowEventModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{getModalTitle(modalType)}</Text>
                <TouchableOpacity onPress={() => setShowEventModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Reunião de equipe"
                  placeholderTextColor="#9CA3AF"
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />

                {(modalType === "fixed" || modalType === "focus") && (
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Horário</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                        value={form.startTime}
                        onChangeText={(text) => setForm({ ...form, startTime: text })}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Duração (min)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="60"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={form.duration}
                        onChangeText={(text) => setForm({ ...form, duration: text })}
                      />
                    </View>
                  </View>
                )}

                {modalType === "flexible" && (
                  <>
                    <Text style={styles.label}>Duração Estimada (min)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="60"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={form.duration}
                      onChangeText={(text) => setForm({ ...form, duration: text })}
                    />
                    
                    <Text style={styles.label}>Prioridade</Text>
                    <View style={styles.categoryRow}>
                      {["LOW", "MEDIUM", "HIGH"].map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.categoryButton, form.priority === p && styles.categoryButtonActive]}
                          onPress={() => setForm({ ...form, priority: p })}
                        >
                          <Text style={[styles.categoryButtonText, form.priority === p && styles.categoryButtonTextActive]}>
                            {p === "LOW" ? "Baixa" : p === "MEDIUM" ? "Média" : "Alta"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <Text style={styles.label}>Período Preferido</Text>
                    <View style={styles.categoryRow}>
                      {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.categoryButton, form.preferredSlot === slot && styles.categoryButtonActive]}
                          onPress={() => setForm({ ...form, preferredSlot: slot })}
                        >
                          <Text style={[styles.categoryButtonText, form.preferredSlot === slot && styles.categoryButtonTextActive]}>
                            {slot === "MORNING" ? "Manhã" : slot === "AFTERNOON" ? "Tarde" : "Noite"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {modalType === "essential" && (
                  <>
                    <Text style={styles.label}>Duração (min)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="30"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={form.duration}
                      onChangeText={(text) => setForm({ ...form, duration: text })}
                    />
                  </>
                )}

                {modalType === "focus" && (
                  <>
                    <Text style={styles.label}>Categoria</Text>
                    <View style={styles.categoryGrid}>
                      {FOCUS_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryCard,
                            form.category === cat.id && styles.categoryCardSelected
                          ]}
                          onPress={() => setForm({ ...form, category: cat.id })}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon}
                            size={20}
                            color={form.category === cat.id ? '#FFF' : cat.color}
                          />
                          <Text
                            style={[
                              styles.categoryCardText,
                              form.category === cat.id && styles.categoryCardTextSelected
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.label}>Tipo</Text>
                <View style={styles.categoryRow}>
                  {["Trabalho", "Pessoal", "Saúde", "Estudo"].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryButton, form.type === cat && styles.categoryButtonActive]}
                      onPress={() => setForm({ ...form, type: cat })}
                    >
                      <Text style={[styles.categoryButtonText, form.type === cat && styles.categoryButtonTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {modalType === "fixed" && (
                  <>
                    <Text style={styles.label}>Recorrência</Text>
                    <View style={styles.categoryRow}>
                      {["Nenhuma", "Diária", "Semanal", "Mensal"].map((rec) => (
                        <TouchableOpacity
                          key={rec}
                          style={[styles.categoryButton, form.recurrence === rec && styles.categoryButtonActive]}
                          onPress={() => setForm({ ...form, recurrence: rec })}
                        >
                          <Text style={[styles.categoryButtonText, form.recurrence === rec && styles.categoryButtonTextActive]}>
                            {rec}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleAddEvent}>
                  <Text style={styles.saveButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getEventTypeColor = (eventType) => {
  const colors = {
    fixed: "#3B82F6",
    flexible: "#8B5CF6",
    essential: "#10B981",
    focus: "#F59E0B",
    agenda: "#0897ea",
  };
  return colors[eventType] || "#6B7280";
};

const getEventTypeLabel = (eventType) => {
  const labels = {
    fixed: "Fixo",
    flexible: "Flexível",
    essential: "Essencial",
    focus: "Foco",
    agenda: "Agenda",
  };
  return labels[eventType] || eventType;
};

const getModalTitle = (modalType) => {
  const titles = {
    fixed: "Compromisso Fixo",
    flexible: "Tarefa Flexível",
    essential: "Atividade Essencial",
    focus: "Bloco de Foco",
  };
  return titles[modalType] || "Novo Evento";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: theme.colors.primary[600],
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  
  calendarCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navButton: {
    padding: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginBottom: 4,
    position: "relative",
  },
  dayCellEmpty: {
    backgroundColor: "transparent",
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  dayTextToday: {
    color: theme.colors.primary[600],
    fontWeight: "700",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  eventIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary[400],
    position: "absolute",
    bottom: 4,
  },

  eventsSection: {
    margin: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  eventsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  eventsCount: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventsCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary[700],
  },
  eventsGrid: {
    gap: 12,
  },
  eventsContainerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  eventTime: {
    marginRight: 16,
    minWidth: 50,
  },
  eventTimeText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary[600],
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDuration: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#D1D5DB",
    marginTop: 4,
  },

  toolsGroup: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    color: "#1F2937",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryCard: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  categoryCardSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  categoryCardText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 6,
    textAlign: "center",
  },
  categoryCardTextSelected: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
