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

// Componente para mostrar status de conectividade (bolinha discreta)
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

    // Verificar status do backend
    const checkBackend = async () => {
      setLastCheck(new Date());
      const startTime = Date.now();

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const healthUrl = `${apiUrl}/health`;

        const response = await fetch(healthUrl, {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          setBackendStatus('online');
          setPerformanceInfo({
            responseTime,
            lastSync: new Date()
          });
        } else {
          setBackendStatus('offline');
          setPerformanceInfo(null);
        }
      } catch (error) {
        setBackendStatus('offline');
        setPerformanceInfo(null);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);

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
    if (!isOnline) return 'Sem Internet';
    if (backendStatus === 'offline') return 'Servidor Offline';
    if (backendStatus === 'checking') return 'Conectando...';
    return 'Servidor Online';
  };

  const getTooltipContent = () => {
    const parts = [];
    parts.push(`Status: ${getStatusText()}`);
    if (performanceInfo) {
      parts.push(`Latência: ${performanceInfo.responseTime}ms`);
      parts.push(`Última Sync: ${performanceInfo.lastSync.toLocaleTimeString()}`);
    }
    parts.push(`Última Verificação: ${lastCheck.toLocaleTimeString()}`);
    return parts.join('\n');
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 group"
      title={getTooltipContent()}
    >
      <div className={`w-4 h-4 rounded-full ${getStatusColor()} shadow-lg ${backendStatus === 'checking' ? 'animate-pulse' : ''}`} />

      {/* Tooltip ao passar o mouse */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap">
          <div className="font-semibold mb-1">{getStatusText()}</div>
          {performanceInfo && (
            <>
              <div>Latência: {performanceInfo.responseTime}ms</div>
              <div>Última Sync: {performanceInfo.lastSync.toLocaleTimeString()}</div>
            </>
          )}
          <div className="text-gray-400 mt-1 text-[10px]">
            Verificado: {lastCheck.toLocaleTimeString()}
          </div>
        </div>
      </div>
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

      {/* Modals */}
      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} />
      {showFirstLoginModal && <FirstLoginModal onPasswordChanged={handlePasswordChanged} />}

      {/* Status do Servidor - Bolinha Discreta */}
      <ConnectivityStatus />
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