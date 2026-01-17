import React, { useState } from "react";
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

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalType, setModalType] = useState("fixed");
  
  // Estados para cada tipo de evento
  const [fixedCommitments, setFixedCommitments] = useState([]);
  const [flexibleTasks, setFlexibleTasks] = useState([]);
  const [essentialActivities, setEssentialActivities] = useState([]);
  const [focusBlocks, setFocusBlocks] = useState([]);
  
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    duration: "60",
    type: "Trabalho",
    priority: "MEDIUM",
    recurrence: "Nenhuma",
    preferredSlot: "AFTERNOON",
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
        break;
    }
    
    setForm({ title: "", startTime: "09:00", duration: "60", type: "Trabalho", priority: "MEDIUM", recurrence: "Nenhuma", preferredSlot: "AFTERNOON" });
    setShowEventModal(false);
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"];

  const allEvents = [
    ...fixedCommitments.map(e => ({ ...e, eventType: "fixed" })),
    ...flexibleTasks.map(e => ({ ...e, eventType: "flexible" })),
    ...essentialActivities.map(e => ({ ...e, eventType: "essential" })),
    ...focusBlocks.map(e => ({ ...e, eventType: "focus" })),
  ];
  
  const todayEvents = allEvents
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
                    {allEvents.some(e => {
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
                    </View>
                  </View>
                </View>
              ))}
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
  };
  return colors[eventType] || "#6B7280";
};

const getEventTypeLabel = (eventType) => {
  const labels = {
    fixed: "Fixo",
    flexible: "Flexível",
    essential: "Essencial",
    focus: "Foco",
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
