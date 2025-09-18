import { useState, useEffect, useRef, useCallback } from 'react';
import { Protocol } from '../types';

/**
 * HOOK OTIMIZADO PARA SQUARE CLOUD
 * 
 * Gerencia protocolos com comunicação otimizada para Square Cloud
 * Usa URLs relativas já que frontend e backend estão no mesmo domínio
 */

class ProtocolCache {
  private cache: Map<string, any> = new Map();
  private lastHash: string = '';
  private lastFetch: number = 0;
  
  private generateHash(data: any): string {
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }
  
  hasChanged(data: any): boolean {
    const newHash = this.generateHash(data);
    const changed = newHash !== this.lastHash;
    this.lastHash = newHash;
    return changed;
  }
  
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
  
  canFetch(minInterval: number = 1000): boolean {
    const now = Date.now();
    if (now - this.lastFetch < minInterval) {
      return false;
    }
    this.lastFetch = now;
    return true;
  }
}

const protocolCache = new ProtocolCache();

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

const getUserEmailById = async (userId: number): Promise<string> => {
  const cacheKey = `user_email_${userId}`;
  const cached = protocolCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    // Square Cloud: URL relativa (mesmo domínio)
    const response = await fetch('/api/admin/funcionarios', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'max-age=300',
        'X-Platform': 'Square Cloud'
      }
    });
    
    if (!response.ok) {
      throw new Error(`[SQUARE CLOUD] HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.funcionarios.find((f: any) => f.id === userId);
      const email = user ? user.email : 'Usuário não encontrado';
      
      protocolCache.set(cacheKey, email, 600000);
      return email;
    }
    return 'Email não disponível (Square Cloud)';
  } catch (error) {
    console.error('[SQUARE CLOUD] Erro ao buscar email do usuário:', error);
    return 'Email não disponível (Square Cloud)';
  }
};

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  
  const fetchProtocols = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    if (isFetchingRef.current && !forceRefresh) {
      console.log('[SQUARE CLOUD] 🔄 Requisição já em andamento, ignorando...');
      return;
    }
    
    if (!forceRefresh && !protocolCache.canFetch(1500)) {
      console.log('[SQUARE CLOUD] ⏱️ Throttling ativo, aguardando...');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setConnectionStatus('checking');
    
    const startTime = Date.now();
    console.log('[SQUARE CLOUD] 🔄 SINCRONIZAÇÃO INICIADA:', forceRefresh ? 'FORÇADA' : 'AUTOMÁTICA');
    
    try {
      // Square Cloud: URL relativa (mesmo domínio)
      const url = '/api/protocolos';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=30',
          'X-Sync-Mode': forceRefresh ? 'force' : 'auto',
          'X-Client-Time': new Date().toISOString(),
          'X-Platform': 'Square Cloud'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      const duration = Date.now() - startTime;
      console.log(`[SQUARE CLOUD] 📡 Resposta recebida em ${duration}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`[SQUARE CLOUD] HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.protocolos)) {
        throw new Error('[SQUARE CLOUD] Resposta inválida do servidor');
      }
      
      if (!forceRefresh && !protocolCache.hasChanged(data.protocolos)) {
        console.log('[SQUARE CLOUD] 📊 Dados inalterados, mantendo cache');
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        return;
      }
      
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
          console.error('[SQUARE CLOUD] ❌ Erro ao processar protocolo:', p.id, error);
          return null;
        }
      }).filter(Boolean);
      
      console.log(`[SQUARE CLOUD] ✅ SINCRONIZAÇÃO COMPLETA: ${protocolsWithDates.length} protocolos`);
      console.log(`[SQUARE CLOUD] 📊 Performance: ${duration}ms`);
      
      if (mountedRef.current) {
        setProtocols(protocolsWithDates);
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        lastActivityRef.current = Date.now();
      }
      
    } catch (error) {
      console.error('[SQUARE CLOUD] ❌ ERRO DE SINCRONIZAÇÃO:', error);
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        retryCountRef.current++;
        
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        console.log(`[SQUARE CLOUD] 🔄 Tentativa ${retryCountRef.current}, próxima em ${retryDelay}ms`);
        
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
  
  const debouncedFetch = useCallback(
    debounce(fetchProtocols, 300),
    [fetchProtocols]
  );
  
  useEffect(() => {
    console.log('[SQUARE CLOUD] 🚀 useProtocols: Inicializando sistema...');
    console.log('[SQUARE CLOUD] 🌐 Modo: URLs relativas (mesmo domínio)');
    
    fetchProtocols(true);
    
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        let interval = 3000;
        
        if (timeSinceActivity > 60000) {
          interval = 10000;
        } else if (timeSinceActivity > 30000) {
          interval = 5000;
        }
        
        console.log(`[SQUARE CLOUD] 🔄 POLLING AUTOMÁTICO (${interval}ms)`);
        debouncedFetch(false);
      }, 3000);
    };
    
    setupPolling();
    
    return () => {
      console.log('[SQUARE CLOUD] 🛑 useProtocols: Limpando recursos...');
      mountedRef.current = false;
      isFetchingRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [debouncedFetch]);
  
  useEffect(() => {
    const loadUserEmails = async () => {
      if (protocols.length === 0) return;
      
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const newEmails: Record<number, string> = {};
      
      const batchSize = 5;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        
        const emailPromises = batch.map(async (userId) => {
          if (!userEmails[userId]) {
            try {
              const email = await getUserEmailById(userId);
              return { userId, email };
            } catch (error) {
              console.error(`[SQUARE CLOUD] Erro ao carregar email do usuário ${userId}:`, error);
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
  
  const forceRefresh = useCallback(() => {
    console.log('[SQUARE CLOUD] 🔄 Forçando refresh dos protocolos...');
    protocolCache.clear();
    lastActivityRef.current = Date.now();
    fetchProtocols(true);
  }, [fetchProtocols]);
  
  const addProtocol = useCallback(async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('[SQUARE CLOUD] 🚀 CRIANDO PROTOCOLO');
    lastActivityRef.current = Date.now();
    
    try {
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      // Square Cloud: URL relativa
      const response = await fetch('/api/protocolos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'create-protocol',
          'X-Platform': 'Square Cloud'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(protocolData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[SQUARE CLOUD] HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[SQUARE CLOUD] 🎉 PROTOCOLO CRIADO COM SUCESSO!');
        
        protocolCache.clear();
        
        setTimeout(() => fetchProtocols(true), 100);
        setTimeout(() => fetchProtocols(true), 500);
        setTimeout(() => fetchProtocols(true), 1000);
        
        return data.protocolo;
      } else {
        throw new Error(data.message || '[SQUARE CLOUD] Erro ao criar protocolo');
      }
    } catch (error) {
      console.error('[SQUARE CLOUD] 🚨 ERRO CRÍTICO:', error);
      throw new Error(`[SQUARE CLOUD] ERRO DE CONEXÃO: ${error.message}`);
    }
  }, [fetchProtocols]);
  
  const updateProtocolInServer = useCallback(async (id: string, updates: any, performedBy?: string) => {
    try {
      const updateData = { ...updates };
      if (performedBy) {
        updateData.newLogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'status_changed',
          description: `[SQUARE CLOUD] Status alterado para: ${updates.status || 'atualizado'}`,
          performedBy
        };
      }
      
      console.log('[SQUARE CLOUD] 🔄 ATUALIZANDO PROTOCOLO:', id);
      lastActivityRef.current = Date.now();
      
      // Square Cloud: URL relativa
      const response = await fetch(`/api/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'update-protocol',
          'X-Platform': 'Square Cloud'
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[SQUARE CLOUD] HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[SQUARE CLOUD] ✅ PROTOCOLO ATUALIZADO');
        
        protocolCache.clear();
        setTimeout(() => fetchProtocols(true), 200);
        
        return true;
      } else {
        throw new Error(data.message || '[SQUARE CLOUD] Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('[SQUARE CLOUD] 🚨 ERRO DE ATUALIZAÇÃO:', error);
      return false;
    }
  }, [fetchProtocols]);
  
  const updateProtocolStatus = useCallback(async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao atualizar status no servidor');
    }
  }, [updateProtocolInServer]);
  
  const returnProtocol = useCallback(async (id: string, returnReason: string, performedBy?: string) => {
    const foundProtocol = protocols.find(p => p.id === id);
    if (!foundProtocol) {
      throw new Error('[SQUARE CLOUD] Protocolo não encontrado');
    }
    
    let updates: any = {};
    
    if (performedBy === 'Robô') {
      updates = {
        status: 'Aguardando',
        assignedTo: 'Carlos',
        returnReason: `[SQUARE CLOUD] Devolvido pelo Robô: ${returnReason}`,
        newLogEntry: {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          action: 'returned',
          description: '[SQUARE CLOUD] Protocolo devolvido pelo Robô para fila do Carlos',
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
          description: '[SQUARE CLOUD] Protocolo devolvido',
          performedBy: performedBy || 'Sistema',
          details: returnReason
        }
      };
    }
    
    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao devolver protocolo no servidor');
    }
    
    if (foundProtocol && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('[SQUARE CLOUD] Protocolo Devolvido', {
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
        description: `[SQUARE CLOUD] Movido para: ${assignedTo ? `Fila do ${assignedTo}` : 'Fila do Robô'}`,
        performedBy: performedBy || 'Sistema'
      }
    };
    
    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao mover protocolo no servidor');
    }
  }, [updateProtocolInServer]);
  
  const moveMultipleProtocols = useCallback(async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    console.log(`[SQUARE CLOUD] 🔄 Movendo ${ids.length} protocolos para ${assignedTo || 'Robô'}`);
    
    const batchSize = 5;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await Promise.all(batch.map(id => moveProtocolToQueue(id, assignedTo, performedBy)));
    }
    
    console.log('[SQUARE CLOUD] ✅ Movimentação em lote concluída');
  }, [moveProtocolToQueue]);
  
  const cancelProtocol = useCallback(async (id: string, performedBy?: string) => {
    const updates = {
      status: 'Cancelado',
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'status_changed',
        description: '[SQUARE CLOUD] Protocolo cancelado',
        performedBy: performedBy || 'Sistema'
      }
    };
    
    const success = await updateProtocolInServer(id, updates);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao cancelar protocolo no servidor');
    }
  }, [updateProtocolInServer]);
  
  const updateProtocol = useCallback(async (id: string, updates: Partial<Protocol>, performedBy?: string) => {
    const updateData = {
      ...updates,
      newLogEntry: {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        action: 'resubmitted',
        description: '[SQUARE CLOUD] Protocolo editado e reenviado',
        performedBy: performedBy || 'Usuário'
      }
    };
    
    const success = await updateProtocolInServer(id, updateData);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao atualizar protocolo no servidor');
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
    platform: 'Square Cloud',
    isSquareCloud: true
  };
}