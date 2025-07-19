import React, { useState, useEffect } from 'react';
import { Users, Settings, Plus, Edit, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, Clock, XCircle, Search, ChevronDown, ChevronRight, FileText, AlertTriangle, FileCheck, User, ArrowRight, History, ChevronLeft, X, Download, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtocols } from '../hooks/useProtocols';
import { STATUS_COLORS, Protocol } from '../types';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
}

export function AdminDashboard() {
  const { hasPermission } = useAuth();
  const { protocols, userEmails } = useProtocols();
  const [activeTab, setActiveTab] = useState<'employees' | 'protocols'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado'
  });

  // Estados para o relatório de protocolos
  const [filter, setFilter] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    cnjSearch: '',
    createdBy: '',
  });
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set());
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: '',
    includeAllStatuses: true,
    selectedStatuses: ['Aguardando', 'Peticionado', 'Erro', 'Devolvido']
  });

  // Verificar permissões
  if (!hasPermission('canAccessAllQueues')) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3002/api/admin/funcionarios');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.funcionarios);
      } else {
        setError('Erro ao carregar funcionários');
      }
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Erro: Backend não está rodando. Execute "npm run server" ou "npm run dev:full"');
      } else {
        setError('Erro ao conectar com o servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3002/api/admin/funcionarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário criado com sucesso!');
        setFormData({ email: '', senha: '', permissao: 'advogado' });
        setShowAddModal(false);
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao criar funcionário');
      }
    } catch (err) {
      console.error('Erro ao criar funcionário:', err);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:3002/api/admin/funcionarios/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário atualizado com sucesso!');
        setShowEditModal(false);
        setSelectedEmployee(null);
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao atualizar funcionário');
      }
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err);
      setError('Erro ao conectar com o servidor');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este funcionário?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/admin/funcionarios/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário deletado com sucesso!');
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao deletar funcionário');
      }
    } catch (err) {
      console.error('Erro ao deletar funcionário:', err);
      setError('Erro ao conectar com o servidor');
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email,
      senha: '',
      permissao: employee.permissao
    });
    setShowEditModal(true);
  };

  const getPermissionColor = (permissao: string) => {
    switch (permissao) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'mod': return 'bg-purple-100 text-purple-800';
      case 'advogado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionLabel = (permissao: string) => {
    switch (permissao) {
      case 'admin': return 'Administrador';
      case 'mod': return 'Moderador';
      case 'advogado': return 'Advogado';
      default: return permissao;
    }
  };

  // Funções para o relatório de protocolos
  const filteredProtocols = protocols.filter(protocol => {
    const matchesStatus = !filter.status || protocol.status === filter.status;
    const matchesDateFrom = !filter.dateFrom || protocol.createdAt >= new Date(filter.dateFrom);
    const matchesDateTo = !filter.dateTo || protocol.createdAt <= new Date(filter.dateTo);
    const matchesCreatedBy = !filter.createdBy || protocol.createdBy.toString() === filter.createdBy;
    
    // Filtro por CNJ - busca no número do processo
    const matchesCNJ = !filter.cnjSearch || 
      protocol.processNumber.toLowerCase().includes(filter.cnjSearch.toLowerCase().replace(/[^\d]/g, ''));
    
    return matchesStatus && matchesDateFrom && matchesDateTo && matchesCreatedBy && matchesCNJ;
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aguardando': return <Clock className="h-4 w-4" />;
      case 'Peticionado': return <CheckCircle className="h-4 w-4" />;
      case 'Erro': return <XCircle className="h-4 w-4" />;
      case 'Devolvido': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
        icon: <Users className="h-3 w-3 mr-1" />
      };
    } else if (protocol.assignedTo === 'Deyse') {
      return {
        text: 'Deyse',
        color: 'bg-purple-100 text-purple-800',
        icon: <Users className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        text: 'Robô',
        color: 'bg-red-100 text-red-800',
        icon: <Settings className="h-3 w-3 mr-1" />
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

  const clearFilters = () => {
    setFilter({
      status: '',
      dateFrom: '',
      dateTo: '',
      cnjSearch: '',
      createdBy: '',
    });
  };

  const generateReport = (startDate?: string, endDate?: string, statuses?: string[]) => {
    // Filtrar protocolos por data se especificado
    let filteredProtocols = protocols;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredProtocols = filteredProtocols.filter(p => new Date(p.createdAt) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredProtocols = filteredProtocols.filter(p => new Date(p.createdAt) <= end);
    }
    
    if (statuses && statuses.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => statuses.includes(p.status));
    }

    const reportData = filteredProtocols.map(protocol => ({
      id: protocol.id,
      processNumber: protocol.processNumber,
      court: protocol.court,
      system: protocol.system,
      jurisdiction: protocol.jurisdiction,
      isFatal: protocol.isFatal,
      needsProcuration: protocol.needsProcuration,
      petitionType: protocol.petitionType,
      observations: protocol.observations || '',
      status: protocol.status,
      assignedTo: protocol.assignedTo || 'Robô',
      createdBy: userEmails[protocol.createdBy] || 'Usuário não encontrado',
      returnReason: protocol.returnReason || '',
      createdAt: protocol.createdAt.toISOString(),
      updatedAt: protocol.updatedAt.toISOString(),
      documents: protocol.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
        type: doc.type,
        category: doc.category,
        content: doc.content
      })),
      activityLog: protocol.activityLog || []
    }));

    // Criar HTML estruturado com visual limpo e expansível
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Protocolos - ${new Date().toLocaleDateString('pt-BR')}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            background-color: #f9fafb;
            color: #1f2937;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 16px;
        }
        
        .header .meta {
            display: flex;
            justify-content: center;
            gap: 32px;
            flex-wrap: wrap;
        }
        
        .meta-item {
            text-align: center;
        }
        
        .meta-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .meta-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
        }
        
        .protocol-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 16px;
            overflow: hidden;
            transition: all 0.2s ease;
        }
        
        .protocol-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .protocol-header {
            padding: 20px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.2s ease;
        }
        
        .protocol-header:hover {
            background-color: #f9fafb;
        }
        
        .protocol-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .protocol-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .protocol-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-aguardando { background: #fef3c7; color: #92400e; }
        .status-peticionado { background: #d1fae5; color: #065f46; }
        .status-erro { background: #fee2e2; color: #991b1b; }
        .status-devolvido { background: #fed7aa; color: #9a3412; }
        
        .expand-icon {
            width: 20px;
            height: 20px;
            transition: transform 0.2s ease;
            color: #6b7280;
        }
        
        .expand-icon.expanded {
            transform: rotate(90deg);
        }
        
        .protocol-details {
            display: none;
            padding: 0 20px 20px 20px;
        }
        
        .protocol-details.expanded {
            display: block;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }
        
        .detail-item {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
        }
        
        .detail-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .detail-value {
            font-weight: 500;
            color: #1f2937;
        }
        
        .documents-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .documents-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .document-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
        }
        
        .document-category {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
        }
        
        .category-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .document-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .document-item:last-child {
            border-bottom: none;
        }
        
        .document-info {
            flex: 1;
        }
        
        .document-name {
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 2px;
        }
        
        .document-size {
            font-size: 12px;
            color: #6b7280;
        }
        
        .download-link {
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        
        .download-link:hover {
            background: #2563eb;
        }
        
        .observations-section, .return-reason-section {
            margin-top: 20px;
            padding: 16px;
            border-radius: 8px;
        }
        
        .observations-section {
            background: #fffbeb;
            border: 1px solid #fbbf24;
        }
        
        .return-reason-section {
            background: #fef2f2;
            border: 1px solid #f87171;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .observations-section .section-title {
            color: #92400e;
        }
        
        .return-reason-section .section-title {
            color: #dc2626;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }
        
        .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        @media print {
            body { background: white; }
            .protocol-card { box-shadow: none; border: 1px solid #e5e7eb; }
            .protocol-details { display: block !important; }
            .expand-icon { display: none; }
        }
        
        @media (max-width: 768px) {
            .container { padding: 12px; }
            .header { padding: 20px; }
            .protocol-header { padding: 16px; }
            .protocol-details { padding: 0 16px 16px 16px; }
            .details-grid { grid-template-columns: 1fr; gap: 12px; }
            .document-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Relatório de Protocolos</h1>
            <p class="subtitle">Sistema de Protocolos Jurídicos</p>
            <div class="meta">
                <div class="meta-item">
                    <div class="meta-label">Data de Geração</div>
                    <div class="meta-value">${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Total de Protocolos</div>
                    <div class="meta-value">${reportData.length}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Aguardando</div>
                    <div class="meta-value">${reportData.filter(p => p.status === 'Aguardando').length}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Concluídos</div>
                    <div class="meta-value">${reportData.filter(p => p.status === 'Peticionado').length}</div>
                </div>
            </div>
        </div>
        
        ${reportData.length === 0 ? `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>Nenhum protocolo encontrado</h3>
                <p>Não há protocolos para exibir no momento.</p>
            </div>
        ` : reportData.map((protocol, index) => `
            <div class="protocol-card">
                <div class="protocol-header" onclick="toggleProtocol(${index})">
                    <div class="protocol-header-content">
                        <div>
                            <div class="protocol-title">📋 ${protocol.processNumber}</div>
                            <div class="protocol-meta">
                                <span class="status-badge status-${protocol.status.toLowerCase()}">${protocol.status}</span>
                                <span>👤 ${protocol.createdBy}</span>
                                <span>📅 ${new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                                <span>⚖️ ${protocol.assignedTo}</span>
                            </div>
                        </div>
                        <svg class="expand-icon" id="icon-${index}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </div>
                
                <div class="protocol-details" id="details-${index}">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Tribunal</div>
                            <div class="detail-value">${protocol.court}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Sistema</div>
                            <div class="detail-value">${protocol.system}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Jurisdição</div>
                            <div class="detail-value">${protocol.jurisdiction}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Tipo de Petição</div>
                            <div class="detail-value">${protocol.petitionType}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fatal</div>
                            <div class="detail-value">${protocol.isFatal ? '⚠️ Sim' : '✅ Não'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Procuração</div>
                            <div class="detail-value">${protocol.needsProcuration ? '📋 Necessária' : '✅ Não necessária'}</div>
                        </div>
                    </div>
                    
                    ${protocol.observations ? `
                        <div class="observations-section">
                            <div class="section-title">💬 Observações</div>
                            <p>${protocol.observations}</p>
                        </div>
                    ` : ''}
                    
                    ${protocol.returnReason ? `
                        <div class="return-reason-section">
                            <div class="section-title">🔄 Motivo da Devolução</div>
                            <p>${protocol.returnReason}</p>
                        </div>
                    ` : ''}
                    
                    <div class="documents-section">
                        <div class="documents-title">
                            📎 Documentos Anexados (${protocol.documents.length})
                        </div>
                        
                        ${protocol.documents.length === 0 ? `
                            <p style="color: #6b7280; text-align: center; padding: 20px;">Nenhum documento anexado</p>
                        ` : `
                            <div class="document-grid">
                                ${protocol.documents.filter(doc => doc.category === 'petition').length > 0 ? `
                                    <div class="document-category">
                                        <div class="category-title">📄 Petição (${protocol.documents.filter(doc => doc.category === 'petition').length})</div>
                                        ${protocol.documents.filter(doc => doc.category === 'petition').map(doc => `
                                            <div class="document-item">
                                                <div class="document-info">
                                                    <div class="document-name">${doc.name}</div>
                                                    <div class="document-size">${(doc.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <a href="${doc.content}" download="${doc.name}" class="download-link">⬇️ Baixar</a>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                
                                ${protocol.documents.filter(doc => doc.category === 'complementary').length > 0 ? `
                                    <div class="document-category">
                                        <div class="category-title">📎 Complementares (${protocol.documents.filter(doc => doc.category === 'complementary').length})</div>
                                        ${protocol.documents.filter(doc => doc.category === 'complementary').map(doc => `
                                            <div class="document-item">
                                                <div class="document-info">
                                                    <div class="document-name">${doc.name}</div>
                                                    <div class="document-size">${(doc.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                                <a href="${doc.content}" download="${doc.name}" class="download-link">⬇️ Baixar</a>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        function toggleProtocol(index) {
            const details = document.getElementById('details-' + index);
            const icon = document.getElementById('icon-' + index);
            
            if (details.classList.contains('expanded')) {
                details.classList.remove('expanded');
                icon.classList.remove('expanded');
            } else {
                details.classList.add('expanded');
                icon.classList.add('expanded');
            }
        }
        
        // Expandir todos os protocolos para impressão
        window.addEventListener('beforeprint', function() {
            const allDetails = document.querySelectorAll('.protocol-details');
            allDetails.forEach(detail => detail.classList.add('expanded'));
        });
    </script>
</body>
</html>`;

    // Criar e baixar o arquivo
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-protocolos-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReportModalOpen = () => {
    // Definir datas padrão (último mês)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    setReportDateRange({
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      includeAllStatuses: true,
      selectedStatuses: ['Aguardando', 'Peticionado', 'Erro', 'Devolvido']
    });
    setShowReportModal(true);
  };

  const handleGenerateCustomReport = () => {
    const { startDate, endDate, selectedStatuses } = reportDateRange;
    generateReport(startDate, endDate, selectedStatuses);
    setShowReportModal(false);
  };

  const handleStatusToggle = (status: string) => {
    setReportDateRange(prev => ({
      ...prev,
      selectedStatuses: prev.selectedStatuses.includes(status)
        ? prev.selectedStatuses.filter(s => s !== status)
        : [...prev.selectedStatuses, status]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Painel de Administração</h2>
        <button
          onClick={handleReportModalOpen}
          className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          title="Baixar relatório completo em HTML"
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </button>
      </div>

      {/* Mensagens de Sucesso/Erro */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-5 w-5 inline mr-2" />
            Gerenciar Funcionários
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'protocols'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-5 w-5 inline mr-2" />
            Relatório de Protocolos
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'employees' ? (
        <>
          {/* Gerenciamento de Funcionários */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Funcionários Cadastrados</h3>
            <button
              onClick={() => {
                setFormData({ email: '', senha: '', permissao: 'advogado' });
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando funcionários...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <li key={employee.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {employee.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionColor(employee.permissao)}`}>
                          {getPermissionLabel(employee.permissao)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(employee)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar funcionário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deletar funcionário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Relatório de Protocolos */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório Completo de Protocolos</h3>
            
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex items-center mb-4">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-lg font-medium text-gray-900">Filtros</h4>
                {(filter.status || filter.dateFrom || filter.dateTo || filter.cnjSearch || filter.createdBy) && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                    Criado por
                  </label>
                  <select
                    value={filter.createdBy}
                    onChange={(e) => setFilter(prev => ({ ...prev, createdBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os usuários</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id.toString()}>
                        {emp.email}
                      </option>
                    ))}
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
              {filteredProtocols.length !== protocols.length && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Mostrando {filteredProtocols.length} de {protocols.length} protocolos
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
                        Criado por
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
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {userEmails[protocol.createdBy] || 'Carregando...'}
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
                            <td colSpan={8} className="px-6 py-4">
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
                      : 'Tente ajustar os filtros ou aguardar novos protocolos'
                    }
                  </p>
                  {(filter.status || filter.dateFrom || filter.dateTo || filter.cnjSearch || filter.createdBy) && (
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

            {/* Resumo Estatístico */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Aguardando</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {protocols.filter(p => p.status === 'Aguardando').length}
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
                      {protocols.filter(p => p.status === 'Peticionado').length}
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
                      {protocols.filter(p => p.status === 'Erro').length}
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
                      {protocols.filter(p => p.status === 'Devolvido').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Adicionar Funcionário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adicionar Novo Funcionário
              </h3>
              
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissão
                  </label>
                  <select
                    name="permissao"
                    value={formData.permissao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Funcionário */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Funcionário
              </h3>
              
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha (deixe em branco para manter a atual)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nova senha (opcional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permissão
                  </label>
                  <select
                    name="permissao"
                    value={formData.permissao}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEmployee(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Protocolo */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes do Protocolo - Administração
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
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-medium text-gray-700">Criado por:</span>
                      <span className="ml-2 text-sm text-gray-900">{userEmails[selectedProtocol.createdBy] || 'Carregando...'}</span>
                    </div>
                    {selectedProtocol.assignedTo && (
                      <div className="mt-1 flex items-center">
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
                      Criado por: {userEmails[selectedProtocol.createdBy] || 'Carregando...'}
                    </p>
                    <p className="text-xs text-gray-600">
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

      {/* Modal de Configuração do Relatório */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Configurar Relatório
              </h3>
              
              <div className="space-y-4">
                {/* Seleção de Datas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período do Relatório
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
                      <input
                        type="date"
                        value={reportDateRange.startDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Data Final</label>
                      <input
                        type="date"
                        value={reportDateRange.endDate}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Seleção de Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status a Incluir
                  </label>
                  <div className="space-y-2">
                    {['Aguardando', 'Peticionado', 'Erro', 'Devolvido'].map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reportDateRange.selectedStatuses.includes(status)}
                          onChange={() => handleStatusToggle(status)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo do Relatório:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>Período:</strong> {reportDateRange.startDate || 'Início'} até {reportDateRange.endDate || 'Hoje'}</li>
                    <li>• <strong>Status:</strong> {reportDateRange.selectedStatuses.length > 0 ? reportDateRange.selectedStatuses.join(', ') : 'Nenhum selecionado'}</li>
                    <li>• <strong>Protocolos estimados:</strong> {
                      (() => {
                        let filtered = protocols;
                        if (reportDateRange.startDate) {
                          const start = new Date(reportDateRange.startDate);
                          start.setHours(0, 0, 0, 0);
                          filtered = filtered.filter(p => new Date(p.createdAt) >= start);
                        }
                        if (reportDateRange.endDate) {
                          const end = new Date(reportDateRange.endDate);
                          end.setHours(23, 59, 59, 999);
                          filtered = filtered.filter(p => new Date(p.createdAt) <= end);
                        }
                        if (reportDateRange.selectedStatuses.length > 0) {
                          filtered = filtered.filter(p => reportDateRange.selectedStatuses.includes(p.status));
                        }
                        return filtered.length;
                      })()
                    }</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateCustomReport}
                  disabled={reportDateRange.selectedStatuses.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instruções de Uso */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Instruções do Painel de Administração:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Aba Funcionários:</strong> Gerencie usuários do sistema (criar, editar, deletar)</li>
          <li>• <strong>Aba Protocolos:</strong> Visualize todos os protocolos do sistema com filtros avançados</li>
          <li>• <strong>Busca por CNJ:</strong> Digite o número do processo para encontrar rapidamente</li>
          <li>• <strong>Seta de expansão:</strong> Clique na seta (▶) para ver todos os detalhes do protocolo</li>
          <li>• <strong>Filtros:</strong> Use os filtros para refinar sua busca por status, usuário, data, etc.</li>
          <li>• <strong>Ver Detalhes:</strong> Clique no botão para abrir o modal completo com histórico</li>
        </ul>
      </div>
    </div>
  );
}