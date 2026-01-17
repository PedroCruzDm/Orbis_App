// Sistema de eventos para sincronizar atualizações da dashboard
class DashboardEvents {
  constructor() {
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Retorna função para cancelar inscrição
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Dispara evento de atualização de dados
  triggerRefetch() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erro ao executar callback de refetch:', error);
      }
    });
  }
}

export const dashboardEvents = new DashboardEvents();
