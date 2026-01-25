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
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from "../../theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from "../../hooks/use_user_data";
import { saveAgendaEventosFixos, saveAgendaEventosFlexiveis, addAgendaXP } from "../../data/user";
import { auth, db } from "../../services/firebase/firebase_config";
import { doc, updateDoc } from "firebase/firestore";

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
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const { user } = useUserData();
  
  // Estados para cada tipo de evento
  const [fixedCommitments, setFixedCommitments] = useState([]);
  const [flexibleTasks, setFlexibleTasks] = useState([]);
  const [focusBlocks, setFocusBlocks] = useState([]);
  const [focusPendingLocal, setFocusPendingLocal] = useState([]);
  const [hasFixedConflict, setHasFixedConflict] = useState(false);
  
  // Estados para edição
  const [editingEvent, setEditingEvent] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedEventForAction, setSelectedEventForAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'edit', 'deleteOne', 'deleteAll'
  
  // Estados para configurações
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [agendaSettings, setAgendaSettings] = useState({
    notificacaoEventos: true,
    horarioLembrete: "09:00",
  });
  
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    duration: "60",
    type: "Trabalho",
    priority: "MEDIUM",
    recurrence: "Nenhuma",
    preferredSlot: "AFTERNOON",
    category: "estudar",
    weekDays: [], // ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
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

    // Validação de conflito para tarefas flexíveis
    if ((modalType === 'flexible' || editingEvent?.eventType === 'flexible')) {
      const durationMin = parseDurationToMinutesLocal(form.duration) || 0;
      const dateStr = selectedDate.toISOString().split("T")[0];
      if (hasConflictWithFixed(dateStr, form.startTime, durationMin)) {
        Alert.alert('Conflito de horário', 'Este horário já está ocupado por um evento fixo. Escolha outro horário.');
        return;
      }
    }
    
    if (editingEvent) {
      // Modo edição
      let updatedList;
      switch(editingEvent.eventType) {
        case "fixed":
          updatedList = fixedCommitments.map(e => e.id === editingEvent.originalId ? { ...e, ...form } : e);
          setFixedCommitments(updatedList);
          saveEventosToFirebase(updatedList, 'fixed');
          break;
        case "flexible":
          updatedList = flexibleTasks.map(e => e.id === editingEvent.originalId ? { ...e, ...form } : e);
          setFlexibleTasks(updatedList);
          saveEventosToFirebase(updatedList, 'flexible');
          break;

        case "focus":
          updatedList = focusBlocks.map(e => e.id === editingEvent.originalId ? { ...e, ...form } : e);
          setFocusBlocks(updatedList);
          savePendingFocusTask({ ...editingEvent, ...form });
          break;
      }
      setEditingEvent(null);
    } else {
      // Novo evento
      let updatedList;
      switch(modalType) {
        case "fixed":
          updatedList = [...fixedCommitments, newEvent];
          setFixedCommitments(updatedList);
          saveEventosToFirebase(updatedList, 'fixed');
          break;
        case "flexible":
          updatedList = [...flexibleTasks, newEvent];
          setFlexibleTasks(updatedList);
          saveEventosToFirebase(updatedList, 'flexible');
          break;

        case "focus":
          updatedList = [...focusBlocks, newEvent];
          setFocusBlocks(updatedList);
          savePendingFocusTask(newEvent);
          break;
      }
    }
    
    setForm({ title: "", startTime: "09:00", endTime: "10:00", duration: "60", type: "Trabalho", priority: "MEDIUM", recurrence: "Nenhuma", preferredSlot: "AFTERNOON", category: "estudar", weekDays: [] });
    setShowEventModal(false);
  };

  const saveEventosToFirebase = async (eventos, tipo) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      switch(tipo) {
        case 'fixed':
          await saveAgendaEventosFixos(currentUser.uid, eventos);
          break;
        case 'flexible':
          await saveAgendaEventosFlexiveis(currentUser.uid, eventos);
          break;

      }
    } catch (error) {
      console.error(`Erro ao salvar eventos ${tipo}:`, error);
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setForm({ ...form, startTime: `${hours}:${minutes}` });
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setForm({ ...form, endTime: `${hours}:${minutes}` });
    }
  };

  const toMinutes = (hhmm = "00:00") => {
    const [h, m] = (hhmm || "00:00").split(':').map((n) => parseInt(n, 10) || 0);
    return h * 60 + m;
  };

  const hasConflictWithFixed = (dateStr, startTime, durationMin) => {
    const expanded = expandFixedEvents(fixedCommitments);
    const dayEvents = expanded.filter((e) => e.date === dateStr);

    const flexStart = toMinutes(startTime || "00:00");
    const flexEnd = flexStart + (durationMin || 0);

    return dayEvents.some((ev) => {
      const evStart = toMinutes(ev.startTime || "00:00");
      const evEnd = ev.endTime ? toMinutes(ev.endTime) : evStart + (parseDurationToMinutesLocal(ev.duration) || 0);
      return flexStart < evEnd && flexEnd > evStart; // overlap
    });
  };

  useEffect(() => {
    // Atualiza indicador visual de conflito para tarefas flexíveis
    if (modalType === 'flexible' || editingEvent?.eventType === 'flexible') {
      const durationMin = parseDurationToMinutesLocal(form.duration) || 0;
      const dateStr = selectedDate.toISOString().split("T")[0];
      setHasFixedConflict(hasConflictWithFixed(dateStr, form.startTime, durationMin));
    } else {
      setHasFixedConflict(false);
    }
  }, [modalType, editingEvent, form.startTime, form.duration, selectedDate, fixedCommitments]);

  // Handlers para edição e deleção
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "10:00",
      duration: event.duration || "60",
      type: event.type || "Trabalho",
      priority: event.priority || "MEDIUM",
      recurrence: event.recurrence || "Nenhuma",
      preferredSlot: event.preferredSlot || "AFTERNOON",
      category: event.category || "estudar",
      weekDays: event.weekDays || [],
    });
    setModalType(event.eventType);
    setShowEventModal(true);
    setShowActionModal(false);
  };

  // Salvar configurações da agenda
  const handleSaveSettings = async () => {
    try {
      // Salva no AsyncStorage
      await AsyncStorage.setItem('@agenda_settings', JSON.stringify(agendaSettings));
      
      // Salva no Firebase se usuário logado
      if (user?.uid) {
        const userRef = doc(db, 'Usuarios', user.uid);
        await updateDoc(userRef, {
          'ferramentas.agenda.configuracoes': agendaSettings,
          updatedAt: new Date(),
        });
      }
      
      Alert.alert('Sucesso', 'Configurações da agenda salvas!');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    }
  };

  // Carregar configurações ao montar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('@agenda_settings');
        if (saved) {
          setAgendaSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    loadSettings();
  }, []);

  const handleDeleteEvent = (deleteMode) => {
    if (!selectedEventForAction) return;

    const { eventType, originalId, id, date } = selectedEventForAction;

    if (deleteMode === 'deleteOne') {
      // Deleta apenas a ocorrência de um dia específico
      let updatedList;
      if (eventType === "fixed") {
        updatedList = fixedCommitments.map(e => {
          if (e.id === originalId && e.weekDays && e.weekDays.length > 0) {
            // Evento recorrente: marca data como exceção
            return {
              ...e,
              exceptions: [...(e.exceptions || []), date]
            };
          }
          return e.id === id ? null : e;
        }).filter(Boolean);
        setFixedCommitments(updatedList);
        saveEventosToFirebase(updatedList, 'fixed');
      } else if (eventType === "flexible") {
        updatedList = flexibleTasks.filter(e => e.id !== id);
        setFlexibleTasks(updatedList);
        saveEventosToFirebase(updatedList, 'flexible');
      } else if (eventType === "focus") {
        updatedList = focusBlocks.filter(e => e.id !== id);
        setFocusBlocks(updatedList);
      }
    } else if (deleteMode === 'deleteAll') {
      // Deleta todas as ocorrências (só faz sentido para eventos recorrentes)
      let updatedList;
      if (eventType === "fixed") {
        updatedList = fixedCommitments.filter(e => e.id !== originalId);
        setFixedCommitments(updatedList);
        saveEventosToFirebase(updatedList, 'fixed');
      } else if (eventType === "flexible") {
        updatedList = flexibleTasks.filter(e => e.id !== originalId);
        setFlexibleTasks(updatedList);
        saveEventosToFirebase(updatedList, 'flexible');
      } else if (eventType === "focus") {
        updatedList = focusBlocks.filter(e => e.id !== originalId);
        setFocusBlocks(updatedList);
      }
    }

    setShowActionModal(false);
    setSelectedEventForAction(null);
  };

  const handleOpenActionModal = (event) => {
    setSelectedEventForAction(event);
    setShowActionModal(true);
  };

  // Verifica se o horário final do evento já passou
  const hasPassedEventEnd = (event) => {
    try {
      if (!event || !event.date) return false;
      const now = new Date();
      const baseDate = new Date(`${event.date}T00:00:00`);

      let endDateTime = null;

      // Evento fixo com horário de término explícito
      if (event.eventType === 'fixed' && event.endTime) {
        const [eh, em] = event.endTime.split(':').map((v) => parseInt(v, 10));
        endDateTime = new Date(baseDate);
        endDateTime.setHours(Number.isFinite(eh) ? eh : 0, Number.isFinite(em) ? em : 0, 0, 0);
      }
      // Outros eventos com início + duração
      else if (event.startTime && event.duration) {
        const [sh, sm] = event.startTime.split(':').map((v) => parseInt(v, 10));
        const startDateTime = new Date(baseDate);
        startDateTime.setHours(Number.isFinite(sh) ? sh : 0, Number.isFinite(sm) ? sm : 0, 0, 0);
        const durationMs = Number(event.duration) * 60000;
        endDateTime = new Date(startDateTime.getTime() + (Number.isFinite(durationMs) ? durationMs : 0));
      }

      if (!endDateTime) return false;
      return now >= endDateTime;
    } catch {
      return false;
    }
  };

  const handleCompleteEvent = async (event) => {
    if (!event || !user?.uid) return;

    try {
      // Adiciona XP (+5) ao usuário
      const result = await addAgendaXP(user.uid, 5);
      
      // Remove o evento das listas ativas
      const { eventType, id, originalId } = event;
      
      if (eventType === "fixed") {
        const updatedList = fixedCommitments.filter(e => e.id !== id);
        setFixedCommitments(updatedList);
        saveEventosToFirebase(updatedList, 'fixed');
      } else if (eventType === "flexible") {
        const updatedList = flexibleTasks.filter(e => e.id !== id);
        setFlexibleTasks(updatedList);
        saveEventosToFirebase(updatedList, 'flexible');
      } else if (eventType === "focus") {
        const updatedList = focusBlocks.filter(e => e.id !== id);
        setFocusBlocks(updatedList);
      }

      // Fecha modal e mostra mensagem de sucesso
      setShowActionModal(false);
      setSelectedEventForAction(null);
      
      Alert.alert(
        'Evento Concluído! 🎉',
        `Você ganhou +5 XP!\nXP Total da Agenda: ${result?.newXP || 0}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Erro ao concluir evento:', error);
      Alert.alert('Erro', 'Não foi possível concluir o evento');
    }
  };

  // Expande eventos fixos com recorrência de dias da semana
  const expandFixedEvents = (events, weeksAhead = 12) => {
    const expanded = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    events.forEach((event) => {
      if (event.weekDays && event.weekDays.length > 0) {
        // Mapeamento de dias da semana (0 = domingo)
        const dayMap = {
          'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'dom': 0
        };
        const selectedDaysOfWeek = event.weekDays.map(d => dayMap[d]);
        const exceptions = event.exceptions || [];
        
        // Data de início: primeiro dia da semana que corresponde aos dias selecionados
        const startDate = new Date(today);
        const today_dayOfWeek = today.getDay();
        
        // Encontra o primeiro dia que combina com a seleção
        let daysToAdd = 0;
        let found = false;
        for (let i = 0; i < 7; i++) {
          const testDay = (today_dayOfWeek + i) % 7;
          if (selectedDaysOfWeek.includes(testDay)) {
            daysToAdd = i;
            found = true;
            break;
          }
        }
        
        if (found) {
          startDate.setDate(startDate.getDate() + daysToAdd);
        }

        // Gera eventos para as próximas X semanas a partir do primeiro dia que combina
        for (let week = 0; week < weeksAhead; week++) {
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + week * 7 + dayOffset);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            // Pula se a data está na lista de exceções
            if (exceptions.includes(dateStr)) continue;
            
            if (selectedDaysOfWeek.includes(checkDate.getDay())) {
              expanded.push({
                ...event,
                id: `${event.id}-${dateStr}`,
                date: dateStr,
                originalId: event.id,
              });
            }
          }
        }
      } else {
        // Eventos fixos sem recorrência de dias
        expanded.push(event);
      }
    });

    return expanded;
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
    const loadEventsFromFirebase = async () => {
      try {
        if (user?.ferramentas?.agenda?.eventosFixos) {
          setFixedCommitments(user.ferramentas.agenda.eventosFixos);
        }
        if (user?.ferramentas?.agenda?.eventosFlexiveis) {
          setFlexibleTasks(user.ferramentas.agenda.eventosFlexiveis);
        }
      } catch (error) {
        console.error('Erro ao carregar eventos do Firebase:', error);
      }
    };

    loadEventsFromFirebase();
  }, [user]);

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
    ...expandFixedEvents(fixedCommitments).map(e => ({ ...e, eventType: "fixed" })),
    ...flexibleTasks.map(e => ({ ...e, eventType: "flexible" })),
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
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowSettingsModal(true)}
        >
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
                    {(() => {
                      // Filtra eventos do dia específico
                      const dayEvents = allEventsWithExternal.filter(e => {
                        let eventDateStr;
                        if (typeof e.date === 'string') {
                          eventDateStr = e.date;
                        } else if (e.date instanceof Date) {
                          eventDateStr = e.date.toISOString().split('T')[0];
                        } else {
                          return false;
                        }
                        
                        const [year, month, date] = eventDateStr.split('-').map(Number);
                        return date === day && 
                               month === currentMonth.getMonth() + 1 &&
                               year === currentMonth.getFullYear();
                      });
                      
                      // Extrai tipos únicos de eventos
                      const eventTypes = [...new Set(dayEvents.map(e => e.eventType))];
                      
                      return !isSelected(day) && eventTypes.length > 0 && (
                        <View style={styles.eventIndicators}>
                          {eventTypes.map(type => (
                            <View 
                              key={type} 
                              style={[styles.eventIndicatorDot, { backgroundColor: getEventTypeColor(type) }]} 
                            />
                          ))}
                        </View>
                      );
                    })()}
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
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleOpenActionModal(event)}
                  >
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>{event.startTime || "—"}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.eventType === "fixed" && Array.isArray(event.weekDays) && event.weekDays.length > 0 && (
                        <Text style={styles.eventWeekDays}>{formatWeekDays(event.weekDays)}</Text>
                      )}
                      <View style={styles.eventMeta}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.eventDuration}>
                          {event.eventType === "fixed" && event.endTime
                            ? `${event.startTime}-${event.endTime}`
                            : `${event.duration}min`}
                        </Text>
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
                  </TouchableOpacity>
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
                      <Text style={styles.label}>Horário Início</Text>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary[600]} />
                        <Text style={styles.timePickerButtonText}>{form.startTime}</Text>
                      </TouchableOpacity>
                      {showStartTimePicker && (
                        <DateTimePicker
                          value={new Date(`2024-01-01T${form.startTime}:00`)}
                          mode="time"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleStartTimeChange}
                          textColor={theme.colors.primary[600]}
                        />
                      )}
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>{modalType === "fixed" ? "Horário Fim" : "Duração (min)"}</Text>
                      {modalType === "fixed" ? (
                        <>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => setShowEndTimePicker(true)}
                          >
                            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary[600]} />
                            <Text style={styles.timePickerButtonText}>{form.endTime}</Text>
                          </TouchableOpacity>
                          {showEndTimePicker && (
                            <DateTimePicker
                              value={new Date(`2024-01-01T${form.endTime}:00`)}
                              mode="time"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              onChange={handleEndTimeChange}
                              textColor={theme.colors.primary[600]}
                            />
                          )}
                        </>
                      ) : (
                        <TextInput
                          style={styles.input}
                          placeholder="60"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          value={form.duration}
                          onChangeText={(text) => setForm({ ...form, duration: text })}
                        />
                      )}
                    </View>
                  </View>
                )}

                {modalType === "flexible" && (
                  <>
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <Text style={styles.label}>Horário</Text>
                        <TouchableOpacity
                          style={styles.timePickerButton}
                          onPress={() => setShowStartTimePicker(true)}
                        >
                          <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary[600]} />
                          <Text style={styles.timePickerButtonText}>{form.startTime}</Text>
                        </TouchableOpacity>
                        {showStartTimePicker && (
                          <DateTimePicker
                            value={new Date(`2024-01-01T${form.startTime}:00`)}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleStartTimeChange}
                            textColor={theme.colors.primary[600]}
                          />
                        )}
                      </View>
                      <View style={styles.halfField}>
                        <Text style={styles.label}>Duração Estimada (min)</Text>
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

                    {hasFixedConflict && (
                      <View style={styles.conflictBanner}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B91C1C" />
                        <Text style={styles.conflictText}>Horário indisponível devido a evento fixo</Text>
                      </View>
                    )}
                    
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
                    <Text style={styles.label}>Dias da Semana</Text>
                    <View style={styles.weekDaysGrid}>
                      {[
                        { id: 'seg', label: 'Seg' },
                        { id: 'ter', label: 'Ter' },
                        { id: 'qua', label: 'Qua' },
                        { id: 'qui', label: 'Qui' },
                        { id: 'sex', label: 'Sex' },
                        { id: 'sab', label: 'Sab' },
                        { id: 'dom', label: 'Dom' },
                      ].map((day) => (
                        <TouchableOpacity
                          key={day.id}
                          style={[
                            styles.dayButton,
                            form.weekDays.includes(day.id) && styles.dayButtonActive,
                          ]}
                          onPress={() => {
                            const updated = form.weekDays.includes(day.id)
                              ? form.weekDays.filter(d => d !== day.id)
                              : [...form.weekDays, day.id];
                            setForm({ ...form, weekDays: updated });
                          }}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              form.weekDays.includes(day.id) && styles.dayButtonTextActive,
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

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
                  <Text style={styles.saveButtonText}>{editingEvent ? "Atualizar" : "Adicionar"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Ações do Evento */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowActionModal(false)}
          />
          <View style={styles.actionModalCard}>
            <Text style={styles.actionModalTitle}>Ações do Evento</Text>
          
            {hasPassedEventEnd(selectedEventForAction) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonComplete]}
                onPress={() => handleCompleteEvent(selectedEventForAction)}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Concluir Evento (+5 XP)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditEvent(selectedEventForAction)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Editar Evento</Text>
            </TouchableOpacity>

            {selectedEventForAction?.originalId && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteEvent('deleteOne')}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#F59E0B" />
                  <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
                    Deletar Apenas Este Dia
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteEvent('deleteAll')}
                >
                  <MaterialCommunityIcons name="delete-multiple" size={20} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                    Deletar Todos
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!selectedEventForAction?.originalId && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteEvent('deleteOne')}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                  Deletar Evento
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButtonCancel}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.actionButtonCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configurações */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            {/* Header */}
            <View style={styles.settingsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsTitle}>Configurações</Text>
                <Text style={styles.settingsSubtitle}>Personalize sua agenda</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSettingsModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            <ScrollView 
              style={styles.settingsScroll}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
            >
              {/* Seção: Notificações */}
              <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Notificações</Text>
                </View>

                <TouchableOpacity 
                  style={styles.settingItemClickable}
                  onPress={() =>
                    setAgendaSettings({
                      ...agendaSettings,
                      notificacaoEventos: !agendaSettings.notificacaoEventos
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLabel}>
                    <Text style={styles.settingText}>Notificações de Eventos</Text>
                    <Text style={styles.settingDescription}>Receba lembretes de seus eventos</Text>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      { backgroundColor: agendaSettings.notificacaoEventos ? "#10B981" : "#D1D5DB" }
                    ]}
                  >
                    <View style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: agendaSettings.notificacaoEventos ? 20 : 2 }] }
                    ]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Seção: Horário */}
              <View style={styles.settingsSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Horário do Lembrete</Text>
                </View>

                <View style={styles.settingItemBox}>
                  <Text style={styles.settingText}>Horário padrão</Text>
                  <Text style={styles.settingDescription}>Define quando receber notificações</Text>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeDisplay}>{agendaSettings.horarioLembrete}</Text>
                    <TouchableOpacity 
                      style={styles.timeEditButton}
                      onPress={() => setShowReminderTimePicker(true)}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary[600]} />
                    </TouchableOpacity>
                  </View>
                  
                  {showReminderTimePicker && (
                    <DateTimePicker
                      value={(() => {
                        const [hours, minutes] = agendaSettings.horarioLembrete.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours));
                        date.setMinutes(parseInt(minutes));
                        return date;
                      })()}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedTime) => {
                        setShowReminderTimePicker(Platform.OS === 'ios');
                        if (selectedTime) {
                          const hours = selectedTime.getHours().toString().padStart(2, '0');
                          const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                          setAgendaSettings({
                            ...agendaSettings,
                            horarioLembrete: `${hours}:${minutes}`
                          });
                        }
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Espaço para scroll */}
              <View style={{ height: 30 }} />
            </ScrollView>

            {/* Botões de Ação - Fixed */}
            <View style={styles.settingsActions}>
              <TouchableOpacity
                style={[styles.settingButton, styles.settingButtonCancel]}
                onPress={() => setShowSettingsModal(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                <Text style={styles.settingButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingButton, styles.settingButtonSave]}
                onPress={handleSaveSettings}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={[styles.settingButtonText, { color: "#FFFFFF" }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
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
    focus: "#F59E0B",
    agenda: "#0897ea",
  };
  return colors[eventType] || "#6B7280";
};

const getEventTypeLabel = (eventType) => {
  const labels = {
    fixed: "Fixo",
    flexible: "Flexível",
    focus: "Foco",
    agenda: "Agenda",
  };
  return labels[eventType] || eventType;
};

const formatWeekDays = (weekDays = []) => {
  const order = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const labels = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sab', dom: 'Dom' };
  return order.filter(id => weekDays.includes(id)).map(id => labels[id] || id).join(', ');
};

const getModalTitle = (modalType) => {
  const titles = {
    fixed: "Compromisso Fixo",
    flexible: "Tarefa Flexível",
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
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingBottom: 8,
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
  eventIndicators: {
    flexDirection: "row",
    gap: 3,
    position: "absolute",
    bottom: 4,
  },
  eventIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
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
  eventWeekDays: {
    fontSize: 12,
    color: "#6B7280",
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
  weekDaysGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  dayButtonTextActive: {
    color: "#FFFFFF",
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 16,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary[600],
  },
  actionModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  actionButtonComplete: {
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  actionButtonCancel: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  actionButtonCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  conflictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: 12,
  },

  // ESTILOS DO MODAL DE CONFIGURAÇÕES MELHORADO
  settingsModalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 60,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginLeft: 12,
  },
  settingsScroll: {
    flex: 1,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  settingItemClickable: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  settingItemBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingLabel: {
    flex: 1,
    gap: 6,
  },
  settingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  settingDescription: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    marginLeft: 12,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary[600],
  },
  timeEditButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  daySelector: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  dayButtonTextActive: {
    color: "#FFFFFF",
  },
  themeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorButtonActive: {
    borderColor: "#1F2937",
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  settingsActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  settingButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  settingButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  settingButtonSave: {
    backgroundColor: theme.colors.primary[600],
  },
  settingButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
});
