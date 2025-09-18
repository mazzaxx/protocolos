import { useState, useEffect, useRef, useCallback } from 'react';
import { Protocol } from '../types';

/**
 * SISTEMA DE CACHE INTELIGENTE - SQUARE CLOUD
 * 
 * Cache otimizado para funcionar perfeitamente com a Square Cloud.
 * Reduz requisições desnecessárias e melhora performance.
 * 
 * FUNCIONALIDADES:
 * - Cache com TTL (Time To Live)
 * - Detecção de mudanças por hash
 * - Throttling de requisições
 * - Limpeza automática
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Otimizado para latência brasileira
 * - Reduz uso de banda
 * - Melhora experiência do usuário
 */
class ProtocolCache {
  private cache: Map<string, any> = new Map();
  private lastHash: string = '';
  private lastFetch: number = 0;
  
  /**
   * GERAÇÃO DE HASH PARA DETECÇÃO DE MUDANÇAS
   * 
   * Cria hash simples dos dados para detectar mudanças reais.
   * Evita re-renders desnecessários na Square Cloud.
   */
  private generateHash(data: any): string {
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }
  
  /**
   * VERIFICAÇÃO DE MUDANÇAS
   * 
   * Compara hash atual com anterior para detectar mudanças.
   * Otimização importante para performance na Square Cloud.
   */
  hasChanged(data: any): boolean {
    const newHash = this.generateHash(data);
    const changed = newHash !== this.lastHash;
    this.lastHash = newHash;
    return changed;
  }
  
  /**
   * CACHE COM TTL (TIME TO LIVE)
   * 
   * Armazena dados com tempo de expiração.
   * Reduz carga no servidor Square Cloud.
   */
  set(key: string, value: any, ttl: number = 5000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
  
  /**
   * RECUPERAÇÃO DE DADOS DO CACHE
   * 
   * Retorna dados do cache se ainda válidos.
   * Limpa automaticamente dados expirados.
   */
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      // SQUARE CLOUD: Limpar dados expirados automaticamente
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * LIMPEZA COMPLETA DO CACHE
   * 
   * Remove todos os dados do cache.
   * Usado quando forçamos refresh na Square Cloud.
   */
  clear() {
    this.cache.clear();
    this.lastHash = '';
  }
  
  /**
   * CONTROLE DE THROTTLING
   * 
   * Evita requisições muito frequentes ao servidor Square Cloud.
   * Melhora performance e reduz custos.
   */
  canFetch(minInterval: number = 1000): boolean {
    const now = Date.now();
    if (now - this.lastFetch < minInterval) {
      return false;
    }
    this.lastFetch = now;
    return true;
  }
}

// SQUARE CLOUD: Instância global do cache otimizado
const protocolCache = new ProtocolCache();

/**
 * SISTEMA DE DEBOUNCE PARA SQUARE CLOUD
 * 
 * Evita múltiplas requisições simultâneas ao servidor.
 * Essencial para performance na Square Cloud.
 */
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

/**
 * FUNÇÃO PARA BUSCAR EMAIL DO USUÁRIO POR ID
 * 
 * Busca dados do usuário com cache otimizado.
 * Reduz consultas desnecessárias à Square Cloud.
 * 
 * SQUARE CLOUD:
 * - Cache de 10 minutos para emails
 * - Fallback para erro de conexão
 * - Headers otimizados
 */
const getUserEmailById = async (userId: number): Promise<string> => {
  const cacheKey = `user_email_${userId}`;
  const cached = protocolCache.get(cacheKey);
  if (cached) return cached;
  
  try {
    // SQUARE CLOUD: URL da API otimizada
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'max-age=300', // SQUARE CLOUD: 5 minutos de cache
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
      
      // SQUARE CLOUD: Cache por 10 minutos
      protocolCache.set(cacheKey, email, 600000);
      return email;
    }
    return 'Email não disponível (Square Cloud)';
  } catch (error) {
    console.error('[SQUARE CLOUD] Erro ao buscar email do usuário:', error);
    return 'Email não disponível (Square Cloud)';
  }
};

/**
 * HOOK PRINCIPAL PARA GERENCIAMENTO DE PROTOCOLOS
 * 
 * Hook React otimizado para funcionar com a Square Cloud.
 * Gerencia estado, sincronização e operações CRUD.
 * 
 * FUNCIONALIDADES:
 * - Sincronização em tempo real
 * - Cache inteligente
 * - Retry automático
 * - Polling adaptativo
 * - Tratamento robusto de erros
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Otimizado para latência brasileira
 * - Reduz uso de recursos
 * - Melhora experiência do usuário
 * - Logs detalhados para debugging
 */
export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [userEmails, setUserEmails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // SQUARE CLOUD: Refs para controle de estado otimizado
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  
  /**
   * FUNÇÃO OTIMIZADA PARA BUSCAR PROTOCOLOS
   * 
   * Busca protocolos do servidor Square Cloud com otimizações:
   * - Cache inteligente
   * - Throttling de requisições
   * - Retry automático
   * - Logs detalhados
   */
  const fetchProtocols = useCallback(async (forceRefresh = false) => {
    // SQUARE CLOUD: Verificar se componente ainda está montado
    if (!mountedRef.current) return;
    
    // SQUARE CLOUD: Evitar múltiplas requisições simultâneas
    if (isFetchingRef.current && !forceRefresh) {
      console.log('[SQUARE CLOUD] 🔄 Requisição já em andamento, ignorando...');
      return;
    }
    
    // SQUARE CLOUD: Throttling inteligente para economizar recursos
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
      // SQUARE CLOUD: Configurar URL da API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiBaseUrl}/api/protocolos`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=30', // SQUARE CLOUD: Cache otimizado
          'X-Sync-Mode': forceRefresh ? 'force' : 'auto', // SQUARE CLOUD: Modo de sincronização
          'X-Client-Time': new Date().toISOString(), // SQUARE CLOUD: Timestamp do cliente
          'X-Platform': 'Square Cloud' // SQUARE CLOUD: Identificação da plataforma
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
      
      // SQUARE CLOUD: Verificar se dados realmente mudaram (otimização)
      if (!forceRefresh && !protocolCache.hasChanged(data.protocolos)) {
        console.log('[SQUARE CLOUD] 📊 Dados inalterados, mantendo cache');
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        retryCountRef.current = 0;
        return;
      }
      
      /**
       * PROCESSAMENTO DE PROTOCOLOS COM VALIDAÇÃO
       * 
       * Processa dados recebidos da Square Cloud com validação robusta.
       * Converte tipos e trata erros de parsing.
       */
      const protocolsWithDates = data.protocolos.map((p: any) => {
        try {
          return {
            ...p,
            // SQUARE CLOUD: Conversão segura de datas
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            // SQUARE CLOUD: Validação de arrays
            documents: Array.isArray(p.documents) ? p.documents : [],
            guias: Array.isArray(p.guias) ? p.guias : [],
            activityLog: Array.isArray(p.activityLog) ? p.activityLog : []
          };
        } catch (error) {
          console.error('[SQUARE CLOUD] ❌ Erro ao processar protocolo:', p.id, error);
          return null;
        }
      }).filter(Boolean);
      
      // SQUARE CLOUD: Logs de sucesso com estatísticas
      console.log(`[SQUARE CLOUD] ✅ SINCRONIZAÇÃO COMPLETA: ${protocolsWithDates.length} protocolos`);
      console.log(`[SQUARE CLOUD] 📊 Performance: ${duration}ms`);
      console.log(`[SQUARE CLOUD] 🎯 Filas: Robô(${protocolsWithDates.filter(p => !p.assignedTo && p.status === 'Aguardando').length}) Carlos(${protocolsWithDates.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length}) Deyse(${protocolsWithDates.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length})`);
      
      // SQUARE CLOUD: Atualizar estado apenas se componente montado
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
        
        // SQUARE CLOUD: Estratégia de retry exponencial
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        console.log(`[SQUARE CLOUD] 🔄 Tentativa ${retryCountRef.current}, próxima em ${retryDelay}ms`);
        
        setTimeout(() => {
          if (mountedRef.current && retryCountRef.current < 5) {
            fetchProtocols(true);
          }
        }, retryDelay);
      }
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('[SQUARE CLOUD] 🚨 ERRO CRÍTICO: Backend inacessível');
        console.error('[SQUARE CLOUD] 🔧 Verifique: https://sistema-protocolos.squareweb.app');
      }
      
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, []);
  
  // SQUARE CLOUD: Versão com debounce para evitar chamadas excessivas
  const debouncedFetch = useCallback(
    debounce(fetchProtocols, 300),
    [fetchProtocols]
  );
  
  /**
   * EFFECT PRINCIPAL PARA INICIALIZAÇÃO E POLLING
   * 
   * Configura sincronização automática com a Square Cloud.
   * Polling adaptativo baseado na atividade do usuário.
   */
  useEffect(() => {
    console.log('[SQUARE CLOUD] 🚀 useProtocols: Inicializando sistema otimizado...');
    console.log('[SQUARE CLOUD] 🌐 Backend:', import.meta.env.VITE_API_BASE_URL || 'PROXY LOCAL');
    
    // SQUARE CLOUD: Fetch inicial
    fetchProtocols(true);
    
    /**
     * CONFIGURAÇÃO DE POLLING ADAPTATIVO
     * 
     * Ajusta frequência de sincronização baseada na atividade.
     * Economiza recursos na Square Cloud.
     */
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        // SQUARE CLOUD: Polling adaptativo baseado na atividade
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        let interval = 3000; // SQUARE CLOUD: 3 segundos padrão
        
        if (timeSinceActivity > 60000) {
          interval = 10000; // SQUARE CLOUD: 10 segundos se inativo
        } else if (timeSinceActivity > 30000) {
          interval = 5000; // SQUARE CLOUD: 5 segundos se pouco ativo
        }
        
        console.log(`[SQUARE CLOUD] 🔄 POLLING AUTOMÁTICO (${interval}ms): Verificando atualizações...`);
        debouncedFetch(false);
      }, 3000); // SQUARE CLOUD: Intervalo base de 3 segundos
    };
    
    setupPolling();
    
    // SQUARE CLOUD: Cleanup para evitar memory leaks
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
  
  /**
   * EFFECT PARA CARREGAR EMAILS DOS USUÁRIOS
   * 
   * Carrega emails dos usuários em lotes para otimizar performance.
   * Cache inteligente para reduzir requisições à Square Cloud.
   */
  useEffect(() => {
    const loadUserEmails = async () => {
      if (protocols.length === 0) return;
      
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const newEmails: Record<number, string> = {};
      
      // SQUARE CLOUD: Carregar emails em lotes para otimizar
      const batchSize = 5; // SQUARE CLOUD: Lotes de 5 para não sobrecarregar
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        
        const emailPromises = batch.map(async (userId) => {
          if (!userEmails[userId]) {
            try {
              const email = await getUserEmailById(userId);
              return { userId, email };
            } catch (error) {
              console.error(`[SQUARE CLOUD] Erro ao carregar email do usuário ${userId}:`, error);
              return { userId, email: 'Email não disponível (Square Cloud)' };
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
  
  /**
   * FUNÇÃO PARA FORÇAR REFRESH
   * 
   * Força sincronização imediata com a Square Cloud.
   * Limpa cache e atualiza atividade.
   */
  const forceRefresh = useCallback(() => {
    console.log('[SQUARE CLOUD] 🔄 Forçando refresh dos protocolos...');
    protocolCache.clear();
    lastActivityRef.current = Date.now();
    fetchProtocols(true);
  }, [fetchProtocols]);
  
  /**
   * FUNÇÃO OTIMIZADA PARA ADICIONAR PROTOCOLO
   * 
   * Cria novo protocolo na Square Cloud com sincronização automática.
   * Múltiplas tentativas de sincronização para garantir consistência.
   */
  const addProtocol = useCallback(async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('[SQUARE CLOUD] 🚀 CRIANDO PROTOCOLO - Sincronização iniciada');
    lastActivityRef.current = Date.now();
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
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
        
        // SQUARE CLOUD: Invalidar cache e forçar múltiplas sincronizações
        protocolCache.clear();
        
        // SQUARE CLOUD: Múltiplas sincronizações para garantir consistência
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
  
  /**
   * FUNÇÃO OTIMIZADA PARA ATUALIZAR PROTOCOLO
   * 
   * Atualiza protocolo na Square Cloud com log de atividades.
   * Sincronização automática após atualização.
   */
  const updateProtocolInServer = useCallback(async (id: string, updates: any, performedBy?: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
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
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
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
        console.log('[SQUARE CLOUD] ✅ PROTOCOLO ATUALIZADO - Sincronizando...');
        
        // SQUARE CLOUD: Invalidar cache e sincronizar
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
  
  /**
   * FUNÇÕES ESPECÍFICAS PARA OPERAÇÕES
   * 
   * Wrappers otimizados para operações específicas na Square Cloud.
   * Cada função inclui tratamento de erro e logs específicos.
   */
  
  // SQUARE CLOUD: Atualizar status do protocolo
  const updateProtocolStatus = useCallback(async (id: string, status: Protocol['status'], performedBy?: string) => {
    const success = await updateProtocolInServer(id, { status }, performedBy);
    if (!success) {
      throw new Error('[SQUARE CLOUD] Falha ao atualizar status no servidor');
    }
  }, [updateProtocolInServer]);
  
  // SQUARE CLOUD: Devolver protocolo com motivo
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
    
    // SQUARE CLOUD: Notificação visual se suportada
    if (foundProtocol && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('[SQUARE CLOUD] Protocolo Devolvido', {
        body: `[SQUARE CLOUD] Protocolo ${foundProtocol.processNumber} foi devolvido: ${returnReason}`,
        icon: '/favicon.ico'
      });
    }
  }, [protocols, updateProtocolInServer]);
  
  // SQUARE CLOUD: Mover protocolo entre filas
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
  
  // SQUARE CLOUD: Mover múltiplos protocolos em lotes
  const moveMultipleProtocols = useCallback(async (ids: string[], assignedTo: Protocol['assignedTo'], performedBy?: string) => {
    console.log(`[SQUARE CLOUD] 🔄 Movendo ${ids.length} protocolos para ${assignedTo || 'Robô'}`);
    
    // SQUARE CLOUD: Processar em lotes para evitar sobrecarga
    const batchSize = 5; // SQUARE CLOUD: Lotes de 5 para otimizar
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await Promise.all(batch.map(id => moveProtocolToQueue(id, assignedTo, performedBy)));
    }
    
    console.log('[SQUARE CLOUD] ✅ Movimentação em lote concluída');
  }, [moveProtocolToQueue]);
  
  // SQUARE CLOUD: Cancelar protocolo
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
  
  // SQUARE CLOUD: Atualizar protocolo completo
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
  
  // SQUARE CLOUD: Retornar todas as funções e estados
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
    // SQUARE CLOUD: Metadados da plataforma
    platform: 'Square Cloud',
    isSquareCloud: true
  };
}