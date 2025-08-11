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
  const [performanceInfo, setPerformanceInfo] = React.useState<{responseTime: number, lastSync: Date, syncCount: number} | null>(null);
  const [syncCount, setSyncCount] = React.useState(0);
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [debugInfo, setDebugInfo] = React.useState<{backendUrl: string, frontendUrl: string} | null>(null);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Capturar informações de debug
    setDebugInfo({
      backendUrl: import.meta.env.VITE_API_BASE_URL || 'NÃO CONFIGURADO',
      frontendUrl: window.location.origin
    });
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status do backend
    const checkBackend = async () => {
      setLastCheck(new Date());
      const startTime = Date.now();
      setConnectionError(null);
      
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        
        if (!apiBaseUrl) {
          console.error('❌ VITE_API_BASE_URL não configurada');
          setConnectionError('Backend não configurado');
          setBackendStatus('offline');
          return;
        }
        
        const testUrl = `${apiBaseUrl}/api/test-connection`;
        console.log('🧪 Testando conectividade:', testUrl);
        
        // Configuração otimizada para Railway + Netlify
        const testOptions = {
          method: 'GET',
          credentials: 'omit', // Mudança crítica para Railway
          cache: 'no-cache',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        };
        
        const response = await fetch(testUrl, testOptions);
        
        const responseTime = Date.now() - startTime;
        console.log(`🧪 Teste de conectividade: ${response.status} em ${responseTime}ms`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Conectividade OK:', data);
          setBackendStatus('online');
          setSyncCount(prev => prev + 1);
          setPerformanceInfo({
            responseTime,
            lastSync: new Date(),
            syncCount: syncCount + 1
          });
          setConnectionError(null);
        } else {
          console.error('❌ Teste de conectividade falhou:', response.status, response.statusText);
          setConnectionError(`HTTP ${response.status}: ${response.statusText}`);
          setBackendStatus('offline');
          setPerformanceInfo(null);
        }
      } catch (error) {
        console.error('❌ Erro no teste de conectividade:', error);
        setConnectionError(error.message || 'Erro de conexão');
        setBackendStatus('offline');
        setPerformanceInfo(null);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Verificar a cada 10 segundos
    
    // Listener para atualizações de protocolos
    const handleProtocolUpdate = () => {
      setSyncCount(prev => prev + 1);
      setPerformanceInfo(prev => prev ? {
        ...prev,
        lastSync: new Date(),
        syncCount: prev.syncCount + 1
      } : null);
    };
    
    window.addEventListener('protocolsUpdated', handleProtocolUpdate);
    window.addEventListener('protocolCreated', handleProtocolUpdate);
    window.addEventListener('protocolUpdated', handleProtocolUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      window.removeEventListener('protocolsUpdated', handleProtocolUpdate);
      window.removeEventListener('protocolCreated', handleProtocolUpdate);
      window.removeEventListener('protocolUpdated', handleProtocolUpdate);
    };
  }, []);

  // Só mostrar se houver problemas de conectividade
  if (!isOnline || backendStatus === 'offline') {
    return (
      <div className="bg-red-500 text-white px-2 py-1 text-xs text-center">
        <div className="flex items-center justify-center space-x-2">
          <span>
            {!isOnline 
              ? '🔴 SEM INTERNET' 
              : `🔴 SERVIDOR OFFLINE`
            }
          </span>
          <span className="text-xs opacity-75 hidden sm:inline">
            (última verificação: {lastCheck.toLocaleTimeString()})
          </span>
        </div>
        {connectionError && (
          <div className="text-xs opacity-90 mt-1">
            Erro: {connectionError}
          </div>
        )}
        {debugInfo && (
          <div className="text-xs opacity-75 mt-1">
            <div>Frontend: {debugInfo.frontendUrl}</div>
            <div>Backend: {debugInfo.backendUrl}</div>
          </div>
        )}
      </div>
    );
  }

  if (backendStatus === 'checking') {
    return (
      <div className="bg-yellow-500 text-white px-2 py-1 text-xs text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
          <span>🟡 Conectando...</span>
        </div>
        {debugInfo && (
          <div className="text-xs opacity-75 mt-1">
            Testando: {debugInfo.backendUrl}
          </div>
        )}
      </div>
    );
  }

  // Status online - mostrar apenas se o usuário clicar para expandir
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`transition-all duration-300 ${isMinimized ? 'w-3 h-3' : 'w-auto h-auto'}`}>
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-3 h-3 bg-green-500 rounded-full animate-pulse hover:bg-green-600 transition-colors"
            title="Sistema online - Clique para ver detalhes"
          />
        ) : (
          <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <span className="font-medium">🟢 Sistema Online</span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white hover:text-gray-200 text-xs"
              >
                ×
              </button>
            </div>
            {performanceInfo && (
              <div className="text-xs opacity-90">
                <div>Latência: {performanceInfo.responseTime}ms</div>
                <div>Última sync: {performanceInfo.lastSync.toLocaleTimeString()}</div>
                <div>Syncs: {performanceInfo.syncCount}</div>
              </div>
            )}
            {debugInfo && (
              <div className="text-xs opacity-75 mt-1 border-t border-green-400 pt-1">
                <div>Backend: Online</div>
                <div>Sincronização: Ativa</div>
              </div>
            )}
          </div>
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