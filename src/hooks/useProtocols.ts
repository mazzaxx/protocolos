import { useState, useEffect } from 'react';
import { Protocol } from '../types';

// Função para buscar email do usuário por ID
const getUserEmailById = async (userId: number): Promise<string> => {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
      credentials: 'include'
    });
    
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
    console.error('Erro ao buscar email do usuário:', error);
    return 'Email não disponível';
  }
};

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Função para buscar protocolos do servidor
  const fetchProtocols = async (forceRefresh = false) => {
    // Evitar múltiplas requisições simultâneas
    const now = Date.now();
    if (!forceRefresh && isLoading) {
      console.log('🔄 Requisição já em andamento, ignorando...');
      return;
    }

    // Throttle: evitar requisições muito frequentes (mínimo 1 segundo)
    if (!forceRefresh && (now - lastFetchTime) < 1000) {
      console.log('⏱️ Throttle ativo, aguardando...');
      return;
    }

    setIsLoading(true);
    setLastFetchTime(now);
    
    console.log('🔄 Buscando protocolos do servidor...');
    console.log('🌐 Modo:', forceRefresh ? 'Forçado' : 'Normal');
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiBaseUrl}/api/protocolos`;
      console.log('📡 URL da requisição:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=0',
        },
        credentials: 'include'
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      if (!response.ok) {
        console.error('❌ Erro na resposta:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Dados recebidos do servidor:');
      console.log('✅ Success:', data.success);
      console.log('📊 Total de protocolos:', data.total || data.protocolos?.length || 0);
      console.log('⏰ Timestamp do servidor:', data.timestamp);
      
      if (data.success && Array.isArray(data.protocolos)) {
        const protocolsWithDates = data.protocolos.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        
        console.log('✅ Protocolos processados:', protocolsWithDates.length);
        console.log('📋 Últimos 3 protocolos:', protocolsWithDates.slice(0, 3).map(p => ({
          id: p.id,
          processNumber: p.processNumber,
          status: p.status,
          assignedTo: p.assignedTo,
          createdBy: p.createdBy,
          createdAt: p.createdAt
        })));
        
        setProtocols(protocolsWithDates);
        
      } else {
        console.error('❌ Resposta inválida do servidor:', data);
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar protocolos:', error);
      
      // REMOVIDO: Fallback para localStorage - isso causava o problema de sincronização
      // Agora sempre mostra erro quando não consegue conectar ao servidor
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('🚨 ERRO CRÍTICO: Não foi possível conectar ao servidor');
        console.error('🔧 Verifique se o servidor backend está rodando');
        console.error('🌐 URL tentada:', import.meta.env.VITE_API_BASE_URL || 'localhost');
      }
      
      // Manter lista vazia se não conseguir conectar
      setProtocols([]);
      
      // Re-throw o erro para que o componente possa lidar com ele se necessário
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useProtocols: Iniciando fetch inicial...');
    fetchProtocols(true); // Forçar refresh inicial
    
    // Configurar polling para atualizar a cada 3 segundos (mais frequente para melhor sincronização)
    const interval = setInterval(() => {
      console.log('🔄 Polling: Atualizando protocolos automaticamente...');
      fetchProtocols(false);
    }, 3000); // 3 segundos
    
    return () => {
      console.log('🛑 useProtocols: Limpando interval');
      clearInterval(interval);
    };
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
    console.log('🔄 Forçando refresh dos protocolos...');
    setUpdateTrigger(prev => prev + 1);
  };

  const addProtocol = async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('➕ Adicionando novo protocolo:', protocol);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Buscar email do usuário para o log
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      const url = `${apiBaseUrl}/api/protocolos`;
      console.log('📡 Enviando protocolo para:', url);
      console.log('📦 Dados enviados:', JSON.stringify(protocolData, null, 2));
      
      // Configurar timeout e retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(protocolData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 Status da resposta:', response.status);
      
      if (!response.ok) {
        let errorText = 'Erro desconhecido';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `HTTP ${response.status} - ${response.statusText}`;
        }
        console.error('❌ Erro na resposta do servidor:', response.status, errorText);
        
        if (response.status >= 500) {
          throw new Error('Erro interno do servidor. Tente novamente em alguns minutos.');
        } else if (response.status === 404) {
          throw new Error('Serviço não encontrado. Verifique a configuração do sistema.');
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Verifique suas permissões.');
        } else {
          throw new Error(`Erro do servidor (${response.status}): ${errorText}`);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Resposta inválida do servidor. Tente novamente.');
      }
      
      console.log('📦 Resposta do servidor:', data);
      
      if (data.success) {
        console.log('✅ Protocolo criado com sucesso no servidor!');
        console.log('🆔 ID do protocolo criado:', data.protocolo?.id);
        
        // Forçar atualização imediata da lista
        setTimeout(() => {
          console.log('🔄 Forçando refresh após criação...');
          forceRefresh();
        }, 500);
        
        return data.protocolo;
      } else {
        console.error('❌ Resposta sem sucesso do servidor:', data);
        throw new Error(data.message || 'Erro ao criar protocolo no servidor');
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO: Falha ao adicionar protocolo ao servidor:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: O servidor demorou muito para responder. Tente novamente.');
        } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          throw new Error('Erro de conexão: Não foi possível conectar ao servidor.\n\nVerifique sua conexão com a internet e tente novamente.');
        } else {
          // Re-throw erros específicos que já foram tratados
          throw error;
        }
      } else {
        throw new Error('Erro desconhecido ao conectar com o servidor.');
      }
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
      
      console.log('🔄 Atualizando protocolo no servidor:', id);
      console.log('📦 Dados de atualização:', updateData);
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar no servidor:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Protocolo atualizado no servidor');
        
        // Forçar atualização imediata da lista
        setTimeout(() => {
          console.log('🔄 Forçando refresh após atualização...');
          forceRefresh();
        }, 500);
        
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO: Falha ao atualizar protocolo no servidor:', error);
      
      // REMOVIDO: Fallback para localStorage
      // Agora sempre falha se não conseguir atualizar no servidor
      
      return false;
    }
  };

  const updateProtocolStatus = async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    
    if (!success) {
      throw new Error('Falha ao atualizar status no servidor');
    }
  };

  const returnProtocol = async (id: string, returnReason: string, performedBy?: string) => {
    const foundProtocol = protocols.find(p => p.id === id);
    if (!foundProtocol) {
      throw new Error('Protocolo não encontrado');
    }
    
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
      throw new Error('Falha ao devolver protocolo no servidor');
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
      throw new Error('Falha ao mover protocolo no servidor');
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
      throw new Error('Falha ao cancelar protocolo no servidor');
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
      throw new Error('Falha ao atualizar protocolo no servidor');
    }
  };

  return {
    protocols,
    userEmails,
    updateTrigger,
    isLoading,
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