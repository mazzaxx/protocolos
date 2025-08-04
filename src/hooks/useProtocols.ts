import { useState, useEffect } from 'react';
import { Protocol } from '../types';

// Cache otimizado
let lastFetchTime = 0;
let lastDataHash = '';
let isCurrentlyFetching = false;
let fetchController: AbortController | null = null;

// Função para buscar email do usuário por ID (otimizada)
const getUserEmailById = async (userId: number): Promise<string> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const controller = new AbortController();
    
    const response = await Promise.race([
      fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutos
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          controller.abort();
          reject(new Error('Timeout'));
        }, 5000)
      )
    ]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.funcionarios.find((f: any) => f.id === userId);
      return user ? user.email : 'Usuário não encontrado';
    }
    return 'Email não disponível';
  } catch (error) {
    console.error('❌ Erro ao buscar email:', error);
    return 'Email não disponível';
  }
};

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Função otimizada para buscar protocolos
  const fetchProtocols = async (forceRefresh = false) => {
    const now = Date.now();
    
    // Evitar múltiplas requisições
    if (!forceRefresh && isCurrentlyFetching) {
      console.log('🔄 Requisição já em andamento');
      return;
    }

    // Throttle inteligente
    const minInterval = forceRefresh ? 100 : 1000;
    if (!forceRefresh && (now - lastFetchTime) < minInterval) {
      console.log(`⏱️ Throttle ativo (${minInterval}ms)`);
      return;
    }

    // Cancelar requisição anterior se existir
    if (fetchController) {
      fetchController.abort();
    }

    fetchController = new AbortController();
    isCurrentlyFetching = true;
    setIsLoading(true);
    lastFetchTime = now;
    setConnectionStatus('checking');
    
    console.log('🔄 Buscando protocolos...', forceRefresh ? '(FORÇADO)' : '(AUTO)');
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiBaseUrl}/api/protocolos`;
      
      const response = await Promise.race([
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=2',
            'X-Sync-Mode': forceRefresh ? 'force' : 'auto',
          },
          credentials: 'include',
          mode: 'cors',
          signal: fetchController.signal
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            fetchController?.abort();
            reject(new Error('Timeout'));
          }, 8000)
        )
      ]);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Protocolos recebidos: ${data.total || 0} (${data.duration || 'N/A'})`);
      
      if (data.success && Array.isArray(data.protocolos)) {
        // Verificar mudanças usando hash
        const dataHash = JSON.stringify(data.protocolos).length + data.protocolos.length;
        const dataChanged = dataHash !== lastDataHash;
        
        if (!dataChanged && !forceRefresh) {
          console.log('📊 Dados inalterados');
          setConnectionStatus('connected');
          return;
        }
        
        lastDataHash = dataHash;
        
        // Processar protocolos
        const protocolsWithDates = data.protocolos.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        
        console.log(`✅ Sincronização: ${protocolsWithDates.length} protocolos`);
        console.log(`📊 Status: A:${protocolsWithDates.filter(p => p.status === 'Aguardando').length} E:${protocolsWithDates.filter(p => p.status === 'Em Execução').length} P:${protocolsWithDates.filter(p => p.status === 'Peticionado').length} D:${protocolsWithDates.filter(p => p.status === 'Devolvido').length}`);
        
        setProtocols(protocolsWithDates);
        setConnectionStatus('connected');
        
      } else {
        console.error('❌ Resposta inválida:', data);
        setConnectionStatus('disconnected');
        throw new Error('Resposta inválida');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar protocolos:', error.message);
      setConnectionStatus('disconnected');
      
      if (error.name === 'AbortError') {
        console.log('🛑 Requisição cancelada');
        return;
      }
      
      if (error.message === 'Timeout' || error.message.includes('Failed to fetch')) {
        console.error('🚨 ERRO DE CONEXÃO COM RAILWAY!');
        console.error('🔧 Verifique: https://sistema-protocolos-juridicos-production.up.railway.app');
      }
      
      // Manter lista vazia em caso de erro
      setProtocols([]);
      
      throw error;
    } finally {
      isCurrentlyFetching = false;
      setIsLoading(false);
      fetchController = null;
    }
  };

  useEffect(() => {
    console.log('🚀 useProtocols: Iniciando...');
    console.log('🌐 Backend:', import.meta.env.VITE_API_BASE_URL || 'PROXY LOCAL');
    
    fetchProtocols(true); // Fetch inicial forçado
    
    // Polling otimizado com intervalo adaptativo
    let pollInterval = 2000; // Começar com 2 segundos
    
    const interval = setInterval(() => {
      // Intervalo adaptativo baseado na atividade
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      
      if (timeSinceLastFetch > 30000) {
        pollInterval = 5000; // Reduzir frequência após inatividade
      } else {
        pollInterval = 2000; // Manter frequência alta com atividade
      }
      
      console.log(`🔄 Polling (${pollInterval}ms)`);
      fetchProtocols(false);
    }, pollInterval);
    
    return () => {
      console.log('🛑 useProtocols: Cleanup');
      clearInterval(interval);
      if (fetchController) {
        fetchController.abort();
      }
      isCurrentlyFetching = false;
    };
  }, [updateTrigger]);

  // Carregar emails dos usuários (otimizado)
  useEffect(() => {
    const loadUserEmails = async () => {
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const emailPromises = uniqueUserIds
        .filter(userId => !userEmails[userId])
        .map(async (userId) => {
          const email = await getUserEmailById(userId);
          return { userId, email };
        });

      if (emailPromises.length > 0) {
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
      }
    };

    if (protocols.length > 0) {
      loadUserEmails();
    }
  }, [protocols]);

  const forceRefresh = () => {
    console.log('🔄 Forçando refresh...');
    lastDataHash = ''; // Invalidar cache
    setUpdateTrigger(prev => prev + 1);
  };

  // Função otimizada para adicionar protocolo
  const addProtocol = async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('🚀 Criando protocolo...');
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      const controller = new AbortController();
      const url = `${apiBaseUrl}/api/protocolos`;
      
      const response = await Promise.race([
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sync-Action': 'create-protocol',
          },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify(protocolData),
          signal: controller.signal
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            controller.abort();
            reject(new Error('Timeout'));
          }, 15000)
        )
      ]);

      console.log('📡 Create response:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Protocolo criado:', data.success);
      
      if (data.success) {
        console.log(`🎉 Protocolo criado: ${data.protocolo?.id}`);
        
        // Forçar sincronização imediata
        setTimeout(() => {
          console.log('🔄 Sincronização imediata...');
          lastDataHash = '';
          forceRefresh();
        }, 200);
        
        return data.protocolo;
      } else {
        throw new Error(data.message || 'Erro ao criar protocolo');
      }
    } catch (error: any) {
      console.error('🚨 Erro ao criar protocolo:', error);
      
      if (error.message === 'Timeout' || error.message.includes('Failed to fetch')) {
        throw new Error('ERRO DE CONEXÃO: Não foi possível conectar ao servidor. O protocolo NÃO foi salvo. Verifique sua conexão e tente novamente.');
      }
      
      throw error;
    }
  };

  // Função otimizada para atualizar protocolo no servidor
  const updateProtocolInServer = async (id: string, updates: any, performedBy?: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      const updateData = { ...updates };
      if (performedBy) {
        updateData.newLogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'status_changed',
          description: `Status alterado: ${updates.status || 'atualizado'}`,
          performedBy
        };
      }
      
      console.log(`🔄 Atualizando protocolo: ${id}`);
      
      const controller = new AbortController();
      
      const response = await Promise.race([
        fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Sync-Action': 'update-protocol',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
          signal: controller.signal
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            controller.abort();
            reject(new Error('Timeout'));
          }, 10000)
        )
      ]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Protocolo atualizado');
        
        // Forçar sincronização
        setTimeout(() => {
          lastDataHash = '';
          forceRefresh();
        }, 300);
        
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar');
      }
    } catch (error: any) {
      console.error('🚨 Erro ao atualizar:', error);
      return false;
    }
  };

  const updateProtocolStatus = async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    
    if (!success) {
      throw new Error('Falha ao atualizar status no servidor');
    }
    
    lastDataHash = '';
  };

  const returnProtocol = async (id: string, returnReason: string, performedBy?: string) => {
    const foundProtocol = protocols.find(p => p.id === id);
    if (!foundProtocol) {
      throw new Error('Protocolo não encontrado');
    }
    
    let updates: any = {};
    
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
      throw new Error('Falha ao devolver protocolo no servidor');
    }
    
    lastDataHash = '';

    // Notificação visual
    if (foundProtocol) {
      blinkFavicon();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Protocolo Devolvido', {
          body: `Protocolo ${foundProtocol.processNumber} foi devolvido: ${returnReason}`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Função para fazer favicon piscar
  const blinkFavicon = () => {
    const originalFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const originalHref = originalFavicon?.href || '/vite.svg';
    
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      let isRed = false;
      let blinkCount = 0;
      const maxBlinks = 6;
      
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
      throw new Error('Falha ao mover protocolo no servidor');
    }
    
    lastDataHash = '';
  };

  const moveMultipleProtocols = async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    for (const id of ids) {
      await moveProtocolToQueue(id, assignedTo, performedBy);
    }
    
    lastDataHash = '';
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
      throw new Error('Falha ao cancelar protocolo no servidor');
    }
    
    lastDataHash = '';
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
      throw new Error('Falha ao atualizar protocolo no servidor');
    }
    
    lastDataHash = '';
  };

  return {
    protocols,
    userEmails,
    updateTrigger,
    isLoading,
    connectionStatus,
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