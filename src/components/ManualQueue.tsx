import React, { useState, useEffect } from 'react';
import { Download, FileText, X, CheckCircle, XCircle, Eye, AlertTriangle, FileCheck, User, Clock, Square, CheckSquare, RotateCcw, AlertCircle, History, ArrowRight, ChevronLeft } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { Protocol } from '../types';
import { QueueManager } from './QueueManager';

interface ManualQueueProps {
  employee: 'Carlos' | 'Deyse';
}

export function ManualQueue({ employee }: ManualQueueProps) {
  const { protocols, userEmails, updateProtocolStatus, updateTrigger, forceRefresh } = useProtocols();
  const { returnProtocol } = useProtocols();
  const { hasPermission } = useAuth();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtrar protocolos do funcionário em tempo real
  const getEmployeeProtocols = () => {
    return protocols.filter(p => 
      p.status === 'Aguardando' && 
      p.assignedTo === employee
    );
  };

  const employeeProtocols = getEmployeeProtocols();

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
    return employee === 'Carlos' ? 'blue' : 'purple';
  };

  const handleDownload = (doc: any) => {
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProtocol(null);
  };

  const handleMarkAsDone = () => {
    if (selectedProtocol) {
      updateProtocolStatus(selectedProtocol.id, 'Peticionado');
      handleCloseModal();
    }
  };

  const handleMarkAsError = () => {
    if (selectedProtocol) {
      updateProtocolStatus(selectedProtocol.id, 'Erro');
      handleCloseModal();
    }
  };

  const handleReturnProtocol = () => {
    if (selectedProtocol && returnReason.trim()) {
      returnProtocol(selectedProtocol.id, returnReason.trim(), employee);
      
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
    return employee === 'Carlos' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
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
        <h2 className="text-2xl font-bold text-gray-900">Fila do {employee} - Protocolos Aguardando</h2>
        <button
          onClick={handleRefreshQueue}
          disabled={isRefreshing}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
            employee === 'Carlos' 
              ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
              : 'text-purple-600 bg-purple-100 hover:bg-purple-200'
          } disabled:cursor-not-allowed`}
          title="Atualizar fila - recarregar protocolos"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar Fila'}
        </button>
      </div>

      {/* Card de resumo do funcionário */}
      <div className="mb-6">
        <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${employee === 'Carlos' ? 'border-blue-500' : 'border-purple-500'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className={`h-8 w-8 ${employee === 'Carlos' ? 'text-blue-500' : 'text-purple-500'} mr-3`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{employee}</h3>
                <p className="text-sm text-gray-600">Funcionário{employee === 'Deyse' ? 'a' : ''}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${employee === 'Carlos' ? 'text-blue-600' : 'text-purple-600'}`}>
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
        currentQueue={employee === 'Carlos' ? 'carlos' : 'deyse'}
        selectedProtocols={validSelectedProtocols}
        setSelectedProtocols={setSelectedProtocols}
        onProtocolsMoved={handleProtocolsMoved}
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
                      {protocol.processNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {protocol.jurisdiction}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee === 'Carlos' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {protocol.system}
                    </span>
                  </td>
                  <td className="px-3 py-4 max-w-xs">
                    <div className="text-sm text-gray-900 truncate" data-petition-type={protocol.petitionType} title={protocol.petitionType}>
                      {protocol.petitionType}
                    </div>
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
                    <button
                      onClick={() => handleProtocolClick(protocol)}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md whitespace-nowrap ${
                        employee === 'Carlos' 
                          ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500' 
                          : 'text-purple-700 bg-purple-100 hover:bg-purple-200 focus:ring-purple-500'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      data-action="view-protocol"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visualizar
                    </button>
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
          <div className="relative top-10 mx-auto p-4 border w-11/12 max-w-xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes do Protocolo - {employee}
                    </h3>
                    <button
                      onClick={() => setShowActivityLog(true)}
                      className="flex items-center px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Ver histórico de atividades"
                    >
                      <History className="h-3 w-3 mr-1" />
                      Log
                    </button>
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
                <div className="mt-3 space-y-3">
                  {/* Informações do Criador */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">Criado por:</span>
                      <span className="ml-2 text-sm text-gray-900">{userEmails[selectedProtocol.createdBy] || 'Carregando...'}</span>
                    </div>
                  </div>

                  {/* Funcionário Responsável */}
                  <div className={`${employee === 'Carlos' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} p-2 rounded-lg border`}>
                    <div className="flex items-center">
                      <User className={`h-5 w-5 ${employee === 'Carlos' ? 'text-blue-600' : 'text-purple-600'} mr-2`} />
                      <span className={`text-sm font-medium ${employee === 'Carlos' ? 'text-blue-800' : 'text-purple-800'}`}>
                        Responsável: {employee}
                      </span>
                    </div>
                  </div>

                  {/* Informações do Processo */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Número do Processo
                      </label>
                      <p className="mt-1 text-sm text-gray-900 font-medium" data-modal-process-number={selectedProtocol.processNumber}>
                        {selectedProtocol.processNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Tribunal
                      </label>
                      <p className="mt-1 text-xs text-gray-900" data-modal-court={selectedProtocol.court}>
                        {selectedProtocol.court}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Sistema
                      </label>
                      <p className="mt-1" data-modal-system={selectedProtocol.system}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEmployeeColor()}`}>
                          {selectedProtocol.system}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Grau da Jurisdição
                      </label>
                      <p className="mt-1 text-sm text-gray-900" data-modal-jurisdiction={selectedProtocol.jurisdiction}>
                        {selectedProtocol.jurisdiction}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Tipo de Petição
                      </label>
                      <p className="mt-1 text-xs text-gray-900" data-modal-petition-type={selectedProtocol.petitionType}>
                        {selectedProtocol.petitionType}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex space-x-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Fatal
                          </label>
                          {selectedProtocol.isFatal ? (
                            <p className="mt-1 text-xs font-bold text-red-600 flex items-center" data-modal-fatal="true">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              SIM
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-600" data-modal-fatal="false">
                              Não
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Procuração
                          </label>
                          {selectedProtocol.needsProcuration ? (
                            <p className="mt-1 text-xs font-bold text-blue-600 flex items-center" data-modal-needs-procuration="true">
                              <FileCheck className="h-3 w-3 mr-1" />
                              SIM
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-600" data-modal-needs-procuration="false">
                              Não
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedProtocol.observations && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Observações
                      </label>
                      <p className="mt-1 text-xs text-gray-900 bg-yellow-50 p-2 rounded" data-modal-observations={selectedProtocol.observations}>
                        {selectedProtocol.observations}
                      </p>
                    </div>
                  )}

                  {/* Lista de Documentos Compacta */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Arquivos da Petição */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        📄 Petição ({selectedProtocol.documents.filter(d => d.category === 'petition').length})
                      </label>
                      <div className="bg-blue-50 rounded p-2 border border-blue-200 max-h-20 overflow-y-auto">
                        {selectedProtocol.documents.filter(d => d.category === 'petition').map((doc) => (
                          <div key={doc.id} className="flex items-center py-0.5">
                            <FileText className="h-3 w-3 text-blue-600 mr-1 flex-shrink-0" />
                            <span className="text-xs text-gray-900 truncate" data-modal-petition-document={doc.name} title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documentos Complementares */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        📎 Outros ({selectedProtocol.documents.filter(d => d.category === 'complementary').length})
                      </label>
                      <div className="bg-gray-50 rounded p-2 max-h-20 overflow-y-auto">
                        {selectedProtocol.documents.filter(d => d.category === 'complementary').length > 0 ? (
                          selectedProtocol.documents.filter(d => d.category === 'complementary').map((doc) => (
                            <div key={doc.id} className="flex items-center py-0.5">
                              <FileText className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" />
                              <span className="text-xs text-gray-900 truncate" data-modal-complementary-document={doc.name} title={doc.name}>
                                {doc.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Nenhum</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões para Download - Compactos */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadPetition}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      data-action="download-petition"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      📄 Baixar Petição
                    </button>

                    {selectedProtocol.documents.filter(d => d.category === 'complementary').length > 0 && (
                      <button
                        onClick={handleDownloadComplementaryDocuments}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        data-action="download-complementary-documents"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        📎 Baixar Outros
                      </button>
                    )}
                  </div>

                  {/* Botões de Status - Compactos */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <button
                      onClick={handleMarkAsDone}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      data-action="mark-as-done"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Feito
                    </button>
                    <button
                      onClick={handleMarkAsError}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      data-action="mark-as-error"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Erro
                    </button>
                    <button
                      onClick={() => setShowReturnModal(true)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      data-action="return-protocol"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Devolver
                    </button>
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
                                    {activity.performedBy && (
                                      <span className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        {activity.performedBy}
                                      </span>
                                    )}
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
      
      {/* Notificação de Sucesso */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      <div className={`mt-6 p-4 ${employee === 'Carlos' ? 'bg-blue-50' : 'bg-purple-50'} rounded-lg`}>
        <h3 className={`font-medium ${employee === 'Carlos' ? 'text-blue-900' : 'text-purple-900'} mb-2`}>
          Instruções para {employee}:
        </h3>
        <ul className={`text-sm ${employee === 'Carlos' ? 'text-blue-800' : 'text-purple-800'} space-y-1`}>
          <li>• Esta é sua fila pessoal de protocolos para peticionamento manual</li>
          <li>• Clique em "Visualizar" para ver detalhes e baixar documentos</li>
          <li>• Use "Atualizar Fila" no topo da página para recarregar protocolos do localStorage</li>
          <li>• Marque como "Feito" após completar o peticionamento</li>
          <li>• Use "Erro na execução" se houver problemas no processo</li>
          <li>• Use "Devolver" para retornar o protocolo ao criador com motivo da devolução</li>
        </ul>
      </div>
    </div>
  );
}