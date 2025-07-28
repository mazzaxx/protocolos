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
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status do backend
    const checkBackend = async () => {
      setLastCheck(new Date());
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos
        
        const response = await fetch(`${apiBaseUrl}/health`, { 
          method: 'GET',
          credentials: 'include',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🏥 Health check:', data);
          setBackendStatus('online');
          setRetryCount(0); // Reset retry count on success
        } else {
          console.error('❌ Health check failed:', response.status);
          setBackendStatus('offline');
          setRetryCount(prev => prev + 1);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Health check error:', error);
        setBackendStatus('offline');
        setRetryCount(prev => prev + 1);
      }
    };

    checkBackend();
    // Intervalo adaptativo: mais frequente quando offline
    const intervalTime = backendStatus === 'offline' ? 5000 : 15000;
    const interval = setInterval(checkBackend, intervalTime);

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
              ? '🔴 Sem conexão com a internet' 
              : `🔴 Servidor indisponível - Dados podem não estar sincronizados ${retryCount > 0 ? `(tentativa ${retryCount})` : ''}`
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
          <span>🟡 Verificando conexão com o servidor...</span>
        </div>
      </div>
    );
  }

  // Mostrar status online brevemente
  return (
    <div className="bg-green-500 text-white px-4 py-1 text-xs text-center">
      🟢 Servidor conectado - Sistema funcionando normalmente
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