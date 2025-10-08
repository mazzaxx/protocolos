import React, { useState, useEffect } from 'react';
import { Download, FileText, X, CheckCircle, XCircle, Eye, AlertTriangle, FileCheck, User, Clock, Square, CheckSquare, RotateCcw, AlertCircle, History, ArrowRight, ChevronLeft, Bell, BellRing } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol } from '../types';
import { QueueManager } from './QueueManager';

interface ManualQueueProps {
  employee: 'Manual' | 'Deyse' | 'Enzo' | 'Iago';
}

export function ManualQueue({ employee }: ManualQueueProps) {
  const { protocols, userEmails, updateProtocolStatus, updateTrigger, forceRefresh } = useProtocols();
  const { returnProtocol } = useProtocols();
  const { hasPermission, user } = useAuth();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [executingProtocols, setExecutingProtocols] = useState<Set<string>>(new Set());
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedProtocolAlerts, setSelectedProtocolAlerts] = useState<any[]>([]);

  // Filtrar protocolos do funcionário em tempo real
  const getEmployeeProtocols = () => {
    return protocols
      .filter(p =>
        (p.status === 'Aguardando' || p.status === 'Em Execução') &&
        p.assignedTo === employee
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const employeeProtocols = getEmployeeProtocols();

  // Função para calcular a posição na fila do funcionário
  const getEmployeeQueuePosition = (protocol: Protocol) => {
    if (protocol.status !== 'Aguardando') return null;
    
    const employeeQueueProtocols = employeeProtocols
      .filter(p => p.status === 'Aguardando')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const position = employeeQueueProtocols.findIndex(p => p.id === protocol.id) + 1;
    return position > 0 ? position : null;
  };

  // Limpar seleções quando protocolos são movidos
  useEffect(() => {
    setSelectedProtocols(prev => 
      prev.filter(id => employeeProtocols.some(p => p.id === id))
    );
  }, [employeeProtocols.length, updateTrigger]);

  const handleProtocolsMoved = () => {
    // Limpar seleções e forçar atualização
    setSelectedProtocols([]);
    forceRefresh();
  };

  const handleRefreshQueue = () => {
    setIsRefreshing(true);
    setSelectedProtocols([]);
    
    // Forçar recarregamento dos dados do localStorage
    setTimeout(() => {
      forceRefresh();
      setIsRefreshing(false);
    }, 500);
  };

  const handleSelectProtocol = (protocolId: string) => {
    // Verificar se o protocolo ainda existe na fila atual
    const protocolExists = employeeProtocols.some(p => p.id === protocolId);
    if (!protocolExists) {
      setSelectedProtocols(prev => prev.filter(id => id !== protocolId));
      return;
    }
    
    setSelectedProtocols(prev => 
      prev.includes(protocolId)
        ? prev.filter(id => id !== protocolId)
        : [...prev, protocolId]
    );
  };

  const getEmployeeAccentColor = () => {
    const colors = {
      'Manual': 'blue',
      'Deyse': 'purple',
      'Enzo': 'green',
      'Iago': 'orange'
    };
    return colors[employee] || 'gray';
  };

  const handleDownload = (doc: any) => {
    try {
      // Criar blob a partir do conteúdo base64
      const byteCharacters = atob(doc.content.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.type });
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do arquivo. Verifique se o arquivo está válido.');
    }
  };

  const handleDownloadSimulated = (doc: any) => {
    // Função alternativa para simulação (caso o base64 não funcione)
    const link = document.createElement('a');
    link.href = doc.content;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllDocuments = () => {
    if (!selectedProtocol) return;
    
    selectedProtocol.documents.forEach((doc, index) => {
      setTimeout(() => {
        handleDownload(doc);
      }, index * 500);
    });
  };

  const handleDownloadPetition = () => {
    if (!selectedProtocol) return;
    
    const petitionDocs = selectedProtocol.documents.filter(doc => doc.category === 'petition');
    petitionDocs.forEach((doc, index) => {
      setTimeout(() => {
        handleDownload(doc);
      }, index * 500);
    });
  };

  const handleDownloadComplementaryDocuments = () => {
    if (!selectedProtocol) return;
    
    const complementaryDocs = selectedProtocol.documents.filter(doc => doc.category === 'complementary');
    complementaryDocs.forEach((doc, index) => {
      setTimeout(() => {
        handleDownload(doc);
      }, index * 500);
    });
  };

  const handleProtocolClick = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setIsModalOpen(true);
  };

  const handleExecutionToggle = (protocolId: string) => {
    setExecutingProtocols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(protocolId)) {
        newSet.delete(protocolId);
        // Voltar para status "Aguardando"
        updateProtocolStatus(protocolId, 'Aguardando', user?.email || employee, user?.id);
      } else {
        newSet.add(protocolId);
        // Alterar para status "Em Execução"
        updateProtocolStatus(protocolId, 'Em Execução', user?.email || employee, user?.id);
      }
      return newSet;
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProtocol(null);
  };

  const handleMarkAsDone = () => {
    if (selectedProtocol) {
      updateProtocolStatus(selectedProtocol.id, 'Peticionado', user?.email || employee, user?.id);
      handleCloseModal();
    }
  };

  const handleMarkAsError = () => {
    if (selectedProtocol) {
      updateProtocolStatus(selectedProtocol.id, 'Erro', user?.email || employee, user?.id);
      handleCloseModal();
    }
  };

  const handleReturnProtocol = () => {
    if (selectedProtocol && returnReason.trim()) {
      returnProtocol(selectedProtocol.id, returnReason.trim(), user?.email || employee, user?.id);
      
      // Mostrar notificação de sucesso
      setSuccessMessage('Protocolo devolvido com sucesso!');
      setShowSuccessNotification(true);
      
      // Limpar estados e fechar modal
      setShowReturnModal(false);
      setReturnReason('');
      handleCloseModal();
      
      // Forçar atualização da lista
      handleProtocolsMoved();
      
      // Esconder notificação após 4 segundos
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 4000);
    }
  };
  const getEmployeeColor = (employee: string) => {
    const colors = {
      'Manual': 'bg-blue-100 text-blue-800',
      'Deyse': 'bg-purple-100 text-purple-800',
      'Enzo': 'bg-green-100 text-green-800',
      'Iago': 'bg-orange-100 text-orange-800'
    };
    return colors[employee as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Helper para cores de texto e botões
  const getEmployeeTextColor = () => {
    const colors = {
      'Manual': 'text-blue-600',
      'Deyse': 'text-purple-600',
      'Enzo': 'text-green-600',
      'Iago': 'text-orange-600'
    };
    return colors[employee] || 'text-gray-600';
  };

  const getEmployeeBgColor = () => {
    const colors = {
      'Manual': 'bg-blue-600',
      'Deyse': 'bg-purple-600',
      'Enzo': 'bg-green-600',
      'Iago': 'bg-orange-600'
    };
    return colors[employee] || 'bg-gray-600';
  };

  const getEmployeeBorderColor = () => {
    const colors = {
      'Manual': 'border-blue-500',
      'Deyse': 'border-purple-500',
      'Enzo': 'border-green-500',
      'Iago': 'border-orange-500'
    };
    return colors[employee] || 'border-gray-500';
  };

  const getEmployeeButtonColors = () => {
    const colors = {
      'Manual': 'text-blue-600 bg-blue-100 hover:bg-blue-200',
      'Deyse': 'text-purple-600 bg-purple-100 hover:bg-purple-200',
      'Enzo': 'text-green-600 bg-green-100 hover:bg-green-200',
      'Iago': 'text-orange-600 bg-orange-100 hover:bg-orange-200'
    };
    return colors[employee] || 'text-gray-600 bg-gray-100 hover:bg-gray-200';
  };

  const getEmployeeModalButtonColors = () => {
    const colors = {
      'Manual': 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500',
      'Deyse': 'text-purple-700 bg-purple-100 hover:bg-purple-200 focus:ring-purple-500',
      'Enzo': 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500',
      'Iago': 'text-orange-700 bg-orange-100 hover:bg-orange-200 focus:ring-orange-500'
    };
    return colors[employee] || 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500';
  };

  const getQueueName = () => {
    return employee === 'Manual' ? 'manual' : employee.toLowerCase();
  };

  // Estilos para modais e cards
  const getEmployeeModalBg = () => {
    const colors = {
      'Manual': 'bg-blue-50 border-blue-200',
      'Deyse': 'bg-purple-50 border-purple-200',
      'Enzo': 'bg-green-50 border-green-200',
      'Iago': 'bg-orange-50 border-orange-200'
    };
    return colors[employee] || 'bg-gray-50 border-gray-200';
  };

  const getEmployeeModalText = () => {
    const colors = {
      'Manual': 'text-blue-800',
      'Deyse': 'text-purple-800',
      'Enzo': 'text-green-800',
      'Iago': 'text-orange-800'
    };
    return colors[employee] || 'text-gray-800';
  };

  const getEmployeeModalTextDark = () => {
    const colors = {
      'Manual': 'text-blue-900',
      'Deyse': 'text-purple-900',
      'Enzo': 'text-green-900',
      'Iago': 'text-orange-900'
    };
    return colors[employee] || 'text-gray-900';
  };

  const getEmployeeModalTextLight = () => {
    const colors = {
      'Manual': 'text-blue-700',
      'Deyse': 'text-purple-700',
      'Enzo': 'text-green-700',
      'Iago': 'text-orange-700'
    };
    return colors[employee] || 'text-gray-700';
  };

  const getEmployeeModalButtonBg = () => {
    const colors = {
      'Manual': 'bg-blue-600 hover:bg-blue-700',
      'Deyse': 'bg-purple-600 hover:bg-purple-700',
      'Enzo': 'bg-green-600 hover:bg-green-700',
      'Iago': 'bg-orange-600 hover:bg-orange-700'
    };
    return colors[employee] || 'bg-gray-600 hover:bg-gray-700';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatActivityDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filtrar protocolos selecionados que ainda existem na fila atual
  const validSelectedProtocols = selectedProtocols.filter(id => 
    employeeProtocols.some(p => p.id === id)
  );

  // Atualizar selectedProtocols se houver protocolos inválidos
  React.useEffect(() => {
    if (validSelectedProtocols.length !== selectedProtocols.length) {
      setSelectedProtocols(validSelectedProtocols);
    }
  }, [validSelectedProtocols.length, selectedProtocols.length]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fila {employee} - Protocolos Aguardando</h2>
        <button
          onClick={handleRefreshQueue}
          disabled={isRefreshing}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${getEmployeeButtonColors()} disabled:cursor-not-allowed`}
          title="Atualizar fila - recarregar protocolos"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Fila'}
        </button>
      </div>

      {/* Card de resumo do funcionário */}
      <div className="mb-6">
        <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${getEmployeeBorderColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className={`h-8 w-8 ${getEmployeeTextColor()} mr-3`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{employee === 'Manual' ? 'Fila Manual' : employee}</h3>
                <p className="text-sm text-gray-600">{employee === 'Manual' ? 'Distribuição' : ''}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getEmployeeTextColor()}`}>
                {employeeProtocols.length}
              </p>
              <p className="text-sm text-gray-500">protocolos aguardando</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gerenciador de Filas */}
      <QueueManager
        protocols={employeeProtocols}
        currentQueue={getQueueName() as any}
        selectedProtocols={validSelectedProtocols}
        setSelectedProtocols={setSelectedProtocols}
        onProtocolsMoved={handleProtocolsMoved}
        updateProtocolStatus={updateProtocolStatus}
      />
      
      {employeeProtocols.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Nenhum protocolo aguardando para {employee}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {hasPermission('canMoveProtocols') && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                )}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sistema
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatal
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procuração
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documentos
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeProtocols.map((protocol) => (
                <tr key={protocol.id} className="hover:bg-gray-50">
                  {hasPermission('canMoveProtocols') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectProtocol(protocol.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {validSelectedProtocols.includes(protocol.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900" data-process-number={protocol.processNumber}>
                      <div className="flex items-center">
                        {protocol.isDistribution && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                            📋 DISTRIBUIÇÃO
                          </span>
                        )}
                        {protocol.processType && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                            protocol.processType === 'civel' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {protocol.processType === 'civel' ? '⚖️ CÍVEL' : '👷 TRABALHISTA'}
                          </span>
                        )}
                        {protocol.processNumber || (protocol.isDistribution ? 'Distribuição sem número' : protocol.processNumber)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {protocol.jurisdiction || (protocol.isDistribution ? 'Jurisdição não especificada' : protocol.jurisdiction)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeColor(employee)}`}>
                      {protocol.system || (protocol.isDistribution ? 'Sistema não especificado' : protocol.system)}
                    </span>
                    {protocol.isDistribution && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        📋 Distribuição
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 max-w-xs">
                    <div className="text-sm text-gray-900 truncate" data-petition-type={protocol.petitionType} title={protocol.petitionType}>
                      {protocol.petitionType || (protocol.isDistribution ? 'Tipo não especificado' : protocol.petitionType)}
                    </div>
                   {protocol.returnReason && protocol.returnReason.startsWith('Devolvido pelo Robô:') && (
                     <div className="text-xs text-orange-600 mt-1 font-medium">
                       🤖 Devolvido pelo Robô
                     </div>
                   )}
                   {protocol.isDistribution && (
                     <div className="text-xs text-orange-600 mt-1 font-medium">
                       📋 Distribuição
                     </div>
                   )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {protocol.isFatal ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sim
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Não
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {protocol.needsProcuration ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Sim
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Não
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-600">
                      {protocol.documents.length} documento(s)
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={executingProtocols.has(protocol.id)}
                        onChange={() => handleExecutionToggle(protocol.id)}
                        className={`h-4 w-4 focus:ring-2 border-gray-300 rounded mr-2 ${getEmployeeTextColor()} focus:ring-${getEmployeeAccentColor()}-500`}
                      />
                      <span className="text-xs text-gray-600">
                        {executingProtocols.has(protocol.id) ? 'Em Execução' : 'Aguardando'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleProtocolClick(protocol)}
                        disabled={!executingProtocols.has(protocol.id)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md whitespace-nowrap ${
                          executingProtocols.has(protocol.id)
                            ? getEmployeeModalButtonColors()
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                        data-action="view-protocol"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Protocolo (mesmo da RobotQueue) */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 mx-auto p-4 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white max-h-[96vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Detalhes do Protocolo - {employee}
                    </h3>
                    <button
                      onClick={() => setShowActivityLog(true)}
                      className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Ver histórico de atividades"
                    >
                      <History className="h-3 w-3 mr-1" />
                      Log
                    </button>
                    {selectedProtocol.taskCode && (
                      <span className="text-sm text-gray-700">
                        Código: <span className="font-semibold">{selectedProtocol.taskCode}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                    data-action="close-modal"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="mt-3">
                  {/* Informações do Criador */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-blue-700">Criado por:</span>
                        <span className="ml-2 text-sm font-bold text-blue-900">{userEmails[selectedProtocol.createdBy] || 'Carregando...'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-blue-600">Data:</div>
                        <div className="text-sm font-semibold text-blue-900">{formatDate(selectedProtocol.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Funcionário Responsável */}
                  <div className={`${getEmployeeModalBg()} p-2 rounded-lg border mb-3`}>
                    <div className="flex items-center justify-center">
                      <User className={`h-4 w-4 ${getEmployeeTextColor()} mr-2`} />
                      <span className={`text-sm font-bold ${getEmployeeModalText()}`}>
                        👤 Responsável: {employee}
                      </span>
                    </div>
                  </div>

                  {/* Layout em duas colunas */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Coluna Esquerda - Informações do Processo */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">📋 Informações</h4>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Número do Processo
                          </label>
                          <p className="text-sm font-bold text-gray-900 bg-gray-50 p-2 rounded" data-modal-process-number={selectedProtocol.processNumber}>
                            {selectedProtocol.processNumber || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.processNumber)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tribunal
                          </label>
                          <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded" data-modal-court={selectedProtocol.court}>
                            {selectedProtocol.court || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.court)}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Sistema
                            </label>
                            <div data-modal-system={selectedProtocol.system}>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmployeeColor(employee)}`}>
                                {selectedProtocol.system || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.system)}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Jurisdição
                            </label>
                            <p className="text-xs text-gray-900 bg-gray-50 p-1 rounded" data-modal-jurisdiction={selectedProtocol.jurisdiction}>
                              {selectedProtocol.jurisdiction || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.jurisdiction)}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo de Petição
                          </label>
                          <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded" data-modal-petition-type={selectedProtocol.petitionType}>
                            {selectedProtocol.petitionType || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.petitionType)}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <label className="block text-xs font-medium text-red-700 mb-1">
                              Fatal
                            </label>
                            {selectedProtocol.isFatal ? (
                              <p className="text-sm font-bold text-red-600 flex items-center" data-modal-fatal="true">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                SIM
                              </p>
                            ) : (
                              <p className="text-xs text-gray-600" data-modal-fatal="false">
                                Não
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                              Procuração
                            </label>
                            {selectedProtocol.needsProcuration ? (
                              <p className="text-sm font-bold text-blue-600 flex items-center" data-modal-needs-procuration="true">
                                <FileCheck className="h-4 w-4 mr-1" />
                                SIM
                              </p>
                            ) : (
                              <p className="text-xs text-gray-600" data-modal-needs-procuration="false">
                                Não
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Observações */}
                        {selectedProtocol.observations && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Observações
                            </label>
                            <p className="text-xs text-gray-900 bg-yellow-50 border border-yellow-200 p-2 rounded" data-modal-observations={selectedProtocol.observations}>
                              {selectedProtocol.observations}
                            </p>
                          </div>
                        )}
                        
                        {/* Tipo de Procuração */}
                        {selectedProtocol.needsProcuration && selectedProtocol.procurationType && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tipo de Procuração
                            </label>
                            <p className="text-xs text-gray-900 bg-blue-50 border border-blue-200 p-2 rounded">
                              {selectedProtocol.procurationType}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Posição na Fila do Funcionário */}
                    {getEmployeeQueuePosition(selectedProtocol) && (
                      <div className={`border rounded p-3 ${getEmployeeModalBg()}`}>
                        <h5 className={`text-xs font-medium mb-1 ${getEmployeeModalText()}`}>
                          👤 Posição na Fila {employee}
                        </h5>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmployeeColor(employee)}`}>
                            #{getEmployeeQueuePosition(selectedProtocol)} na fila
                          </span>
                        </div>
                        <div className={`text-xs mt-1 ${getEmployeeTextColor()}`}>
                          Baseado na ordem de criação
                        </div>
                      </div>
                    )}

                    {/* Coluna Direita - Documentos e Ações */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">📎 Documentos e Ações</h4>
                      
                      {/* Guias de Recolhimento */}
                      {selectedProtocol.needsGuia && selectedProtocol.guias && selectedProtocol.guias.length > 0 && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            💰 Guias de Recolhimento ({selectedProtocol.guias.length})
                          </label>
                          <div className="space-y-1">
                            {selectedProtocol.guias.map((guia, index) => (
                              <div key={guia.id} className="bg-green-50 border border-green-200 rounded p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-green-800">
                                    Guia #{index + 1} - {guia.system}
                                  </span>
                                </div>
                                <p className="text-xs text-green-700 font-mono mt-1">
                                  {guia.number}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Documentos */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          📄 Documentos ({selectedProtocol.documents.length})
                        </label>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {/* Petição */}
                          <div className={`border rounded p-2 ${getEmployeeModalBg()}`}>
                            <div className="flex items-center justify-between mb-1">
                              <h5 className={`text-xs font-medium ${getEmployeeModalText()}`}>📄 Petição ({selectedProtocol.documents.filter(d => d.category === 'petition').length})</h5>
                              <button
                                onClick={handleDownloadPetition}
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white transition-colors ${getEmployeeModalButtonBg()}`}
                                data-action="download-petition"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Baixar
                              </button>
                            </div>
                            <div className={`text-xs ${getEmployeeModalTextLight()}`}>
                              {selectedProtocol.documents.filter(d => d.category === 'petition').length} arquivo(s)
                            </div>
                          </div>
                          
                          {/* Documentos Complementares */}
                          {selectedProtocol.documents.filter(d => d.category === 'complementary').length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-xs font-medium text-gray-800">📎 Complementares ({selectedProtocol.documents.filter(d => d.category === 'complementary').length})</h5>
                                <button
                                  onClick={handleDownloadComplementaryDocuments}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 transition-colors"
                                  data-action="download-complementary-documents"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Baixar
                                </button>
                              </div>
                              <div className="text-xs text-gray-700">
                                {selectedProtocol.documents.filter(d => d.category === 'complementary').length} arquivo(s)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Botões de Ação - Sempre Visíveis */}
                      <div className={`border rounded p-3 ${getEmployeeModalBg()}`}>
                        <h5 className={`text-xs font-medium mb-2 ${getEmployeeModalText()}`}>🎯 Ações do {employee}</h5>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={handleMarkAsDone}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
                            data-action="mark-as-done"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            ✅ PETICIONADO COM SUCESSO
                          </button>
                          
                          <button
                            onClick={() => setShowReturnModal(true)}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                            data-action="return-protocol"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            🔄 DEVOLVER PROTOCOLO
                          </button>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-xs text-gray-600 text-center">
                            💡 Use os atributos data-action para automação
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header do Log */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowActivityLog(false)}
                      className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Voltar aos detalhes"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Voltar
                    </button>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Histórico de Atividades
                    </h3>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Conteúdo do Log */}
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Processo:</strong> {selectedProtocol.processNumber}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Criado por: {userEmails[selectedProtocol.createdBy] || 'Carregando...'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Responsável: {employee}
                    </p>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedProtocol.activityLog && selectedProtocol.activityLog.length > 0 ? (
                      selectedProtocol.activityLog
                        .filter(activity => activity.performedBy)
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((activity) => (
                          <div key={activity.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {activity.action === 'created' && <Clock className="h-4 w-4 text-blue-500" />}
                                {activity.action === 'moved_to_queue' && <ArrowRight className="h-4 w-4 text-purple-500" />}
                                {activity.action === 'status_changed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {activity.action === 'returned' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                                {activity.action === 'resubmitted' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                {activity.details && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Detalhes:</strong> {activity.details}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {activity.performedBy}
                                    </span>
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatActivityDate(new Date(activity.timestamp))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhuma atividade registrada</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Devolução */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Devolver Protocolo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Informe o motivo da devolução para o criador do protocolo:
              </p>
              
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ex: Documentos incompletos, dados incorretos, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
                required
              />

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReturnProtocol}
                  disabled={!returnReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Devolver Protocolo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Alertas */}
      {showAlertsModal && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BellRing className="h-5 w-5 text-red-500 mr-2" />
                  Alertas do Protocolo - {employee}
                </h3>
                <button
                  onClick={() => setShowAlertsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Processo:</strong> {selectedProtocol.processNumber}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Criado por: {userEmails[selectedProtocol.createdBy] || 'Carregando...'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Responsável: {employee}
                  </p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedProtocolAlerts.length > 0 ? (
                    selectedProtocolAlerts
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((alert) => (
                        <div key={alert.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-900">Alerta Urgente</p>
                              <p className="text-sm text-orange-800 mt-1">{alert.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm text-orange-600">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {userEmails[alert.createdBy] || 'Usuário'}
                                  </span>
                                </span>
                                <span className="text-xs text-orange-500">
                                  {new Date(alert.createdAt).toLocaleDateString('pt-BR')} às {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhum alerta para este protocolo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de Sucesso */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      <div className={`mt-6 p-4 ${employee === 'Manual' ? 'bg-blue-50' : employee === 'Deyse' ? 'bg-purple-50' : employee === 'Enzo' ? 'bg-green-50' : 'bg-orange-50'} rounded-lg`}>
        <h3 className={`font-medium ${getEmployeeModalTextDark()} mb-2`}>
          Instruções {employee}:
        </h3>
        <ul className={`text-sm ${getEmployeeModalText()} space-y-1`}>
          <li>• Esta é sua fila pessoal de protocolos para peticionamento manual</li>
          <li>• Clique em "Visualizar" para ver detalhes e baixar documentos</li>
          <li>• <strong>Alertas (🔔):</strong> Botão vermelho piscante indica alertas urgentes do advogado</li>
          <li>• Use "Atualizar Fila" no topo da página para recarregar protocolos do localStorage</li>
          <li>• Marque como "Feito" após completar o peticionamento</li>
          <li>• Use "Devolver" para retornar o protocolo ao criador com motivo da devolução</li>
          <li>• <strong>IMPORTANTE:</strong> Protocolos reenviados da aba "Devolvidos" sempre retornam para sua fila</li>
        </ul>
      </div>
    </div>
  );
}