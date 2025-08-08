import { useState, useEffect, useRef, useCallback } from 'react';
import { Protocol } from '../types';

// Sistema de sincronização otimizado para 100+ usuários
class ProtocolSyncManager {
  private lastSyncHash: string = '';
  private lastSyncTime: number = 0;
  private syncInProgress: boolean = false;
  private forceNextSync: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  // Gerar hash dos dados para detectar mudanças reais
  generateHash(data: any): string {
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }
  
  // Verificar se os dados mudaram
  hasChanged(data: any): boolean {
    const newHash = this.generateHash(data);
    const changed = newHash !== this.lastSyncHash;
    if (changed) {
      this.lastSyncHash = newHash;
    }
    return changed;
  }
  
  // Controle de throttling inteligente
  canSync(minInterval: number = 1000): boolean {
    const now = Date.now();
    if (this.forceNextSync) {
      this.forceNextSync = false;
      this.lastSyncTime = now;
      return true;
    }
    
    if (now - this.lastSyncTime < minInterval) {
      return false;
    }
    
    this.lastSyncTime = now;
    return true;
  }
  
  // Forçar próxima sincronização
  forceSync() {
    this.forceNextSync = true;
    this.syncInProgress = false;
  }
  
  // Controle de sincronização em progresso
  setSyncInProgress(inProgress: boolean) {
    this.syncInProgress = inProgress;
  }
  
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
  
  // Reset para nova tentativa
  reset() {
    this.lastSyncHash = '';
    this.lastSyncTime = 0;
    this.syncInProgress = false;
    this.forceNextSync = false;
    this.retryCount = 0;
  }
  
  // Controle de retry
  shouldRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }
  
  incrementRetry() {
    this.retryCount++;
  }
  
  resetRetry() {
    this.retryCount = 0;
  }
}

// Instância global do gerenciador de sincronização
const syncManager = new ProtocolSyncManager();

// Função para buscar email do usuário por ID (com cache otimizado)
const userEmailCache = new Map<number, { email: string, expires: number }>();

const getUserEmailById = async (userId: number): Promise<string> => {
  // Verificar cache primeiro
  const cached = userEmailCache.get(userId);
  if (cached && Date.now() < cached.expires) {
    return cached.email;
  }
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'X-Sync-Request': 'user-email'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.funcionarios.find((f: any) => f.id === userId);
      const email = user ? user.email : 'Usuário não encontrado';
      
      // Cache por 5 minutos
      userEmailCache.set(userId, {
        email,
        expires: Date.now() + 300000
      });
      
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
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());
  
  // Função CRÍTICA para sincronização em tempo real
  const fetchProtocols = useCallback(async (forceRefresh = false) => {
    // Verificar se o componente ainda está montado
    if (!mountedRef.current) return;
    
    // Evitar múltiplas requisições simultâneas
    if (syncManager.isSyncInProgress() && !forceRefresh) {
      console.log('🔄 Sincronização já em andamento, aguardando...');
      return;
    }
    
    // Throttling inteligente (mais agressivo para 100+ usuários)
    if (!forceRefresh && !syncManager.canSync(800)) {
      console.log('⏱️ Throttling ativo, aguardando intervalo...');
      return;
    }
    
    syncManager.setSyncInProgress(true);
    setIsLoading(true);
    setConnectionStatus('checking');
    
    const startTime = Date.now();
    const syncId = Math.random().toString(36).substr(2, 9);
    
    console.log(`🚀 SINCRONIZAÇÃO [${syncId}] INICIADA:`, forceRefresh ? 'FORÇADA' : 'AUTOMÁTICA');
    console.log(`🌐 Backend configurado:`, import.meta.env.VITE_API_BASE_URL);
    console.log(`🌐 Frontend URL:`, window.location.origin);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Verificar se a URL está configurada
      if (!apiBaseUrl) {
        console.error('❌ VITE_API_BASE_URL não configurada');
        throw new Error('ERRO DE CONFIGURAÇÃO: Backend não configurado. Entre em contato com o administrador.');
      }
      
      // Teste de conectividade primeiro
      console.log(`🧪 [${syncId}] Testando conectividade...`);
      try {
        const testResponse = await fetch(`${apiBaseUrl}/api/test-connection`, {
          method: 'GET',
          headers: {
            'Origin': window.location.origin,
            'User-Agent': navigator.userAgent
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`✅ [${syncId}] Conectividade OK:`, testData);
        } else {
          console.warn(`⚠️ [${syncId}] Teste de conectividade falhou:`, testResponse.status);
        }
      } catch (testError) {
        console.error(`❌ [${syncId}] Erro no teste de conectividade:`, testError);
        throw new Error(`ERRO DE CONECTIVIDADE: Não foi possível conectar ao servidor (${apiBaseUrl}). Verifique sua conexão com a internet.`);
      }
      
      const url = `${apiBaseUrl}/api/protocolos`;
      
      console.log(`📡 [${syncId}] Fazendo requisição para:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache, no-store, must-revalidate' : 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Sync-Mode': forceRefresh ? 'force' : 'auto',
          'X-Sync-ID': syncId,
          'X-Client-Time': new Date().toISOString(),
          'X-Force-Refresh': forceRefresh ? '1' : '0',
          'Origin': window.location.origin,
          'User-Agent': navigator.userAgent
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      const duration = Date.now() - startTime;
      console.log(`📡 [${syncId}] Resposta em ${duration}ms - Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${syncId}] Erro HTTP:`, response.status, response.statusText, errorText);
        
        if (response.status === 0 || response.status >= 500) {
          throw new Error(`ERRO DE SERVIDOR: O servidor não está respondendo (${response.status}). Tente novamente em alguns minutos.`);
        } else if (response.status === 403) {
          throw new Error(`ERRO DE ACESSO: Acesso negado pelo servidor. Verifique se o domínio está autorizado.`);
        } else {
          throw new Error(`ERRO HTTP ${response.status}: ${response.statusText || 'Erro desconhecido'}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.protocolos)) {
        console.error(`❌ [${syncId}] Resposta inválida:`, data);
        throw new Error('Resposta inválida do servidor');
      }
      
      // CRÍTICO: Sempre atualizar se for forçado ou se os dados mudaram
      const shouldUpdate = forceRefresh || syncManager.hasChanged(data.protocolos);
      
      if (!shouldUpdate) {
        console.log(`📊 [${syncId}] Dados inalterados, mantendo estado atual`);
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        syncManager.resetRetry();
        return;
      }
      
      // Processar protocolos com validação rigorosa
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
          console.error(`❌ [${syncId}] Erro ao processar protocolo:`, p.id, error);
          return null;
        }
      }).filter(Boolean);
      
      console.log(`✅ [${syncId}] SINCRONIZAÇÃO COMPLETA: ${protocolsWithDates.length} protocolos`);
      console.log(`⚡ [${syncId}] Performance: ${duration}ms`);
      console.log(`🎯 [${syncId}] Filas: Robô(${protocolsWithDates.filter(p => !p.assignedTo && p.status === 'Aguardando').length}) Carlos(${protocolsWithDates.filter(p => p.assignedTo === 'Carlos' && p.status === 'Aguardando').length}) Deyse(${protocolsWithDates.filter(p => p.assignedTo === 'Deyse' && p.status === 'Aguardando').length})`);
      
      // CRÍTICO: Atualizar estado apenas se o componente ainda estiver montado
      if (mountedRef.current) {
        setProtocols(protocolsWithDates);
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        syncManager.resetRetry();
        lastActivityRef.current = Date.now();
        
        // Notificar outros componentes sobre a atualização
        window.dispatchEvent(new CustomEvent('protocolsUpdated', {
          detail: { count: protocolsWithDates.length, syncId }
        }));
      }
      
    } catch (error) {
      console.error(`❌ [${syncId}] ERRO DE SINCRONIZAÇÃO:`, error);
      
      // Log detalhado do erro para debug
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('🚨 ERRO CRÍTICO: Falha na requisição fetch');
        console.error('🔧 Possíveis causas:');
        console.error('   1. Backend offline:', import.meta.env.VITE_API_BASE_URL);
        console.error('   2. Problema de CORS');
        console.error('   3. Problema de rede');
        console.error('   4. Firewall bloqueando');
      }
      
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        syncManager.incrementRetry();
        
        // Estratégia de retry mais agressiva para escritório
        if (syncManager.shouldRetry()) {
          const retryDelay = Math.min(1000 * Math.pow(1.5, syncManager.retryCount), 5000);
          console.log(`🔄 [${syncId}] Tentativa ${syncManager.retryCount}, retry em ${retryDelay}ms`);
          
          setTimeout(() => {
            if (mountedRef.current) {
              fetchProtocols(true);
            }
          }, retryDelay);
        } else {
          console.error(`🚨 [${syncId}] Máximo de tentativas excedido`);
        }
      }
      
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        syncManager.setSyncInProgress(false);
      }
    }
  }, []);
  
  // Effect principal para inicialização e polling agressivo
  useEffect(() => {
    console.log('🚀 useProtocols: Inicializando sistema para 100+ usuários...');
    console.log('🌐 Backend:', import.meta.env.VITE_API_BASE_URL || 'PROXY LOCAL');
    console.log('⚡ Modo: Sincronização em tempo real');
    
    // Reset do gerenciador
    syncManager.reset();
    
    // Fetch inicial SEMPRE forçado
    fetchProtocols(true);
    
    // Configurar polling MUITO agressivo para escritório
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Polling a cada 2 segundos para garantir sincronização em tempo real
      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        
        console.log('🔄 POLLING AUTOMÁTICO: Verificando atualizações...');
        fetchProtocols(false);
      }, 2000); // 2 segundos - MUITO agressivo para escritório
    };
    
    setupPolling();
    
    // Listener para atualizações de outros componentes
    const handleProtocolUpdate = (event: CustomEvent) => {
      console.log('📢 Evento de atualização recebido:', event.detail);
      // Forçar nova sincronização após 500ms
      setTimeout(() => {
        if (mountedRef.current) {
          syncManager.forceSync();
          fetchProtocols(true);
        }
      }, 500);
    };
    
    window.addEventListener('protocolsUpdated', handleProtocolUpdate as EventListener);
    
    // Listener para visibilidade da página (quando usuário volta para a aba)
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        console.log('👁️ Página ficou visível, forçando sincronização...');
        syncManager.forceSync();
        fetchProtocols(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      console.log('🛑 useProtocols: Limpando recursos...');
      mountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      window.removeEventListener('protocolsUpdated', handleProtocolUpdate as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      syncManager.reset();
    };
  }, [fetchProtocols]);
  
  // Effect para carregar emails dos usuários (otimizado)
  useEffect(() => {
    const loadUserEmails = async () => {
      if (protocols.length === 0) return;
      
      const uniqueUserIds = [...new Set(protocols.map(p => p.createdBy))];
      const newEmails: Record<number, string> = {};
      
      // Carregar emails em paralelo com limite otimizado
      const batchSize = 10; // Aumentado para melhor performance
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
  
  // Função para forçar refresh (otimizada)
  const forceRefresh = useCallback(() => {
    console.log('🔄 FORÇA REFRESH: Sincronização forçada pelo usuário');
    syncManager.forceSync();
    lastActivityRef.current = Date.now();
    fetchProtocols(true);
  }, [fetchProtocols]);
  
  // Função otimizada para adicionar protocolo
  const addProtocol = useCallback(async (protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'queuePosition'>) => {
    console.log('🚀 CRIANDO PROTOCOLO - Sincronização crítica iniciada');
    console.log('🌐 Backend URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('🌐 Frontend URL:', window.location.origin);
    lastActivityRef.current = Date.now();
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
      // Verificar se a URL está configurada
      if (!apiBaseUrl) {
        console.error('❌ VITE_API_BASE_URL não configurada');
        throw new Error('ERRO DE CONFIGURAÇÃO: Sistema não está configurado para funcionar online. Entre em contato com o administrador.');
      }
      
      // Verificar se o servidor está acessível antes de tentar enviar
      console.log('🧪 Testando conectividade antes de enviar protocolo...');
      try {
        const testResponse = await fetch(`${apiBaseUrl}/api/test-connection`, {
          method: 'GET',
          headers: {
            'Origin': window.location.origin,
            'User-Agent': navigator.userAgent
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        if (!testResponse.ok) {
          const testText = await testResponse.text();
          console.error('❌ Teste de conectividade falhou:', testResponse.status, testText);
          throw new Error(`Servidor não está respondendo (Status: ${testResponse.status})`);
        }
        
        const testData = await testResponse.json();
        console.log('✅ Conectividade OK:', testData);
      } catch (connectError) {
        console.error('❌ Servidor inacessível:', connectError);
        throw new Error(`ERRO DE CONEXÃO: Não foi possível conectar ao servidor.\n\nDetalhes técnicos:\n- URL: ${apiBaseUrl}\n- Erro: ${connectError.message}\n\nVerifique sua conexão com a internet e tente novamente.`);
      }
      
      const userEmail = await getUserEmailById(protocol.createdBy);
      
      const protocolData = {
        ...protocol,
        createdByEmail: userEmail
      };
      
      console.log('📡 Enviando protocolo para:', `${apiBaseUrl}/api/protocolos`);
      console.log('📦 Dados do protocolo:', {
        processNumber: protocolData.processNumber,
        court: protocolData.court,
        assignedTo: protocolData.assignedTo,
        createdBy: protocolData.createdBy
      });
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'create-protocol',
          'X-Force-Sync': '1',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Origin': window.location.origin,
          'User-Agent': navigator.userAgent
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(protocolData),
      });
      
      console.log('📡 Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ Erro ao parsear resposta:', parseError);
          console.error('❌ Texto da resposta:', errorText);
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        // Melhorar mensagens de erro para o usuário
        if (response.status === 0) {
          throw new Error('ERRO DE REDE: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
        } else if (response.status === 403) {
          throw new Error('ERRO DE ACESSO: Acesso negado pelo servidor. Entre em contato com o administrador.');
        } else if (response.status >= 500) {
          throw new Error(`ERRO DO SERVIDOR: O servidor está com problemas (${response.status}). Tente novamente em alguns minutos.`);
        } else {
          throw new Error(`ERRO: ${errorMessage}`);
        }
      }
      
      const data = await response.json();
      console.log('📦 Dados de resposta:', data);
      
      if (data.success) {
        console.log('🎉 PROTOCOLO CRIADO COM SUCESSO!');
        
        // CRÍTICO: Múltiplas sincronizações para garantir que TODOS os usuários vejam
        syncManager.forceSync();
        
        // Sincronizações escalonadas para máxima confiabilidade
        const syncDelays = [100, 300, 800, 1500, 3000];
        syncDelays.forEach((delay, index) => {
          setTimeout(() => {
            if (mountedRef.current) {
              console.log(`🔄 Sincronização ${index + 1}/5 após criação`);
              fetchProtocols(true);
            }
          }, delay);
        });
        
        // Notificar outros componentes
        window.dispatchEvent(new CustomEvent('protocolCreated', {
          detail: { protocolId: data.protocolo?.id }
        }));
        
        return data.protocolo;
      } else {
        const errorMsg = data.message || 'Erro desconhecido ao criar protocolo';
        console.error('❌ Erro na resposta do servidor:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('🚨 ERRO CRÍTICO AO CRIAR PROTOCOLO:', error);
      
      // Melhorar mensagem de erro para o usuário
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('ERRO DE CONEXÃO: Não foi possível conectar ao servidor.\n\nPossíveis causas:\n• Problema de internet\n• Servidor temporariamente indisponível\n• Firewall bloqueando a conexão\n\nTente novamente em alguns minutos.');
      } else if (error.message.includes('timeout')) {
        throw new Error('ERRO DE TIMEOUT: O servidor demorou muito para responder. Tente novamente.');
      } else {
        throw new Error(`ERRO: ${error.message}`);
      }
    }
  }, [fetchProtocols]);
  
  // Função otimizada para atualizar protocolo no servidor
  const updateProtocolInServer = useCallback(async (id: string, updates: any, performedBy?: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      
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
      
      const response = await fetch(`${apiBaseUrl}/api/protocolos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'update-protocol',
          'X-Force-Sync': '1',
          'Cache-Control': 'no-cache'
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
        console.log('✅ PROTOCOLO ATUALIZADO - Sincronizando TODOS os usuários...');
        
        // CRÍTICO: Forçar sincronização imediata para todos
        syncManager.forceSync();
        setTimeout(() => fetchProtocols(true), 200);
        setTimeout(() => fetchProtocols(true), 1000);
        
        // Notificar outros componentes
        window.dispatchEvent(new CustomEvent('protocolUpdated', {
          detail: { protocolId: id }
        }));
        
        return true;
      } else {
        throw new Error(data.message || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('🚨 ERRO DE ATUALIZAÇÃO:', error);
      return false;
    }
  }, [fetchProtocols]);
  
  // Funções específicas para operações (mantidas iguais)
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
    
    // Processar em lotes menores para melhor performance
    const batchSize = 3;
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