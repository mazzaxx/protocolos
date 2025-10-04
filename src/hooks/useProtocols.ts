import { useState, useEffect, useRef, useCallback } from 'react';
import { Protocol } from '../types';

// Sistema de cache inteligente para evitar re-renders desnecessários
class ProtocolCache {
  private cache: Map<string, any> = new Map();
  private lastHash: string = '';
  private lastFetch: number = 0;
  
  // Gerar hash dos dados para detectar mudanças reais
  private generateHash(data: any): string {
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }
  
  // Verificar se os dados mudaram
  hasChanged(data: any): boolean {
    const newHash = this.generateHash(data);
    const changed = newHash !== this.lastHash;
    this.lastHash = newHash;
    return changed;
  }
  
  // Cache com TTL
  set(key: string, value: any, ttl: number = 5000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
    this.lastHash = '';
  }
  
  // Controle de throttling
  canFetch(minInterval: number = 1000): boolean {
    const now = Date.now();
    if (now - this.lastFetch < minInterval) {
      return false;
    }
    this.lastFetch = now;
    return true;
  }
}

// Instância global do cache
const protocolCache = new ProtocolCache();

// Sistema de debounce para evitar múltiplas requisições
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Função para buscar email do usuário por ID (com cache)
const getUserEmailById = async (userId: number): Promise<string> => {
  const cacheKey = `user_email_${userId}`;
  const cached = protocolCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || (window as any).__API_BASE_URL__ || '';
    const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'max-age=300' // 5 minutos de cache
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.funcionarios.find((f: any) => f.id === userId);
      const email = user ? user.email : 'Usuário não encontrado';
      
      // Cache por 10 minutos
      protocolCache.set(cacheKey, email, 600000);
      return email;
    }
    return 'Email não disponível';
  } catch (error) {
    console.error('Erro ao buscar email do usuário:', error);
    return 'Email não disponível';
  }
};

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // Refs para controle de estado
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  
  // Função otimizada para buscar protocolos
  const fetchProtocols = useCallback(async (forceRefresh = false) => {
    // Verificar se o componente ainda está montado
    if (!mountedRef.current) return;
    
    // Evitar múltiplas requisições simultâneas
    if (isFetchingRef.current && !forceRefresh) {
      return;
    }

    // Throttling inteligente
    if (!forceRefresh && !protocolCache.canFetch(1500)) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setConnectionStatus('checking');
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || (window as any).__API_BASE_URL__ || '';
      const url = `${apiBaseUrl}/api/protocolos`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=30',
          'X-Sync-Mode': forceRefresh ? 'force' : 'auto',
          'X-Client-Time': new Date().toISOString()
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.protocolos)) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Verificar se os dados realmente mudaram
      if (!forceRefresh && !protocolCache.hasChanged(data.protocolos)) {
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        return;
      }
      
      // Processar protocolos com validação
      const protocolsWithDates = data.protocolos.map((p: any) => {
        try {
          return {
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            documents: Array.isArray(p.documents) ? p.documents : [],
            guias: Array.isArray(p.guias) ? p.guias : [],
            activityLog: Array.isArray(p.activityLog) ? p.activityLog : []
          };
        } catch (error) {
          console.error('❌ Erro ao processar protocolo:', p.id, error);
          return null;
        }
      }).filter(Boolean);

      // Atualizar estado apenas se o componente ainda estiver montado
      if (mountedRef.current) {
        setProtocols(protocolsWithDates);
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        lastActivityRef.current = Date.now();
      }

    } catch (error) {
      console.error('Erro de sincronização:', error);
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        retryCountRef.current++;
        
        // Estratégia de retry exponencial
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);

        setTimeout(() => {
          if (mountedRef.current && retryCountRef.current < 5) {
            fetchProtocols(true);
          }
        }, retryDelay);
      }

    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, []);
  
  // Debounced version para evitar chamadas excessivas
  const debouncedFetch = useCallback(
    debounce(fetchProtocols, 300),
    [fetchProtocols]
  );
  
  // Effect principal para inicialização e polling
  useEffect(() => {
    // Fetch inicial
    fetchProtocols(true);
    
    // Configurar polling adaptativo
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        // Polling adaptativo baseado na atividade
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        let interval = 3000; // 3 segundos padrão
        
        if (timeSinceActivity > 60000) {
          interval = 10000; // 10 segundos se inativo por 1 minuto
        } else if (timeSinceActivity > 30000) {
          interval = 5000; // 5 segundos se inativo por 30 segundos
        }

        debouncedFetch(false);
      }, 3000); // Intervalo base de 3 segundos
    };
    
    setupPolling();


    // Cleanup
    return () => {
      mountedRef.current = false;
      isFetchingRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [debouncedFetch]);
  
  // Effect para carregar emails dos usuários
  useEffect(() => {
    const loadUserEmails = async () => {
      if (protocols.length === 0) return;
      
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const newEmails: Record<number, string> = {};
      
      // Carregar emails em paralelo com limite
      const batchSize = 5;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        
        const emailPromises = batch.map(async (userId) => {
          if (!userEmails[userId]) {
            try {
              const email = await getUserEmailById(userId);
              return { userId, email };
            } catch (error) {
              console.error(`Erro ao carregar email do usuário ${userId}:`, error);
              return { userId, email: 'Email não disponível' };
            }
          }
          return null;
        });
        
        const results = await Promise.all(emailPromises);
        results.forEach(result => {
          if (result) {
            newEmails[result.userId] = result.email;
          }
        });
      }
      
      if (Object.keys(newEmails).length > 0 && mountedRef.current) {
        setUserEmails(prev => ({ ...prev, ...newEmails }));
      }
    };
    
    loadUserEmails();
  }, [protocols, userEmails]);
  
  // Função para forçar refresh
  const forceRefresh = useCallback(() => {
    protocolCache.clear();
    lastActivityRef.current = Date.now();
    fetchProtocols(true);
  }, [fetchProtocols]);
  
  // Função otimizada para adicionar protocolo
  const addProtocol = useCallback(async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    lastActivityRef.current = Date.now();
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'create-protocol',
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(protocolData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Invalidar cache e forçar refresh imediato
        protocolCache.clear();
        
        // Múltiplas sincronizações para garantir consistência
        setTimeout(() => fetchProtocols(true), 100);
        setTimeout(() => fetchProtocols(true), 500);
        setTimeout(() => fetchProtocols(true), 1000);
        
        return data.protocolo;
      } else {
        throw new Error(data.message || 'Erro ao criar protocolo');
      }
    } catch (error) {
      console.error('Erro ao criar protocolo:', error);
      throw new Error(`Erro de conexão: ${error.message}`);
    }
  }, [fetchProtocols]);
  
  // Função otimizada para atualizar protocolo no servidor
  const updateProtocolInServer = useCallback(async (id: string, updates: any, performedBy?: string, performedById?: number) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';

      const updateData = { ...updates };
      if (performedBy) {
        updateData.newLogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'status_changed',
          description: `Status alterado para: ${updates.status || 'atualizado'}`,
          performedBy,
          performedById
        };
      }

      lastActivityRef.current = Date.now();
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'update-protocol',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Invalidar cache e sincronizar
        protocolCache.clear();
        setTimeout(() => fetchProtocols(true), 200);
        
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('Erro de atualização:', error);
      return false;
    }
  }, [fetchProtocols]);
  
  // Funções específicas para operações
  const updateProtocolStatus = useCallback(async (id: string, status: Protocol['status'], performedBy?: string, performedById?: number) => {
    const success = await updateProtocolInServer(id, { status }, performedBy, performedById);
    if (!success) {
      throw new Error('Falha ao atualizar status no servidor');
    }
  }, [updateProtocolInServer]);
  
  const returnProtocol = useCallback(async (id: string, returnReason: string, performedBy?: string, performedById?: number) => {
    const foundProtocol = protocols.find(p => p.id === id);
    if (!foundProtocol) {
      throw new Error('Protocolo não encontrado');
    }

    let updates: any = {};

    if (performedBy === 'Robô') {
      updates = {
        status: 'Aguardando',
        assignedTo: 'Manual',
        returnReason: `Devolvido pelo Robô: ${returnReason}`,
        newLogEntry: {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'returned',
          description: 'Protocolo devolvido pelo Robô para Fila Manual',
          performedBy: performedBy || 'Sistema',
          performedById,
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
          performedById,
          details: returnReason
        }
      };
    }
    
    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('Falha ao devolver protocolo no servidor');
    }
    
    // Notificação visual
    if (foundProtocol && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Protocolo Devolvido', {
        body: `Protocolo ${foundProtocol.processNumber} foi devolvido: ${returnReason}`,
        icon: '/favicon.ico'
      });
    }
  }, [protocols, updateProtocolInServer]);
  
  const moveProtocolToQueue = useCallback(async (id: string, assignedTo: Protocol['assignedTo'], performedBy?: string, performedById?: number) => {
    const updates = {
      assignedTo,
      status: 'Aguardando',
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'moved_to_queue',
        description: `Movido para: ${assignedTo ? `Fila do ${assignedTo}` : 'Fila do Robô'}`,
        performedBy: performedBy || 'Sistema',
        performedById
      }
    };

    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('Falha ao mover protocolo no servidor');
    }
  }, [updateProtocolInServer]);
  
  const moveMultipleProtocols = useCallback(async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string, performedById?: number) => {
    // Processar em lotes para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await Promise.all(batch.map(id => moveProtocolToQueue(id, assignedTo, performedBy, performedById)));
    }
  }, [moveProtocolToQueue]);
  
  const cancelProtocol = useCallback(async (id: string, performedBy?: string, performedById?: number) => {
    const updates = {
      status: 'Cancelado',
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'status_changed',
        description: 'Protocolo cancelado',
        performedBy: performedBy || 'Sistema',
        performedById
      }
    };
    
    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('Falha ao cancelar protocolo no servidor');
    }
  }, [updateProtocolInServer]);
  
  const updateProtocol = useCallback(async (id: string, updates: Partial<Protocol>, performedBy?: string, performedById?: number) => {
    const updateData = {
      ...updates,
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'resubmitted',
        description: 'Protocolo editado e reenviado',
        performedBy: performedBy || 'Usuário',
        performedById
      }
    };
    
    const success = await updateProtocolInServer(id, updateData);
    if (!success) {
      throw new Error('Falha ao atualizar protocolo no servidor');
    }
  }, [updateProtocolInServer]);
  
  return {
    protocols,
    userEmails,
    isLoading,
    connectionStatus,
    lastSyncTime,
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