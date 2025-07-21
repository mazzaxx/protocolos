import { useState, useEffect } from 'react';
import { Protocol } from '../types';

// Função para buscar email do usuário por ID
const getUserEmailById = async (userId: number): Promise<string> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.funcionarios.find((f: any) => f.id === userId);
      return user ? user.email : 'Usuário não encontrado';
    }
    return 'Email não disponível';
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Erro: Não foi possível conectar ao servidor');
      return 'Servidor offline';
    }
    console.error('Erro ao buscar email do usuário:', error);
    return 'Email não disponível';
  }
};

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('protocols');
    if (stored) {
      const parsed = JSON.parse(stored);
      setProtocols(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })));
    }
  }, [updateTrigger]);

  // Carregar emails dos usuários quando os protocolos mudarem
  useEffect(() => {
    const loadUserEmails = async () => {
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const emailPromises = uniqueUserIds.map(async (userId) => {
        if (!userEmails[userId]) {
          const email = await getUserEmailById(userId);
          return { userId, email };
        }
        return null;
      });

      const results = await Promise.all(emailPromises);
      const newEmails: Record<number, string> = {};
      
      results.forEach(result => {
        if (result) {
          newEmails[result.userId] = result.email;
        }
      });

      if (Object.keys(newEmails).length > 0) {
        setUserEmails(prev => ({ ...prev, ...newEmails }));
      }
    };

    if (protocols.length > 0) {
      loadUserEmails();
    }
  }, [protocols]);

  const saveProtocols = (newProtocols: Protocol[]) => {
    localStorage.setItem('protocols', JSON.stringify(newProtocols));
    setProtocols(newProtocols);
    // Força atualização de todos os componentes
    setUpdateTrigger(prev => prev + 1);
  };

  const forceRefresh = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  const addProtocol = (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    const newProtocol: Protocol = {
      ...protocol,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      queuePosition: protocols.filter(p => p.status === 'Aguardando').length + 1,
      activityLog: [{
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'created',
        description: 'Protocolo criado',
        performedBy: userEmails[protocol.createdBy] || 'Usuário'
      }]
    };
    
    const newProtocols = [...protocols, newProtocol];
    saveProtocols(newProtocols);
    return newProtocol;
  };

  const updateProtocolStatus = (id: string, status: Protocol['status'], performedBy?: string) => {
    const newProtocols = protocols.map(p => 
      p.id === id ? {
        ...p,
        status,
        updatedAt: new Date(),
        activityLog: [
          ...(p.activityLog || []),
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            action: 'status_changed',
            description: `Status alterado para: ${status}`,
            performedBy: performedBy || 'Sistema'
          }
        ]
      } : p
    );
    saveProtocols(newProtocols);
  };

  const returnProtocol = (id: string, returnReason: string, performedBy?: string) => {
    const newProtocols = protocols.map(p => 
      p.id === id ? {
        ...p,
        status: 'Devolvido' as const,
        returnReason,
        assignedTo: null, // Remove da fila atual
        updatedAt: new Date(),
        activityLog: [
          ...(p.activityLog || []),
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            action: 'returned',
            description: 'Protocolo devolvido',
            performedBy: performedBy || 'Sistema',
            details: returnReason
          }
        ]
      } : p
    );
    saveProtocols(newProtocols);
  };
  const moveProtocolToQueue = (id: string, assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    const newProtocols = protocols.map(p => 
      p.id === id ? {
        ...p,
        assignedTo,
        updatedAt: new Date(),
        activityLog: [
          ...(p.activityLog || []),
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            action: 'moved_to_queue',
            description: `Movido para: ${assignedTo ? `Fila do ${assignedTo}` : 'Fila do Robô'}`,
            performedBy: performedBy || 'Sistema'
          }
        ]
      } : p
    );
    saveProtocols(newProtocols);
  };

  const moveMultipleProtocols = (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    const newProtocols = protocols.map(p => 
      ids.includes(p.id) ? {
        ...p,
        assignedTo,
        updatedAt: new Date(),
        activityLog: [
          ...(p.activityLog || []),
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            action: 'moved_to_queue',
            description: `Movido para: ${assignedTo ? `Fila do ${assignedTo}` : 'Fila do Robô'}`,
            performedBy: performedBy || 'Sistema'
          }
        ]
      } : p
    );
    saveProtocols(newProtocols);
  };

  const updateProtocol = (id: string, updates: Partial<Protocol>, performedBy?: string) => {
    const newProtocols = protocols.map(p => 
      p.id === id ? {
        ...p,
        ...updates,
        updatedAt: new Date(),
        activityLog: [
          ...(p.activityLog || []),
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            action: 'resubmitted',
            description: 'Protocolo editado e reenviado',
            performedBy: performedBy || userEmails[p.createdBy] || 'Usuário'
          }
        ]
      } : p
    );
    saveProtocols(newProtocols);
  };
  return {
    protocols,
    userEmails,
    updateTrigger,
    forceRefresh,
    addProtocol,
    updateProtocolStatus,
    returnProtocol,
    moveProtocolToQueue,
    moveMultipleProtocols,
    updateProtocol,
  };
}