import React, { useState } from 'react';
import { Upload, Notebook, BarChart3, Users, Settings, CircleUser as UserCircle } from 'lucide-react';
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
import UserProfile from './components/UserProfile';
import FirstLoginModal from './components/FirstLoginModal';

// Componente discreto de status de conectividade (bolinha no canto inferior direito)
function ConnectivityStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = React.useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = React.useState<Date>(new Date());
  const [performanceInfo, setPerformanceInfo] = React.useState<{responseTime: number, lastSync: Date} | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status do backend
    const checkBackend = async () => {
      setLastCheck(new Date());
      const startTime = Date.now();

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (window as any).__API_BASE_URL__ || '';
        const healthUrl = `${apiBaseUrl}/health`;

        console.log('❤️ Verificando saúde do backend:', healthUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(healthUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-cache',
          mode: 'cors',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend online - Latency:', responseTime + 'ms');
          setBackendStatus('online');
          setPerformanceInfo({
            responseTime,
            lastSync: new Date()
          });
        } else {
          console.warn('⚠️ Backend respondeu com erro:', response.status);
          setBackendStatus('offline');
          setPerformanceInfo(null);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('⏱️ Timeout ao verificar backend (>5s)');
        } else {
          console.error('❌ Erro ao verificar backend:', error.message);
        }
        setBackendStatus('offline');
        setPerformanceInfo(null);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000); // Verificar a cada 15 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline || backendStatus === 'offline') return 'bg-red-500';
    if (backendStatus === 'checking') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'SEM INTERNET - Dados não sincronizados';
    if (backendStatus === 'offline') return 'SERVIDOR OFFLINE - Sincronização interrompida';
    if (backendStatus === 'checking') return 'Conectando ao servidor...';
    return 'SERVIDOR ONLINE - Sincronização ativa';
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Bolinha de status */}
      <div className={`w-4 h-4 rounded-full ${getStatusColor()} shadow-lg cursor-pointer animate-pulse`}></div>

      {/* Tooltip com informações detalhadas */}
      {showTooltip && (
        <div className="absolute bottom-6 right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <span className="font-semibold text-gray-900">{getStatusText()}</span>
            </div>

            <div className="text-xs text-gray-600 space-y-1 border-t pt-2">
              <p>• Última verificação: {lastCheck.toLocaleTimeString()}</p>
              {performanceInfo && (
                <>
                  <p>• Latência: {performanceInfo.responseTime}ms</p>
                  <p>• Última sincronização: {performanceInfo.lastSync.toLocaleTimeString()}</p>
                </>
              )}
              {backendStatus === 'offline' && (
                <p className="text-red-600 font-medium mt-2">
                  ⚠️ Verifique a conexão com o backend
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { hasPermission, canAccessQueues, canAccessSpecificQueue, canMoveToQueue, user, login } = useAuth();
  type Tab = 'send' | 'robot' | 'manual' | 'deyse' | 'enzo' | 'iago' | 'tracking' | 'returned' | 'admin';

  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(user?.firstLogin || false);

  const allTabs = [
    { id: 'send', label: 'Envio de Protocolo', icon: Upload, color: 'blue' },
    { id: 'robot', label: 'Fila do Robô', icon: Notebook, color: 'red' },
    { id: 'manual', label: 'Fila Manual', icon: Users, color: 'blue' },
    { id: 'deyse', label: 'Fila da Deyse', icon: Users, color: 'purple' },
    { id: 'enzo', label: 'Fila do Enzo', icon: Users, color: 'green' },
    { id: 'iago', label: 'Fila do Iago', icon: Users, color: 'orange' },
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
    if (tab.id === 'manual') return canAccessSpecificQueue('manual');
    if (tab.id === 'deyse') return canAccessSpecificQueue('deyse');
    if (tab.id === 'enzo') return canAccessSpecificQueue('enzo');
    if (tab.id === 'iago') return canAccessSpecificQueue('iago');
    if (tab.id === 'admin') return hasPermission('canAccessAllQueues');
    return false;
  });
  
  // Se o usuário não tem acesso à aba atual, redirecionar para a primeira disponível
  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id as Tab);
    }
  }, [tabs, activeTab]);

  React.useEffect(() => {
    setShowFirstLoginModal(user?.firstLogin || false);
  }, [user?.firstLogin]);

  const handlePasswordChanged = () => {
    setShowFirstLoginModal(false);
    if (user) {
      const updatedUser = { ...user, firstLogin: false };
      login(updatedUser);
    }
  };

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
        {activeTab === 'manual' && <ManualQueue employee="Manual" />}
        {activeTab === 'deyse' && <ManualQueue employee="Deyse" />}
        {activeTab === 'enzo' && <ManualQueue employee="Enzo" />}
        {activeTab === 'iago' && <ManualQueue employee="Iago" />}
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

      {/* Profile Button - Fixed Bottom Left */}
      <button
        onClick={() => setShowUserProfile(true)}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center space-x-2 z-40"
        title="Meu Perfil"
      >
        <UserCircle className="w-6 h-6" />
      </button>

      {/* Status de Conectividade - Fixed Bottom Right */}
      <ConnectivityStatus />

      {/* Modals */}
      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} />
      {showFirstLoginModal && <FirstLoginModal onPasswordChanged={handlePasswordChanged} />}
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