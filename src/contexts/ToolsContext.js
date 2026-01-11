import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ToolsContext = createContext();

export const useTools = () => {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error('useTools deve ser usado dentro de ToolsProvider');
  }
  return context;
};

export const ToolsProvider = ({ children }) => {
  const [tools, setTools] = useState({
    modoFoco: true,
    modoSono: true,
    agenda: true,
  });
  const [openToolsModal, setOpenToolsModal] = useState(null);

  // Carregar ferramentas do AsyncStorage ao iniciar
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const saved = await AsyncStorage.getItem('@orbis_tools');
      if (saved) {
        setTools(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Erro ao carregar ferramentas:', error);
    }
  };

  const updateTools = async (newTools) => {
    try {
      setTools(newTools);
      await AsyncStorage.setItem('@orbis_tools', JSON.stringify(newTools));
    } catch (error) {
      console.log('Erro ao salvar ferramentas:', error);
    }
  };

  const triggerOpenToolsModal = () => {
    if (openToolsModal) {
      openToolsModal();
    }
  };

  return (
    <ToolsContext.Provider value={{ tools, updateTools, setOpenToolsModal, triggerOpenToolsModal }}>
      {children}
    </ToolsContext.Provider>
  );
};
