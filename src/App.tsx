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

/**
 * COMPONENTE DE STATUS DE CONECTIVIDADE - SQUARE CLOUD
 * 
 * Mostra status da conexão com o backend na Square Cloud
 */
function ConnectivityStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = React.useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = React.useState<Date>(new Date());
  const [performanceInfo, setPerformanceInfo] = React.useState<{responseTime: number, lastSync: Date} | null>(null);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status do backend Square Cloud
    const checkBackend = async () => {
      setLastCheck(new Date());
      const startTime = Date.now();
      
      try {
        // Para Square Cloud, usar URL relativa (mesmo domínio)
        const healthUrl = '/health';
        
        const response = await fetch(healthUrl, { 
          method: 'GET',
          credentials: 'include',
          cache: 'no-cache',
          mode: 'cors'
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('online');
          setPerformanceInfo({
            responseTime,
            lastSync: new Date()
          });
          console.log('✅ [SQUARE CLOUD] Backend online:', data.platform);
        } else {
          setBackendStatus('offline');
          setPerformanceInfo(null);
        }
      } catch (error) {
        console.error('❌ [SQUARE CLOUD] Backend offline:', error);
        setBackendStatus('offline');
        setPerformanceInfo(null);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Verificar a cada 10 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline || backendStatus === 'offline') {
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <span>
            {!isOnline 
              ? '🔴 SEM INTERNET - Dados não sincronizados' 
              : `🔴 SERVIDOR SQUARE CLOUD OFFLINE`
            }
          </span>
          <span className="text-xs opacity-75">
            (última verificação: {lastCheck.toLocaleTimeString()})
          </span>
        </div>
      </div>
    );
  }

  if (backendStatus === 'checking') {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          <span>🟡 Conectando ao Square Cloud...</span>
        </div>
      </div>
    );
  }

  // Status online
  return (
    <div className="bg-green-500 text-white px-4 py-1 text-xs text-center">
      <div className="flex items-center justify-center space-x-4">
        <span>🟢 SQUARE CLOUD ONLINE - Sistema funcionando</span>
        {performanceInfo && (
          <span className="opacity-75">
            Latência: {performanceInfo.responseTime}ms | Última sync: {performanceInfo.lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL DO DASHBOARD
 */
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
    if (tab.id === 'returned') return hasPermission('canSendProtocols');
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
            Sistema de Protocolos Jurídicos - Hospedado na Square Cloud 🇧🇷
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

/**
 * COMPONENTE PRINCIPAL DA APLICAÇÃO
 */
function App() {
  React.useEffect(() => {
    console.log('🎉 [SQUARE CLOUD] Sistema Jurídico carregado com sucesso!');
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;