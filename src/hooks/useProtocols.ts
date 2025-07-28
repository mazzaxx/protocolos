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

  // Função para buscar protocolos do servidor
  const fetchProtocols = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/protocolos`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const protocolsWithDates = data.protocolos.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        setProtocols(protocolsWithDates);
      }
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error);
      // Em caso de erro, tentar carregar do localStorage como fallback
      const stored = localStorage.getItem('protocols');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProtocols(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
      }
    }
  };

  useEffect(() => {
    fetchProtocols();
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

  const forceRefresh = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  const addProtocol = async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Buscar email do usuário para o log
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(protocolData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Atualizar lista local
        forceRefresh();
        return data.protocolo;
      } else {
        throw new Error(data.message || 'Erro ao criar protocolo');
      }
    } catch (error) {
      console.error('Erro ao adicionar protocolo:', error);
      
      // Fallback: salvar no localStorage
      const newProtocol: Protocol = {
        ...protocol,
        id: Date.now().toString(),
        needsGuia: protocol.needsGuia || false,
        guias: protocol.guias || [],
        processType: protocol.processType || 'civel',
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
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
      return newProtocol;
    }
  };

  const updateProtocolInServer = async (id: string, updates: any, performedBy?: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Adicionar entrada no log se performedBy foi fornecido
      const updateData = { ...updates };
      if (performedBy) {
        updateData.newLogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'status_changed',
          description: `Status alterado para: ${updates.status || 'atualizado'}`,
          performedBy
        };
      }
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        forceRefresh();
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('Erro ao atualizar protocolo no servidor:', error);
      return false;
    }
  };

  const updateProtocolStatus = async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    
    if (!success) {
      // Fallback: atualizar localStorage
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
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
    }
  };

  const returnProtocol = async (id: string, returnReason: string, performedBy?: string) => {
    const foundProtocol = protocols.find(p => p.id === id);
    if (!foundProtocol) return;
    
    let updates: any = {};
    
    // Se devolvido pelo robô, vai para fila do Carlos com status especial
    if (performedBy === 'Robô') {
      updates = {
        status: 'Aguardando',
        assignedTo: 'Carlos',
        returnReason: `Devolvido pelo Robô: ${returnReason}`,
        newLogEntry: {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'returned',
          description: 'Protocolo devolvido pelo Robô para fila do Carlos',
          performedBy: performedBy || 'Sistema',
          details: returnReason
        }
      };
    } else {
      // Devolução normal (por funcionários) - vai para status "Devolvido"
      updates = {
        status: 'Devolvido',
        returnReason,
        assignedTo: null,
        newLogEntry: {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'returned',
          description: 'Protocolo devolvido',
          performedBy: performedBy || 'Sistema',
          details: returnReason
        }
      };
    }

    const success = await updateProtocolInServer(id, updates);
    
    if (!success) {
      // Fallback: atualizar localStorage
      const newProtocols = protocols.map(p => 
        p.id === id ? {
          ...p,
          ...updates,
          updatedAt: new Date(),
          activityLog: [
            ...(p.activityLog || []),
            updates.newLogEntry
          ]
        } : p
      );
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
    }

    // Fazer o ícone do navegador piscar quando protocolo é devolvido
    if (foundProtocol) {
      blinkFavicon();
      
      // Mostrar notificação do navegador se possível
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Protocolo Devolvido', {
          body: `Seu protocolo ${foundProtocol.processNumber} foi devolvido: ${returnReason}`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Função para fazer o favicon piscar
  const blinkFavicon = () => {
    const originalFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const originalHref = originalFavicon?.href || '/vite.svg';
    
    // Criar um canvas para desenhar um favicon vermelho piscante
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      let isRed = false;
      let blinkCount = 0;
      const maxBlinks = 10;
      
      const blink = () => {
        ctx.clearRect(0, 0, 32, 32);
        ctx.fillStyle = isRed ? '#ff0000' : '#646cff';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', 16, 22);
        
        const dataURL = canvas.toDataURL();
        if (originalFavicon) {
          originalFavicon.href = dataURL;
        }
        
        isRed = !isRed;
        blinkCount++;
        
        if (blinkCount < maxBlinks) {
          setTimeout(blink, 500);
        } else {
          // Restaurar favicon original
          if (originalFavicon) {
            originalFavicon.href = originalHref;
          }
        }
      };
      
      blink();
    }
  };

  const moveProtocolToQueue = async (id: string, assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    const updates = {
      assignedTo,
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'moved_to_queue',
        description: `Movido para: ${assignedTo ? `Fila do ${assignedTo}` : 'Fila do Robô'}`,
        performedBy: performedBy || 'Sistema'
      }
    };

    const success = await updateProtocolInServer(id, updates);
    
    if (!success) {
      // Fallback: atualizar localStorage
      const newProtocols = protocols.map(p => 
        p.id === id ? {
          ...p,
          assignedTo,
          updatedAt: new Date(),
          activityLog: [
            ...(p.activityLog || []),
            updates.newLogEntry
          ]
        } : p
      );
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
    }
  };

  const moveMultipleProtocols = async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    // Atualizar cada protocolo individualmente
    for (const id of ids) {
      await moveProtocolToQueue(id, assignedTo, performedBy);
    }
  };

  const cancelProtocol = async (id: string, performedBy?: string) => {
    const updates = {
      status: 'Cancelado',
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'status_changed',
        description: 'Protocolo cancelado',
        performedBy: performedBy || 'Sistema'
      }
    };

    const success = await updateProtocolInServer(id, updates);
    
    if (!success) {
      // Fallback: atualizar localStorage
      const newProtocols = protocols.map(p => 
        p.id === id ? {
          ...p,
          status: 'Cancelado' as const,
          updatedAt: new Date(),
          activityLog: [
            ...(p.activityLog || []),
            updates.newLogEntry
          ]
        } : p
      );
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
    }
  };

  const updateProtocol = async (id: string, updates: Partial<Protocol>, performedBy?: string) => {
    const updateData = {
      ...updates,
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'resubmitted',
        description: 'Protocolo editado e reenviado',
        performedBy: performedBy || 'Usuário'
      }
    };

    const success = await updateProtocolInServer(id, updateData);
    
    if (!success) {
      // Fallback: atualizar localStorage
      const newProtocols = protocols.map(p => 
        p.id === id ? {
          ...p,
          ...updates,
          updatedAt: new Date(),
          activityLog: [
            ...(p.activityLog || []),
            updateData.newLogEntry
          ]
        } : p
      );
      localStorage.setItem('protocols', JSON.stringify(newProtocols));
      setProtocols(newProtocols);
    }
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
    cancelProtocol,
    updateProtocol,
  };
}