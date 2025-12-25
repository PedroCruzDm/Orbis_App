import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, Dimensions, } from "react-native";
import {  agendaInitialFixedCommitments, agendaInitialFlexibleTasks, agendaInitialEssentialActivities, agendaInitialFocusBlocks } from '../../data/data';
import theme from '../../theme';


// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const { width } = Dimensions.get("window");
//const isTablet = width >= 768;

export default function Agenda() {
  // Estados principais
  const [fixedCommitments, setFixedCommitments] = useState(agendaInitialFixedCommitments);
  const [flexibleTasks, setFlexibleTasks] = useState(agendaInitialFlexibleTasks);
  const [essentialActivities, setEssentialActivities] = useState(agendaInitialEssentialActivities);
  const [focusBlocks, setFocusBlocks] = useState(agendaInitialFocusBlocks);

  const [allEvents, setAllEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Estados modais
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [showFlexibleModal, setShowFlexibleModal] = useState(false);
  const [showEssentialModal, setShowEssentialModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState('calendar');

  // Estados form
  const [fixedForm, setFixedForm] = useState({
    title: "",
    type: "Trabalho",
    startTime: "09:00",
    duration: "60",
    recurrence: "Nenhuma",
  });

  const [flexibleForm, setFlexibleForm] = useState({
    title: "",
    duration: "60",
    priority: "MEDIUM",
    preferredSlot: "AFTERNOON",
  });

  const [reminderForm, setReminderForm] = useState({
    reminderTime: "30",
    reminderUnit: "Minutos",
    enabled: true,
  });

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  const generateSchedule = () => {
    // Combina todos os eventos e ordena cronologicamente
    const combined = [
      ...fixedCommitments.map((e) => ({
        ...e,
        type: "FIXED",
        startMinutes: timeToMinutes(e.startTime),
      })),
      ...essentialActivities.map((e) => ({
        ...e,
        type: "ESSENTIAL",
        startMinutes: timeToMinutes(e.timeSlot.split("-")[0]),
      })),
      ...focusBlocks.map((e) => ({
        ...e,
        type: "FOCUS",
        startMinutes: timeToMinutes(e.startTime),
      })),
    ];

    return combined.sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: "#3B82F6",
      Pending: "#FBBF24",
      Executed: "#10B981",
      NonExecuted: "#EF4444",
      Inactive: "#9CA3AF",
      Undated: "#A78BFA",
    };
    return colors[status] || "#6B7280";
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const hasEventsOnDate = (date) => {
    // Por enquanto, retorna true para datas com compromissos fixos
    // Você pode expandir isso para verificar recorrência
    return fixedCommitments.length > 0 || focusBlocks.length > 0;
  };

  const getEventsForSelectedDate = () => {
    // Filtra eventos para o dia selecionado
    // Por enquanto mostra todos, mas você pode adicionar lógica de data
    return generateSchedule();
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddFixedCommitment = () => {
    if (fixedForm.title.trim()) {
      setFixedCommitments([
        ...fixedCommitments,
        {
          id: Date.now(),
          ...fixedForm,
          duration: parseInt(fixedForm.duration),
          status: "Pending",
        },
      ]);
      setFixedForm({
        title: "",
        type: "Trabalho",
        startTime: "09:00",
        duration: "60",
        recurrence: "Nenhuma",
      });
      setShowFixedModal(false);
    }
  };

  const handleAddFlexibleTask = () => {
    if (flexibleForm.title.trim()) {
      setFlexibleTasks([
        ...flexibleTasks,
        {
          id: Date.now(),
          ...flexibleForm,
          estimatedDuration: parseInt(flexibleForm.duration),
          status: "Undated",
        },
      ]);
      setFlexibleForm({
        title: "",
        duration: "60",
        priority: "MEDIUM",
        preferredSlot: "AFTERNOON",
      });
      setShowFlexibleModal(false);
    }
  };

  const handleDeleteFixed = (id) => {
    setFixedCommitments(fixedCommitments.filter((e) => e.id !== id));
  };

  const handleDeleteFlexible = (id) => {
    setFlexibleTasks(flexibleTasks.filter((e) => e.id !== id));
  };

  const handleDeleteFocusBlock = (id) => {
    setFocusBlocks(focusBlocks.filter((e) => e.id !== id));
  };

  // ============================================================================
  // COMPONENTES DE UI
  // ============================================================================

  const EventCard = ({ event, onDelete, isSmall = false }) => {
    const statusColor = getStatusColor(event.status);
    const typeLabel =
      event.type === "FIXED"
        ? "Compromisso"
        : event.type === "ESSENTIAL"
        ? "Essencial"
        : "Foco";

    return (
      <View style={[styles.eventCard, isSmall && styles.eventCardSmall]}>
        <View style={styles.eventHeader}>
          <View
            style={[
              styles.eventDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>

        <View style={styles.eventDetails}>
          <Text style={styles.eventLabel}>{typeLabel}</Text>
          {event.startTime && (
            <Text style={styles.eventTime}>
              {event.startTime} • {event.duration}min
            </Text>
          )}
          {event.priority && (
            <Text
              style={[
                styles.eventPriority,
                event.priority === "HIGH"
                  ? styles.priorityHigh
                  : event.priority === "MEDIUM"
                  ? styles.priorityMedium
                  : styles.priorityLow,
              ]}
            >
              {event.priority}
            </Text>
          )}
          <View style={styles.eventStatus}>
            <Text style={[styles.statusBadge, { color: statusColor }]}>
              {event.status}
            </Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(event.id)}>
            <Text style={styles.deleteBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const CalendarView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const today = new Date();
    const days = [];

    // Adiciona espaços vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Adiciona os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = isSameDay(date, today);
      const isSelected = isSameDay(date, selectedDate);
      const hasEvents = hasEventsOnDate(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isToday && styles.calendarDayTextToday,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
          {hasEvents && <View style={styles.eventIndicator} />}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        {/* Header do Calendário */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(currentMonth.getMonth() - 1);
              setCurrentMonth(newMonth);
            }}
            style={styles.calendarArrow}
          >
            <Text style={styles.calendarArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonthYear}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(currentMonth);
              newMonth.setMonth(currentMonth.getMonth() + 1);
              setCurrentMonth(newMonth);
            }}
            style={styles.calendarArrow}
          >
            <Text style={styles.calendarArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dias da Semana */}
        <View style={styles.calendarWeekDays}>
          {weekDays.map((day) => (
            <View key={day} style={styles.calendarWeekDay}>
              <Text style={styles.calendarWeekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Grid de Dias */}
        <View style={styles.calendarGrid}>{days}</View>

        {/* Eventos do Dia Selecionado */}
        <View style={styles.selectedDateEvents}>
          <Text style={styles.selectedDateTitle}>
            Eventos - {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
          </Text>
          <ScrollView style={styles.eventsScrollView}>
            {getEventsForSelectedDate().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhum evento neste dia</Text>
              </View>
            ) : (
              getEventsForSelectedDate().map((event, idx) => (
                <View key={`${event.type}-${event.id}`} style={styles.timelineItem}>
                  <Text style={styles.timelineTime}>{event.startTime}</Text>
                  <View style={styles.timelineContent}>
                    <EventCard event={event} isSmall />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const TimelineView = () => {
    const schedule = generateSchedule();

    return (
      <ScrollView style={styles.timelineContainer}>
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum evento agendado</Text>
          </View>
        ) : (
          schedule.map((event, idx) => (
            <View key={`${event.type}-${event.id}`} style={styles.timelineItem}>
              <Text style={styles.timelineTime}>{event.startTime}</Text>
              <View style={styles.timelineContent}>
                <EventCard event={event} isSmall />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const EventListTab = ({ title, events, onDelete }) => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>{title}</Text>
        <Text style={styles.tabCount}>{events.length}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum evento</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item }) => (
            <EventCard event={item} onDelete={onDelete} />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const schedule = useMemo(() => generateSchedule(), [
    fixedCommitments,
    essentialActivities,
    focusBlocks,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda Inteligente</Text>
        <View style={styles.headerStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{fixedCommitments.length}</Text>
            <Text style={styles.statLabel}>Fixos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{flexibleTasks.length}</Text>
            <Text style={styles.statLabel}>Flexíveis</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{focusBlocks.length}</Text>
            <Text style={styles.statLabel}>Foco</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showScheduleView === 'calendar' && styles.tabButtonActive,
          ]}
          onPress={() => setShowScheduleView('calendar')}
        >
          <Text
            style={[
              styles.tabButtonText,
              showScheduleView === 'calendar' && styles.tabButtonTextActive,
            ]}
          >
            📅 Calendário
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showScheduleView === 'timeline' && styles.tabButtonActive,
          ]}
          onPress={() => setShowScheduleView('timeline')}
        >
          <Text
            style={[
              styles.tabButtonText,
              showScheduleView === 'timeline' && styles.tabButtonTextActive,
            ]}
          >
            ⏰ Cronograma
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showScheduleView === 'events' && styles.tabButtonActive,
          ]}
          onPress={() => setShowScheduleView('events')}
        >
          <Text
            style={[
              styles.tabButtonText,
              showScheduleView === 'events' && styles.tabButtonTextActive,
            ]}
          >
            📋 Eventos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showScheduleView === 'calendar' ? (
          <CalendarView />
        ) : showScheduleView === 'timeline' ? (
          <TimelineView />
        ) : (
          <View>
            <EventListTab
              title="Compromissos Fixos"
              events={fixedCommitments}
              onDelete={handleDeleteFixed}
            />
            <EventListTab
              title="Tarefas Flexíveis"
              events={flexibleTasks}
              onDelete={handleDeleteFlexible}
            />
            <EventListTab
              title="Atividades Essenciais"
              events={essentialActivities}
            />
            <EventListTab
              title="Blocos de Foco"
              events={focusBlocks}
              onDelete={handleDeleteFocusBlock}
            />
          </View>
        )}
      </ScrollView>

      {/* Botões de Ação Flutuante */}
      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, styles.fabFixed]}
          onPress={() => setShowFixedModal(true)}
        >
          <Text style={styles.fabIcon}>📅</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabButton, styles.fabFlexible]}
          onPress={() => setShowFlexibleModal(true)}
        >
          <Text style={styles.fabIcon}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabButton, styles.fabFocus]}
          onPress={() => setShowReminderModal(true)}
        >
          <Text style={styles.fabIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* MODAIS */}

      {/* Modal de Compromisso Fixo */}
      <Modal
        visible={showFixedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFixedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Compromisso Fixo</Text>
              <TouchableOpacity onPress={() => setShowFixedModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Nome do Evento *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Trabalho, Reunião"
                value={fixedForm.title}
                onChangeText={(text) =>
                  setFixedForm({ ...fixedForm, title: text })
                }
              />

              <Text style={styles.fieldLabel}>Tipo de Evento *</Text>
              <View style={styles.selectGroup}>
                {["Trabalho", "Escola/Estudo Fixo", "Compromisso Pessoal"].map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.selectButton,
                        fixedForm.type === type && styles.selectButtonActive,
                      ]}
                      onPress={() =>
                        setFixedForm({ ...fixedForm, type })
                      }
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          fixedForm.type === type &&
                            styles.selectButtonTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.fieldLabel}>Hora de Início *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={fixedForm.startTime}
                onChangeText={(text) =>
                  setFixedForm({ ...fixedForm, startTime: text })
                }
              />

              <Text style={styles.fieldLabel}>Duração (minutos) *</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                value={fixedForm.duration}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFixedForm({ ...fixedForm, duration: text })
                }
              />

              <Text style={styles.fieldLabel}>Repetição</Text>
              <View style={styles.selectGroup}>
                {["Diário", "Semanal", "Mensal", "Nenhuma"].map((rec) => (
                  <TouchableOpacity
                    key={rec}
                    style={[
                      styles.selectButton,
                      fixedForm.recurrence === rec &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setFixedForm({ ...fixedForm, recurrence: rec })
                    }
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        fixedForm.recurrence === rec &&
                          styles.selectButtonTextActive,
                      ]}
                    >
                      {rec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddFixedCommitment}
            >
              <Text style={styles.submitBtnText}>Adicionar Evento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Tarefa Flexível */}
      <Modal
        visible={showFlexibleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFlexibleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Tarefa Flexível</Text>
              <TouchableOpacity onPress={() => setShowFlexibleModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Nome da Tarefa *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Estudar, Projeto Pessoal"
                value={flexibleForm.title}
                onChangeText={(text) =>
                  setFlexibleForm({ ...flexibleForm, title: text })
                }
              />

              <Text style={styles.fieldLabel}>Duração Estimada (min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="90"
                value={flexibleForm.duration}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFlexibleForm({ ...flexibleForm, duration: text })
                }
              />

              <Text style={styles.fieldLabel}>Prioridade</Text>
              <View style={styles.selectGroup}>
                {["HIGH", "MEDIUM", "LOW"].map((pri) => (
                  <TouchableOpacity
                    key={pri}
                    style={[
                      styles.selectButton,
                      flexibleForm.priority === pri &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setFlexibleForm({ ...flexibleForm, priority: pri })
                    }
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        flexibleForm.priority === pri &&
                          styles.selectButtonTextActive,
                      ]}
                    >
                      {pri}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Horário Preferido</Text>
              <View style={styles.selectGroup}>
                {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.selectButton,
                      flexibleForm.preferredSlot === slot &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setFlexibleForm({
                        ...flexibleForm,
                        preferredSlot: slot,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        flexibleForm.preferredSlot === slot &&
                          styles.selectButtonTextActive,
                      ]}
                    >
                      {slot === "MORNING"
                        ? "Manhã"
                        : slot === "AFTERNOON"
                        ? "Tarde"
                        : "Noite"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddFlexibleTask}
            >
              <Text style={styles.submitBtnText}>Adicionar Tarefa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Lembretes */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Lembretes</Text>
              <TouchableOpacity onPress={() => setShowReminderModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Tempo de Antecedência</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                value={reminderForm.reminderTime}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setReminderForm({ ...reminderForm, reminderTime: text })
                }
              />

              <Text style={styles.fieldLabel}>Unidade</Text>
              <View style={styles.selectGroup}>
                {["Minutos", "Horas", "Dias"].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.selectButton,
                      reminderForm.reminderUnit === unit &&
                        styles.selectButtonActive,
                    ]}
                    onPress={() =>
                      setReminderForm({ ...reminderForm, reminderUnit: unit })
                    }
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        reminderForm.reminderUnit === unit &&
                          styles.selectButtonTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.reminderNote}>
                <Text style={styles.reminderNoteText}>
                  ⓘ Mínimo: 30 minutos | Máximo: 4 dias
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Salvar Lembrete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos básicos (TODO: migrar do CSS para aqui)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  fieldLabel: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs, color: theme.colors.text.primary },
  input: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, fontSize: theme.typography.fontSize.sm },
  selectGroup: { flexDirection: 'row', gap: theme.spacing.xs },
  selectButton: { flex: 1, padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  selectButtonActive: { backgroundColor: theme.colors.primary[600], borderColor: theme.colors.primary[600] },
  selectButtonText: { color: theme.colors.text.primary, fontSize: theme.typography.fontSize.sm },
  selectButtonTextActive: { color: theme.colors.text.inverse },
  reminderNote: { marginTop: theme.spacing.sm, padding: theme.spacing.sm, backgroundColor: theme.colors.background.secondary, borderRadius: theme.borderRadius.md },
  reminderNoteText: { fontSize: theme.typography.fontSize.xs, color: theme.colors.text.secondary },
  submitBtn: { backgroundColor: theme.colors.primary[600], padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginTop: theme.spacing.md },
  submitBtnText: { color: theme.colors.text.inverse, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
});