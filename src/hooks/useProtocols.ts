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
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
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
      console.log('🔄 Requisição já em andamento, ignorando...');
      return;
    }
    
    // Throttling inteligente
    if (!forceRefresh && !protocolCache.canFetch(1500)) {
      console.log('⏱️ Throttling ativo, aguardando...');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setConnectionStatus('checking');
    
    const startTime = Date.now();
    console.log('🔄 SINCRONIZAÇÃO INICIADA:', forceRefresh ? 'FORÇADA' : 'AUTOMÁTICA');
    
    try {
      // Detectar ambiente e usar URL apropriada
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('webcontainer-api.io') ||
                           window.location.hostname.includes('bolt.new');
      
      const url = isDevelopment 
        ? '/api/protocolos'  // Usar proxy em desenvolvimento
        : `${import.meta.env.VITE_API_BASE_URL || 'https://sistema-protocolos-juridicos-production.up.railway.app'}/api/protocolos`;
      
      console.log('🌐 Conectando em:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=30',
          'X-Sync-Mode': forceRefresh ? 'force' : 'auto',
          'X-Client-Time': new Date().toISOString()
        },
        credentials: 'include',
        mode: 'cors',
        signal: AbortSignal.timeout(12000) // 12 segundos timeout
      });
      
      const duration = Date.now() - startTime;
      console.log(`📡 Resposta recebida em ${duration}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`🚨 HTTP ERROR: ${response.status} - ${response.statusText}`);
        console.error(`🔗 URL tentada: ${url}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.protocolos)) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Verificar se os dados realmente mudaram
      if (!forceRefresh && !protocolCache.hasChanged(data.protocolos)) {
        console.log('📊 Dados inalterados, mantendo cache');
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
      
      console.log(`✅ SINCRONIZAÇÃO COMPLETA: ${protocolsWithDates.length} protocolos`);
      console.log(`📊 Performance: ${duration}ms`);
      console.log(`🎯 Filas: Robô(${protocolsWithDates.filter(p => !p.assignedTo && p.status === 'Aguardando').length}) Carlos(${protocolsWithDates.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length}) Deyse(${protocolsWithDates.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length})`);
      
      // Atualizar estado apenas se o componente ainda estiver montado
      if (mountedRef.current) {
        setProtocols(protocolsWithDates);
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        lastActivityRef.current = Date.now();
      }
      
    } catch (error) {
      console.error('❌ ERRO DE SINCRONIZAÇÃO:', error);
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        retryCountRef.current++;
        
        // Limitar tentativas de retry
        if (retryCountRef.current < 3) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
          console.log(`🔄 Tentativa ${retryCountRef.current}, próxima em ${retryDelay}ms`);
          
          setTimeout(() => {
            if (mountedRef.current) {
              fetchProtocols(true);
            }
          }, retryDelay);
        } else {
          console.log('🛑 Máximo de tentativas atingido, parando sync automático');
        }
      }
      
      if (error.name === 'AbortError') {
        console.error('⏱️ TIMEOUT: Servidor demorou muito para responder');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('🚨 ERRO CRÍTICO: Backend inacessível');
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
    console.log('🚀 useProtocols: Inicializando sistema otimizado...');
    console.log('🌐 Backend:', import.meta.env.VITE_API_BASE_URL || 'PROXY LOCAL');
    
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
        
        console.log(`🔄 POLLING AUTOMÁTICO (${interval}ms): Verificando atualizações...`);
        debouncedFetch(false);
      }, 3000); // Intervalo base de 3 segundos
    };
    
    setupPolling();
    
    // Cleanup
    return () => {
      console.log('🛑 useProtocols: Limpando recursos...');
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
    console.log('🔄 Forçando refresh dos protocolos...');
    protocolCache.clear();
    lastActivityRef.current = Date.now();
    fetchProtocols(true);
  }, [fetchProtocols]);
  
  // Função otimizada para adicionar protocolo
  const addProtocol = useCallback(async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('🚀 CRIANDO PROTOCOLO - Sincronização iniciada');
    lastActivityRef.current = Date.now();
    
    try {
      // Detectar ambiente e usar URL apropriada
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('webcontainer-api.io') ||
                           window.location.hostname.includes('bolt.new');
      
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      const url = isDevelopment 
        ? '/api/protocolos'
        : `${import.meta.env.VITE_API_BASE_URL || 'https://sistema-protocolos-juridicos-production.up.railway.app'}/api/protocolos`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'create-protocol',
        },
        credentials: 'include',
        mode: 'cors',
        signal: AbortSignal.timeout(15000), // 15 segundos para criação
        body: JSON.stringify(protocolData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🎉 PROTOCOLO CRIADO COM SUCESSO!');
        
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
      console.error('🚨 ERRO CRÍTICO:', error);
      throw new Error(`ERRO DE CONEXÃO: ${error.message}`);
    }
  }, [fetchProtocols]);
  
  // Função otimizada para atualizar protocolo no servidor
  const updateProtocolInServer = useCallback(async (id: string, updates: any, performedBy?: string) => {
    try {
      // Detectar ambiente e usar URL apropriada
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('webcontainer-api.io') ||
                           window.location.hostname.includes('bolt.new');
      
      const updateData = { ...updates };
      if (performedBy) {
        updateData.newLogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'status_changed',
          description: `Status alterado para: ${updates.status || 'atualizado'}`,
          performedBy
        };
      }
      
      console.log('🔄 ATUALIZANDO PROTOCOLO:', id);
      lastActivityRef.current = Date.now();
      
      const url = isDevelopment 
        ? `/api/protocolos/${id}`
        : `${import.meta.env.VITE_API_BASE_URL || 'https://sistema-protocolos-juridicos-production.up.railway.app'}/api/protocolos/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'update-protocol',
        },
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 segundos para atualização
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ PROTOCOLO ATUALIZADO - Sincronizando...');
        
        // Invalidar cache e sincronizar
        protocolCache.clear();
        setTimeout(() => fetchProtocols(true), 200);
        
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('🚨 ERRO DE ATUALIZAÇÃO:', error);
      return false;
    }
  }, [fetchProtocols]);
  
  // Funções específicas para operações
  const updateProtocolStatus = useCallback(async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    if (!success) {
      throw new Error('Falha ao atualizar status no servidor');
    }
  }, [updateProtocolInServer]);
  
  const returnProtocol = useCallback(async (id: string, returnReason: string, performedBy?: string) => {
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
    
    // Notificação visual
    if (foundProtocol && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Protocolo Devolvido', {
        body: `Protocolo ${foundProtocol.processNumber} foi devolvido: ${returnReason}`,
        icon: '/favicon.ico'
      });
    }
  }, [protocols, updateProtocolInServer]);
  
  const moveProtocolToQueue = useCallback(async (id: string, assignedTo: Protocol['assignedTo'], performedBy?: string) => {
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
  }, [updateProtocolInServer]);
  
  const moveMultipleProtocols = useCallback(async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    console.log(`🔄 Movendo ${ids.length} protocolos para ${assignedTo || 'Robô'}`);
    
    // Processar em lotes para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await Promise.all(batch.map(id => moveProtocolToQueue(id, assignedTo, performedBy)));
    }
    
    console.log('✅ Movimentação em lote concluída');
  }, [moveProtocolToQueue]);
  
  const cancelProtocol = useCallback(async (id: string, performedBy?: string) => {
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
  }, [updateProtocolInServer]);
  
  const updateProtocol = useCallback(async (id: string, updates: Partial<Protocol>, performedBy?: string) => {
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