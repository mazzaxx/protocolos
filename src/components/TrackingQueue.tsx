import React, { useState, useEffect } from 'react';
import { FileText, Eye, X, AlertTriangle, FileCheck, RotateCcw, Search, Filter, Calendar, User, Clock, ArrowRight, CheckCircle, AlertCircle, History, ChevronLeft, ChevronDown, ChevronRight, XCircle, RefreshCw } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_COLORS, Protocol } from '../types';

export function TrackingQueue() {
  const { protocols, updateProtocolStatus, updateTrigger, userEmails } = useProtocols();
  const { user } = useAuth();
  const [filter, setFilter] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    cnjSearch: '', // Novo filtro para busca por CNJ
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set()); // Para controlar quais protocolos estão expandidos

  // Filtrar apenas protocolos criados pelo usuário atual
  const getUserProtocols = () => {
    return protocols.filter(p => p.createdBy === user!.id);
  };

  const userProtocols = getUserProtocols();

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Força atualização dos protocolos
        window.location.reload();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Função para alternar expansão do protocolo
  const toggleProtocolExpansion = (protocolId: string) => {
    setExpandedProtocols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(protocolId)) {
        newSet.delete(protocolId);
      } else {
        newSet.add(protocolId);
      }
      return newSet;
    });
  };

  // Aplicar filtros
  const filteredProtocols = userProtocols.filter(protocol => {
    // Filtro por status
    if (filter.status && protocol.status !== filter.status) {
      return false;
    }

    // Filtro por data de início
    if (filter.dateFrom) {
      const protocolDate = new Date(protocol.createdAt);
      const filterDate = new Date(filter.dateFrom);
      if (protocolDate < filterDate) {
        return false;
      }
    }

    // Filtro por data de fim
    if (filter.dateTo) {
      const protocolDate = new Date(protocol.createdAt);
      const filterDate = new Date(filter.dateTo);
      filterDate.setHours(23, 59, 59, 999); // Incluir todo o dia
      if (protocolDate > filterDate) {
        return false;
      }
    }

    // Filtro por busca CNJ
    if (filter.cnjSearch) {
      const searchTerm = filter.cnjSearch.toLowerCase().replace(/[^\d]/g, '');
      const protocolNumber = protocol.processNumber.toLowerCase().replace(/[^\d]/g, '');
      if (!protocolNumber.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  const clearFilters = () => {
    setFilter({
      status: '',
      dateFrom: '',
      dateTo: '',
      cnjSearch: '',
    });
  };

  const handleProtocolClick = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowActivityLog(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProtocol(null);
    setShowActivityLog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aguardando':
        return <Clock className="h-3 w-3" />;
      case 'Peticionado':
        return <CheckCircle className="h-3 w-3" />;
      case 'Erro':
        return <XCircle className="h-3 w-3" />;
      case 'Devolvido':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getResponsibleInfo = (protocol: Protocol) => {
    if (protocol.status !== 'Aguardando') {
      return null;
    }

    if (protocol.assignedTo === 'Carlos') {
      return {
        text: 'Carlos',
        color: 'bg-blue-100 text-blue-800',
        icon: <User className="h-3 w-3 mr-1" />
      };
    } else if (protocol.assignedTo === 'Deyse') {
      return {
        text: 'Deyse',
        color: 'bg-purple-100 text-purple-800',
        icon: <User className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        text: 'Robô',
        color: 'bg-red-100 text-red-800',
        icon: <FileText className="h-3 w-3 mr-1" />
      };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const formatActivityDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meus Protocolos</h2>
          <p className="text-sm text-gray-600">Acompanhe o status dos seus protocolos enviados</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center px-4 py-2 rounded-md ${
              autoRefresh 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Atualização Ativa' : 'Atualização Manual'}
          </button>
        </div>
      </div>

      {/* Filtros Melhorados */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          {(filter.status || filter.dateFrom || filter.dateTo || filter.cnjSearch) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar Filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca por CNJ */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por Número do Processo (CNJ)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filter.cnjSearch}
                onChange={(e) => setFilter(prev => ({ ...prev, cnjSearch: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 0000000-00.0000.0.00.0000"
              />
            </div>
            {filter.cnjSearch && (
              <p className="mt-1 text-xs text-gray-500">
                Buscando por: "{filter.cnjSearch}"
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Peticionado">Peticionado</option>
              <option value="Erro">Erro</option>
              <option value="Devolvido">Devolvido</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de (início)
            </label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data até (fim)
            </label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Indicador de resultados */}
        {filteredProtocols.length !== userProtocols.length && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Mostrando {filteredProtocols.length} de {userProtocols.length} protocolos
              {filter.cnjSearch && ` para "${filter.cnjSearch}"`}
            </p>
          </div>
        )}
      </div>

      {/* Tabela de Protocolos com Expansão */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  {/* Coluna para botão de expansão */}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Envio
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProtocols.map((protocol) => (
                <React.Fragment key={protocol.id}>
                  {/* Linha principal do protocolo */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProtocolExpansion(protocol.id)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        title={expandedProtocols.has(protocol.id) ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                      >
                        {expandedProtocols.has(protocol.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {protocol.processNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {protocol.jurisdiction}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={protocol.petitionType}>
                        {protocol.petitionType}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[protocol.status]}`}>
                        {getStatusIcon(protocol.status)}
                        <span className="ml-1">{protocol.status}</span>
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {(() => {
                        const responsibleInfo = getResponsibleInfo(protocol);
                        return responsibleInfo ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${responsibleInfo.color}`}>
                            {responsibleInfo.icon}
                            {responsibleInfo.text}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {protocol.createdAt.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleProtocolClick(protocol)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>

                  {/* Linha expandida com detalhes */}
                  {expandedProtocols.has(protocol.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Informações Básicas */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Informações Básicas</h4>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Tribunal</label>
                              <p className="text-sm text-gray-900 mt-1">{protocol.court}</p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Sistema</label>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                {protocol.system}
                              </span>
                            </div>

                            <div className="flex space-x-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Fatal</label>
                                {protocol.isFatal ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500 mt-1">Não</span>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Procuração</label>
                                {protocol.needsProcuration ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                    <FileCheck className="h-3 w-3 mr-1" />
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500 mt-1">Não</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status e Datas */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Status e Datas</h4>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Data de Criação</label>
                              <p className="text-sm text-gray-900 mt-1">{formatDate(protocol.createdAt)}</p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Última Atualização</label>
                              <p className="text-sm text-gray-900 mt-1">{formatDate(protocol.updatedAt)}</p>
                            </div>

                            {protocol.status === 'Aguardando' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Posição na Fila</label>
                                <p className="text-sm font-medium text-gray-900 mt-1">#{protocol.queuePosition}</p>
                              </div>
                            )}

                            {protocol.status === 'Devolvido' && protocol.returnReason && (
                              <div>
                                <label className="block text-xs font-medium text-orange-600">Motivo da Devolução</label>
                                <p className="text-sm text-orange-800 bg-orange-50 p-2 rounded mt-1">{protocol.returnReason}</p>
                              </div>
                            )}
                          </div>

                          {/* Documentos e Observações */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900 border-b pb-1">Documentos e Observações</h4>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Documentos ({protocol.documents.length})</label>
                              <div className="mt-1 space-y-1">
                                {protocol.documents.slice(0, 3).map((doc) => (
                                  <div key={doc.id} className="flex items-center text-xs text-gray-700">
                                    <FileText className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                    <span className="truncate" title={doc.name}>
                                      {doc.name}
                                    </span>
                                    <span className="ml-1 text-gray-500">
                                      ({doc.category === 'petition' ? 'P' : 'C'})
                                    </span>
                                  </div>
                                ))}
                                {protocol.documents.length > 3 && (
                                  <p className="text-xs text-gray-500">
                                    +{protocol.documents.length - 3} mais...
                                  </p>
                                )}
                              </div>
                            </div>

                            {protocol.observations && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600">Observações</label>
                                <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded mt-1">
                                  {protocol.observations}
                                </p>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-gray-600">Criado por</label>
                              <p className="text-sm text-gray-900 mt-1">
                                {userEmails[protocol.createdBy] || 'Carregando...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProtocols.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter.cnjSearch ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo encontrado com os filtros aplicados'}
            </h3>
            <p className="text-gray-600">
              {filter.cnjSearch 
                ? `Não foi encontrado nenhum protocolo com o número "${filter.cnjSearch}"`
                : 'Tente ajustar os filtros ou criar um novo protocolo'
              }
            </p>
            {(filter.status || filter.dateFrom || filter.dateTo || filter.cnjSearch) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Visualização do Protocolo (mantido igual) */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes do Protocolo - Acompanhamento
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
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Conteúdo Principal */}
                <div className="mt-4 space-y-4">
                  {/* Status Atual */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status Atual:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedProtocol.status]}`}>
                        {getStatusIcon(selectedProtocol.status)}
                        <span className="ml-1">{selectedProtocol.status}</span>
                      </span>
                    </div>
                    {selectedProtocol.assignedTo && (
                      <div className="mt-2 flex items-center">
                        <span className="text-sm font-medium text-gray-700">Responsável:</span>
                        <span className="ml-2 text-sm text-gray-900">{selectedProtocol.assignedTo}</span>
                      </div>
                    )}
                  </div>

                  {/* Informações do Processo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número do Processo
                      </label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {selectedProtocol.processNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tribunal
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.court}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sistema
                      </label>
                      <p className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedProtocol.system}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Grau da Jurisdição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.jurisdiction}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Petição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.petitionType}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Data de Criação
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(selectedProtocol.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedProtocol.observations && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Observações
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-2 rounded">
                        {selectedProtocol.observations}
                      </p>
                    </div>
                  )}

                  {/* Motivo da Devolução (se aplicável) */}
                  {selectedProtocol.status === 'Devolvido' && selectedProtocol.returnReason && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                      <label className="block text-sm font-medium text-orange-800">
                        Motivo da Devolução
                      </label>
                      <p className="mt-1 text-sm text-orange-700">
                        {selectedProtocol.returnReason}
                      </p>
                    </div>
                  )}

                  {/* Documentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documentos Anexados ({selectedProtocol.documents.length})
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {selectedProtocol.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center py-1">
                          <FileCheck className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {doc.name} ({doc.category === 'petition' ? 'Petição' : 'Complementar'})
                          </span>
                        </div>
                      ))}
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
                      Status atual: {selectedProtocol.status}
                    </p>
                    {selectedProtocol.assignedTo && (
                      <p className="text-xs text-gray-600">
                        Responsável: {selectedProtocol.assignedTo}
                      </p>
                    )}
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

      {/* Resumo Estatístico */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Aguardando</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProtocols.filter(p => p.status === 'Aguardando').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Peticionado</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProtocols.filter(p => p.status === 'Peticionado').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Erro</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProtocols.filter(p => p.status === 'Erro').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Devolvidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {userProtocols.filter(p => p.status === 'Devolvido').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instruções de Uso */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">Como usar o acompanhamento:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• <strong>Busca por CNJ:</strong> Digite o número do processo para encontrar rapidamente</li>
          <li>• <strong>Seta de expansão:</strong> Clique na seta (▶) para ver todos os detalhes do protocolo</li>
          <li>• <strong>Filtros:</strong> Use os filtros para refinar sua busca por status, data, etc.</li>
          <li>• <strong>Ver Detalhes:</strong> Clique no botão para abrir o modal completo com histórico</li>
          <li>• <strong>Atualização automática:</strong> Ative para monitorar mudanças em tempo real</li>
          <li>• <strong>Relatórios:</strong> Acesse a aba "Administração" para baixar relatórios completos</li>
        </ul>
      </div>
    </div>
  );
}