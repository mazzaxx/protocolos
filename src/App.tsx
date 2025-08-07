import React, { useState } from 'react';
import { Upload, Notebook, BarChart3, Users, Settings } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { ProtocolForm } from './components/ProtocolForm';
import { RobotQueue } from './components/RobotQueue';
import { TrackingQueue } from './components/TrackingQueue';
import { ManualQueue } from './components/ManualQueue';
import { AdminDashboard } from './components/AdminDashboard';
import { ReturnedQueue } from './components/ReturnedQueue';

// Componente para mostrar status de conectividade
function ConnectivityStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = React.useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = React.useState<Date>(new Date());
  const [performanceInfo, setPerformanceInfo] = React.useState<{responseTime: number, lastSync: Date} | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [maxRetries] = React.useState(5);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status do backend
    const checkBackend = async () => {
      // Parar tentativas após limite máximo
      if (retryCount >= maxRetries) {
        console.log('🛑 Máximo de tentativas atingido, parando verificações');
        setBackendStatus('offline');
        return;
      }
      
      setLastCheck(new Date());
      const startTime = Date.now();
      
      try {
        // Usar proxy local em desenvolvimento, URL direta em produção
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname.includes('webcontainer-api.io') ||
                             window.location.hostname.includes('bolt.new');
        
        const healthUrl = isDevelopment 
          ? '/health'  // Usar proxy
          : `${import.meta.env.VITE_API_BASE_URL || 'https://sistema-protocolos-juridicos-production.up.railway.app'}/health`;
        
        console.log('🔍 Verificando backend:', healthUrl);
        
        const response = await fetch(healthUrl, { 
          method: 'GET',
          credentials: 'include',
          cache: 'no-cache',
          mode: 'cors',
          signal: AbortSignal.timeout(8000) // 8 segundos timeout
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('online');
          setPerformanceInfo({
            responseTime,
            lastSync: new Date()
          });
          setRetryCount(0);
        } else {
          setBackendStatus('offline');
          setPerformanceInfo(null);
          setRetryCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('🚨 ERRO DE CONECTIVIDADE:', error);
        setBackendStatus('offline');
        setPerformanceInfo(null);
        setRetryCount(prev => prev + 1);
      }
    };

    checkBackend();
    
    // Intervalo adaptativo baseado no número de falhas
    const getInterval = () => {
      if (retryCount >= maxRetries) return 60000; // 1 minuto se excedeu limite
      if (retryCount === 0) return 5000; // 5 segundos se tudo ok
      if (retryCount < 3) return 10000; // 10 segundos para primeiras falhas
      return 30000; // 30 segundos após muitas falhas
    };
    
    const interval = setInterval(checkBackend, getInterval());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [retryCount]);

  if (!isOnline || backendStatus === 'offline') {
    return (
      <div className="bg-red-500 text-white px-4 py-3 text-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <span>
            {!isOnline 
              ? '🔴 SEM INTERNET - Dados não sincronizados' 
              : retryCount >= maxRetries
                ? '🔴 SERVIDOR INACESSÍVEL - Verifique a conexão'
                : `🔴 SERVIDOR OFFLINE - Tentativa ${retryCount}/${maxRetries}`
            }
          </span>
          <span className="text-xs opacity-75">
            (última verificação: {lastCheck.toLocaleTimeString()})
          </span>
        </div>
        {backendStatus === 'offline' && retryCount < maxRetries && (
          <div className="mt-2 text-xs">
            <p>✅ Verificando conectividade com o servidor...</p>
            <p>🔄 Reconectando automaticamente...</p>
          </div>
        )}
        {retryCount >= maxRetries && (
          <div className="mt-2 text-xs">
            <p>❌ Não foi possível conectar ao servidor</p>
            <p>🔧 Verifique se o backend está rodando</p>
          </div>
        )}
      </div>
    );
  }

  if (backendStatus === 'checking') {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          <span>🟡 Conectando ao servidor...</span>
          <span className="text-xs opacity-75">
            (tentativa {retryCount + 1})
          </span>
        </div>
      </div>
    );
  }

  // Mostrar status online com informações de performance
  return (
    <div className="bg-green-500 text-white px-4 py-1 text-xs text-center">
      <div className="flex items-center justify-center space-x-4">
        <span>🟢 SERVIDOR ONLINE - Sincronização ativa</span>
        {performanceInfo && (
          <span className="opacity-75">
            Latência: {performanceInfo.responseTime}ms | Última sync: {performanceInfo.lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const { hasPermission, canAccessQueues, canAccessSpecificQueue, canMoveToQueue, user } = useAuth();
  type Tab = 'send' | 'robot' | 'carlos' | 'deyse' | 'tracking' | 'returned' | 'admin';

  const [activeTab, setActiveTab] = useState<Tab>('send');

  const allTabs = [
    { id: 'send', label: 'Envio de Protocolo', icon: Upload, color: 'blue' },
    { id: 'robot', label: 'Fila do Robô', icon: Notebook, color: 'red' },
    { id: 'carlos', label: 'Fila do Carlos', icon: Users, color: 'blue' },
    { id: 'deyse', label: 'Fila da Deyse', icon: Users, color: 'purple' },
    { id: 'tracking', label: 'Acompanhamento', icon: BarChart3, color: 'green' },
    { id: 'returned', label: 'Devolvidos', icon: Upload, color: 'orange' },
    { id: 'admin', label: 'Administração', icon: Settings, color: 'gray' },
  ];

  // Filtrar abas baseado nas permissões
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'send') return hasPermission('canSendProtocols');
    if (tab.id === 'tracking') return hasPermission('canViewTracking');
    if (tab.id === 'returned') return hasPermission('canSendProtocols'); // Todos que podem enviar podem ver devolvidos
    if (tab.id === 'robot') return canAccessSpecificQueue('robot');
    if (tab.id === 'carlos') return canAccessSpecificQueue('carlos');
    if (tab.id === 'deyse') return canAccessSpecificQueue('deyse');
    if (tab.id === 'admin') return hasPermission('canAccessAllQueues');
    return false;
  });
  
  // Se o usuário não tem acesso à aba atual, redirecionar para a primeira disponível
  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id as Tab);
    }
  }, [tabs, activeTab]);

  const getTabColor = (tab: any, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50',
      red: isActive ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50',
      purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50',
      green: isActive ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50',
      orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50',
      gray: isActive ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-50',
    };
    return colors[tab.color as keyof typeof colors];
  };

  return (
    <>
      <Header />
      <ConnectivityStatus />
      <div className="min-h-screen bg-gray-50">

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive 
                      ? 'border-current' 
                      : 'border-transparent'
                  } ${getTabColor(tab, isActive)}`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'send' && <ProtocolForm />}
        {activeTab === 'robot' && <RobotQueue />}
        {activeTab === 'carlos' && <ManualQueue employee="Carlos" />}
        {activeTab === 'deyse' && <ManualQueue employee="Deyse" />}
        {activeTab === 'tracking' && <TrackingQueue />}
        {activeTab === 'returned' && <ReturnedQueue />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            Sistema de Protocolos Jurídicos - Desenvolvido para automação de peticionamento
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;