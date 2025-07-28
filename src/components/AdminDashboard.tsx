import React, { useState, useEffect } from 'react';
import { Users, FileText, BarChart3, Download, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, User, Settings, UserPlus, Edit, Trash2, Eye, EyeOff, XCircle, Activity } from 'lucide-react';
import { useProtocols } from '../hooks/useProtocols';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
}

export function AdminDashboard() {
  const { protocols, userEmails } = useProtocols();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'employees' | 'canceled'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    senha: '',
    permissao: 'advogado' as 'admin' | 'mod' | 'advogado'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar se o usuário tem permissão para acessar o painel admin
  if (!hasPermission('canAccessAllQueues')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600">Você não tem permissão para acessar o painel administrativo.</p>
      </div>
    );
  }

  // Carregar funcionários
  useEffect(() => {
    if (activeTab === 'employees') {
      loadEmployees();
    }
  }, [activeTab]);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.funcionarios);
      } else {
        setError('Erro ao carregar funcionários');
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estatísticas avançadas
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const stats = {
    // Estatísticas gerais
    total: protocols.length,
    aguardando: protocols.filter(p => p.status === 'Aguardando').length,
    emExecucao: protocols.filter(p => p.status === 'Em Execução').length,
    peticionados: protocols.filter(p => p.status === 'Peticionado').length,
    devolvidos: protocols.filter(p => p.status === 'Devolvido').length,
    cancelados: protocols.filter(p => p.status === 'Cancelado').length,
    
    // Estatísticas por tipo
    civeis: protocols.filter(p => p.processType === 'civel').length,
    trabalhistas: protocols.filter(p => p.processType === 'trabalhista').length,
    
    // Fatais do dia
    fataisHoje: protocols.filter(p => 
      p.isFatal && 
      new Date(p.createdAt) >= todayStart
    ).length,
    
    // Protocolos processados por fila (histórico completo)
    processadosRobo: protocols.filter(p => 
      !p.assignedTo && p.status === 'Peticionado'
    ).length,
    processadosCarlos: protocols.filter(p => 
      p.assignedTo === 'Carlos' && p.status === 'Peticionado'
    ).length,
    processadosDeyse: protocols.filter(p => 
      p.assignedTo === 'Deyse' && p.status === 'Peticionado'
    ).length,
    
    // Filas atuais (aguardando)
    filaRobo: protocols.filter(p => p.status === 'Aguardando' && !p.assignedTo).length,
    filaCarlos: protocols.filter(p => p.status === 'Aguardando' && p.assignedTo === 'Carlos').length,
    filaDeyse: protocols.filter(p => p.status === 'Aguardando' && p.assignedTo === 'Deyse').length,
    
    // Estatísticas do dia
    criadosHoje: protocols.filter(p => 
      new Date(p.createdAt) >= todayStart
    ).length,
    peticionadosHoje: protocols.filter(p => 
      p.status === 'Peticionado' && 
      new Date(p.updatedAt) >= todayStart
    ).length,
  };

  // Protocolos cancelados
  const canceledProtocols = protocols.filter(p => p.status === 'Cancelado');

  // Gerar relatório HTML detalhado
  const generateDetailedReport = () => {
    const now = new Date();
    const reportDate = now.toLocaleDateString('pt-BR');
    const reportTime = now.toLocaleTimeString('pt-BR');

    // Estatísticas por sistema
    const systemStats = protocols.reduce((acc, protocol) => {
      const system = protocol.system || 'Não especificado';
      if (!acc[system]) {
        acc[system] = { total: 0, civel: 0, trabalhista: 0, peticionados: 0 };
      }
      acc[system].total++;
      if (protocol.processType === 'civel') acc[system].civel++;
      if (protocol.processType === 'trabalhista') acc[system].trabalhista++;
      if (protocol.status === 'Peticionado') acc[system].peticionados++;
      return acc;
    }, {} as Record<string, { total: number; civel: number; trabalhista: number; peticionados: number }>);

    // Estatísticas por status
    const statusStats = protocols.reduce((acc, protocol) => {
      const status = protocol.status;
      if (!acc[status]) {
        acc[status] = { total: 0, civel: 0, trabalhista: 0 };
      }
      acc[status].total++;
      if (protocol.processType === 'civel') acc[status].civel++;
      if (protocol.processType === 'trabalhista') acc[status].trabalhista++;
      return acc;
    }, {} as Record<string, { total: number; civel: number; trabalhista: number }>);

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Detalhado - Protocolos Jurídicos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .report-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .info-item {
            text-align: center;
        }
        
        .info-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .info-label {
            color: #64748b;
            margin-top: 5px;
        }
        
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-header {
            background: #f1f5f9;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .section-header h2 {
            color: #1e293b;
            font-size: 1.5em;
        }
        
        .section-content {
            padding: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
        }
        
        .protocol-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .protocol-header {
            background: #f8fafc;
            padding: 15px;
            cursor: pointer;
            display: flex;
            justify-content: between;
            align-items: center;
            transition: background 0.2s;
        }
        
        .protocol-header:hover {
            background: #f1f5f9;
        }
        
        .protocol-title {
            font-weight: 600;
            color: #1e293b;
            flex: 1;
        }
        
        .protocol-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 500;
            margin-left: 10px;
        }
        
        .status-peticionado { background: #dcfce7; color: #166534; }
        .status-aguardando { background: #fef3c7; color: #92400e; }
        .status-execucao { background: #dbeafe; color: #1e40af; }
        .status-devolvido { background: #fed7aa; color: #c2410c; }
        .status-cancelado { background: #fecaca; color: #dc2626; }
        
        .protocol-details {
            display: none;
            padding: 20px;
            background: white;
            border-top: 1px solid #e2e8f0;
        }
        
        .protocol-details.show {
            display: block;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .detail-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #475569;
            margin-bottom: 5px;
        }
        
        .detail-value {
            color: #1e293b;
        }
        
        .documents-section {
            margin-top: 20px;
            padding: 15px;
            background: #f0f9ff;
            border-radius: 6px;
        }
        
        .document-item {
            display: flex;
            justify-content: between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e0f2fe;
        }
        
        .document-item:last-child {
            border-bottom: none;
        }
        
        .download-btn {
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            text-decoration: none;
            display: inline-block;
        }
        
        .download-btn:hover {
            background: #2563eb;
        }
        
        .toggle-arrow {
            transition: transform 0.2s;
            margin-left: 10px;
        }
        
        .toggle-arrow.rotated {
            transform: rotate(90deg);
        }
        
        .type-civel { color: #059669; font-weight: 600; }
        .type-trabalhista { color: #dc2626; font-weight: 600; }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            color: #64748b;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        @media print {
            .protocol-details { display: block !important; }
            .toggle-arrow { display: none; }
            .protocol-header { cursor: default; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Relatório Detalhado</h1>
            <p>Sistema de Protocolos Jurídicos</p>
            <p style="margin-top: 10px; opacity: 0.9;">${reportDate} às ${reportTime}</p>
        </div>

        <div class="report-info">
            <div class="info-item">
                <div class="info-number">${stats.total}</div>
                <div class="info-label">Total de Protocolos</div>
            </div>
            <div class="info-item">
                <div class="info-number type-civel">${stats.civeis}</div>
                <div class="info-label">Processos Cíveis</div>
            </div>
            <div class="info-item">
                <div class="info-number type-trabalhista">${stats.trabalhistas}</div>
                <div class="info-label">Processos Trabalhistas</div>
            </div>
            <div class="info-item">
                <div class="info-number">${stats.peticionados}</div>
                <div class="info-label">Peticionados</div>
            </div>
            <div class="info-item">
                <div class="info-number">${stats.fataisHoje}</div>
                <div class="info-label">Fatais Hoje</div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📊 Estatísticas por Status</h2>
            </div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Cível</th>
                            <th>Trabalhista</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(statusStats).map(([status, data]) => `
                        <tr>
                            <td><span class="protocol-status status-${status.toLowerCase().replace(' ', '')}">${status}</span></td>
                            <td>${data.total}</td>
                            <td class="type-civel">${data.civel}</td>
                            <td class="type-trabalhista">${data.trabalhista}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>⚙️ Estatísticas por Sistema</h2>
            </div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Sistema</th>
                            <th>Total</th>
                            <th>Cível</th>
                            <th>Trabalhista</th>
                            <th>Peticionados</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(systemStats).map(([system, data]) => `
                        <tr>
                            <td>${system}</td>
                            <td>${data.total}</td>
                            <td class="type-civel">${data.civel}</td>
                            <td class="type-trabalhista">${data.trabalhista}</td>
                            <td>${data.peticionados}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>🏭 Produtividade das Filas</h2>
            </div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Fila</th>
                            <th>Protocolos Processados</th>
                            <th>Aguardando Atualmente</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>🤖 Fila do Robô</td>
                            <td>${stats.processadosRobo}</td>
                            <td>${stats.filaRobo}</td>
                        </tr>
                        <tr>
                            <td>👨‍💼 Fila do Carlos</td>
                            <td>${stats.processadosCarlos}</td>
                            <td>${stats.filaCarlos}</td>
                        </tr>
                        <tr>
                            <td>👩‍💼 Fila da Deyse</td>
                            <td>${stats.processadosDeyse}</td>
                            <td>${stats.filaDeyse}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📋 Detalhes Completos dos Protocolos</h2>
                <p style="margin-top: 10px; color: #64748b; font-size: 0.9em;">Clique em cada protocolo para ver detalhes completos e baixar documentos</p>
            </div>
            <div class="section-content">
                ${protocols.map((protocol, index) => `
                <div class="protocol-item">
                    <div class="protocol-header" onclick="toggleProtocol(${index})">
                        <div class="protocol-title">
                            <strong>${protocol.processNumber || 'Sem número'}</strong>
                            <span style="margin-left: 15px; color: #64748b;">${protocol.petitionType || 'Tipo não especificado'}</span>
                            <span class="type-${protocol.processType}" style="margin-left: 10px;">
                                ${protocol.processType === 'civel' ? '⚖️ Cível' : '👷 Trabalhista'}
                            </span>
                            ${protocol.isFatal ? '<span style="color: #dc2626; margin-left: 10px;">⚠️ FATAL</span>' : ''}
                        </div>
                        <span class="protocol-status status-${protocol.status.toLowerCase().replace(' ', '')}">${protocol.status}</span>
                        <span class="toggle-arrow" id="arrow-${index}">▶</span>
                    </div>
                    <div class="protocol-details" id="details-${index}">
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Número do Processo</div>
                                <div class="detail-value">${protocol.processNumber || 'Não especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Tribunal</div>
                                <div class="detail-value">${protocol.court || 'Não especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Sistema</div>
                                <div class="detail-value">${protocol.system || 'Não especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Jurisdição</div>
                                <div class="detail-value">${protocol.jurisdiction || 'Não especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Tipo de Processo</div>
                                <div class="detail-value">${protocol.processType === 'civel' ? 'Cível' : 'Trabalhista'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Tipo de Petição</div>
                                <div class="detail-value">${protocol.petitionType || 'Não especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Fatal</div>
                                <div class="detail-value">${protocol.isFatal ? '⚠️ Sim' : 'Não'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Procuração</div>
                                <div class="detail-value">${protocol.needsProcuration ? '✅ Necessária' : 'Não necessária'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Criado por</div>
                                <div class="detail-value">${userEmails[protocol.createdBy] || 'Usuário não identificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Data de Criação</div>
                                <div class="detail-value">${new Date(protocol.createdAt).toLocaleDateString('pt-BR')} às ${new Date(protocol.createdAt).toLocaleTimeString('pt-BR')}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Última Atualização</div>
                                <div class="detail-value">${new Date(protocol.updatedAt).toLocaleDateString('pt-BR')} às ${new Date(protocol.updatedAt).toLocaleTimeString('pt-BR')}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Fila Atual</div>
                                <div class="detail-value">${
                                  protocol.assignedTo === 'Carlos' ? '👨‍💼 Carlos' :
                                  protocol.assignedTo === 'Deyse' ? '👩‍💼 Deyse' :
                                  '🤖 Robô'
                                }</div>
                            </div>
                        </div>
                        
                        ${protocol.observations ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <div class="detail-label">Observações</div>
                            <div class="detail-value">${protocol.observations}</div>
                        </div>
                        ` : ''}
                        
                        ${protocol.returnReason ? `
                        <div class="detail-item" style="grid-column: 1 / -1; background: #fef2f2; border: 1px solid #fecaca;">
                            <div class="detail-label" style="color: #dc2626;">Motivo da Devolução</div>
                            <div class="detail-value" style="color: #dc2626;">${protocol.returnReason}</div>
                        </div>
                        ` : ''}
                        
                        ${protocol.procurationType ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <div class="detail-label">Tipo de Procuração</div>
                            <div class="detail-value">${protocol.procurationType}</div>
                        </div>
                        ` : ''}
                        
                        <div class="documents-section">
                            <h4 style="margin-bottom: 15px; color: #1e293b;">📎 Documentos (${protocol.documents.length})</h4>
                            ${protocol.documents.map(doc => `
                            <div class="document-item">
                                <div>
                                    <strong>${doc.name}</strong>
                                    <span style="color: #64748b; margin-left: 10px;">
                                        ${doc.category === 'petition' ? '📄 Petição' : '📎 Complementar'} • 
                                        ${(doc.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                                <a href="${doc.content}" download="${doc.name}" class="download-btn">
                                    ⬇️ Download
                                </a>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p><strong>Relatório gerado automaticamente</strong></p>
            <p>Sistema de Protocolos Jurídicos © 2024</p>
            <p style="margin-top: 10px; font-size: 0.9em;">
                Total de ${stats.total} protocolos • ${stats.civeis} cíveis • ${stats.trabalhistas} trabalhistas
            </p>
        </div>
    </div>

    <script>
        function toggleProtocol(index) {
            const details = document.getElementById('details-' + index);
            const arrow = document.getElementById('arrow-' + index);
            
            if (details.classList.contains('show')) {
                details.classList.remove('show');
                arrow.classList.remove('rotated');
                arrow.textContent = '▶';
            } else {
                details.classList.add('show');
                arrow.classList.add('rotated');
                arrow.textContent = '▼';
            }
        }
        
        // Função para expandir todos
        function expandAll() {
            const allDetails = document.querySelectorAll('.protocol-details');
            const allArrows = document.querySelectorAll('.toggle-arrow');
            
            allDetails.forEach(detail => detail.classList.add('show'));
            allArrows.forEach(arrow => {
                arrow.classList.add('rotated');
                arrow.textContent = '▼';
            });
        }
        
        // Função para colapsar todos
        function collapseAll() {
            const allDetails = document.querySelectorAll('.protocol-details');
            const allArrows = document.querySelectorAll('.toggle-arrow');
            
            allDetails.forEach(detail => detail.classList.remove('show'));
            allArrows.forEach(arrow => {
                arrow.classList.remove('rotated');
                arrow.textContent = '▶';
            });
        }
        
        // Adicionar botões de controle
        document.addEventListener('DOMContentLoaded', function() {
            const sectionHeader = document.querySelector('.section:last-of-type .section-header');
            const controls = document.createElement('div');
            controls.style.marginTop = '10px';
            controls.innerHTML = \`
                <button onclick="expandAll()" style="margin-right: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Expandir Todos
                </button>
                <button onclick="collapseAll()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Colapsar Todos
                </button>
            \`;
            sectionHeader.appendChild(controls);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-detalhado-${reportDate.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Funções para gerenciar funcionários
  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.senha) {
      setError('Email e senha são obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário criado com sucesso!');
        setNewEmployee({ email: '', senha: '', permissao: 'advogado' });
        setShowAddModal(false);
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao criar funcionário');
      }
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee || !selectedEmployee.email) {
      setError('Email é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedEmployee.email,
          permissao: selectedEmployee.permissao,
          ...(newEmployee.senha && { senha: newEmployee.senha })
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário atualizado com sucesso!');
        setShowEditModal(false);
        setSelectedEmployee(null);
        setNewEmployee({ email: '', senha: '', permissao: 'advogado' });
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao atualizar funcionário');
      }
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Funcionário excluído com sucesso!');
        loadEmployees();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Erro ao excluir funcionário');
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
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

  const getPermissionColor = (permissao: string) => {
    switch (permissao) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'mod': return 'bg-purple-100 text-purple-800';
      case 'advogado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Painel Administrativo</h2>
        <p className="text-gray-600 mt-2">Gerencie protocolos, funcionários e visualize relatórios detalhados</p>
      </div>

      {/* Notificações */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 ml-2">×</button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800 ml-2">×</button>
        </div>
      )}

      {/* Navegação */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'reports', label: 'Relatórios', icon: FileText },
            { id: 'canceled', label: 'Cancelados', icon: XCircle },
            { id: 'employees', label: 'Funcionários', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
                {tab.id === 'canceled' && stats.cancelados > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {stats.cancelados}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  <p className="text-gray-600">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.peticionados}</p>
                  <p className="text-gray-600">Peticionados</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.aguardando}</p>
                  <p className="text-gray-600">Aguardando</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.devolvidos}</p>
                  <p className="text-gray-600">Devolvidos</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{stats.fataisHoje}</p>
                  <p className="text-gray-600">Fatais Hoje</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <Calendar className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold">{stats.criadosHoje}</p>
                  <p className="text-blue-100">Criados Hoje</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold">{stats.peticionadosHoje}</p>
                  <p className="text-green-100">Peticionados Hoje</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold">{stats.fataisHoje}</p>
                  <p className="text-red-100">Fatais Hoje</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas por Tipo e Produtividade das Filas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Processo</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-medium flex items-center">
                    <span className="mr-2">⚖️</span>
                    Cível
                  </span>
                  <span className="text-2xl font-bold text-green-600">{stats.civeis}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-medium flex items-center">
                    <span className="mr-2">👷</span>
                    Trabalhista
                  </span>
                  <span className="text-2xl font-bold text-red-600">{stats.trabalhistas}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtividade das Filas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-medium flex items-center">
                    <span className="mr-2">🤖</span>
                    Robô (Processados)
                  </span>
                  <span className="text-2xl font-bold text-red-600">{stats.processadosRobo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-medium flex items-center">
                    <span className="mr-2">👨‍💼</span>
                    Carlos (Processados)
                  </span>
                  <span className="text-2xl font-bold text-blue-600">{stats.processadosCarlos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-medium flex items-center">
                    <span className="mr-2">👩‍💼</span>
                    Deyse (Processados)
                  </span>
                  <span className="text-2xl font-bold text-purple-600">{stats.processadosDeyse}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filas Atuais */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filas Atuais (Aguardando)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl mb-2">🤖</div>
                <p className="text-2xl font-bold text-red-600">{stats.filaRobo}</p>
                <p className="text-red-700">Fila do Robô</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">👨‍💼</div>
                <p className="text-2xl font-bold text-blue-600">{stats.filaCarlos}</p>
                <p className="text-blue-700">Fila do Carlos</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">👩‍💼</div>
                <p className="text-2xl font-bold text-purple-600">{stats.filaDeyse}</p>
                <p className="text-purple-700">Fila da Deyse</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerar Relatórios Detalhados</h3>
            <p className="text-gray-600 mb-6">
              Gere relatórios completos com todas as informações dos protocolos, incluindo documentos para download.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={generateDetailedReport}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="h-5 w-5 mr-2" />
                Gerar Relatório Completo
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">O relatório inclui:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Estatísticas completas por status, tipo e sistema</li>
                <li>• Produtividade detalhada de cada fila</li>
                <li>• Informações completas de cada protocolo</li>
                <li>• Documentos para download direto</li>
                <li>• Interface interativa com expansão/colapso</li>
                <li>• Contagem de protocolos fatais do dia</li>
              </ul>
            </div>
          </div>

          {/* Prévia das Estatísticas */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prévia do Relatório</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-gray-600">Total de Protocolos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.civeis}</p>
                <p className="text-gray-600">Processos Cíveis</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.trabalhistas}</p>
                <p className="text-gray-600">Processos Trabalhistas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.fataisHoje}</p>
                <p className="text-gray-600">Fatais Hoje</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canceled' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Protocolos Cancelados</h3>
              <p className="text-gray-600">Visualize todos os protocolos que foram cancelados</p>
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <span className="font-semibold">{stats.cancelados}</span> cancelados
            </div>
          </div>

          {canceledProtocols.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum protocolo cancelado</h3>
              <p className="text-gray-600">Todos os protocolos estão sendo processados normalmente!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tribunal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Cancelamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fatal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {canceledProtocols.map((protocol) => (
                    <tr key={protocol.id} className="hover:bg-red-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="flex items-center">
                              {protocol.isDistribution && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                                  📋 DIST
                                </span>
                              )}
                              {protocol.processType && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                  protocol.processType === 'civel' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {protocol.processType === 'civel' ? '⚖️' : '👷'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900 mt-1">
                              {protocol.processNumber || (protocol.isDistribution ? 'Distribuição sem número' : protocol.processNumber)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {protocol.petitionType || (protocol.isDistribution ? 'Tipo não especificado' : protocol.petitionType)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          protocol.processType === 'civel' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {protocol.processType === 'civel' ? 'Cível' : 'Trabalhista'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {protocol.court || (protocol.isDistribution ? 'Tribunal não especificado' : protocol.court)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {protocol.jurisdiction || (protocol.isDistribution ? 'Jurisdição não especificada' : protocol.jurisdiction)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userEmails[protocol.createdBy] || 'Carregando...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(protocol.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {protocol.isFatal ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Fatal
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Header da seção */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Gerenciar Funcionários</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Adicionar Funcionário
            </button>
          </div>

          {/* Lista de funcionários */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando funcionários...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{employee.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionColor(employee.permissao)}`}>
                          {getPermissionLabel(employee.permissao)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal Adicionar Funcionário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Funcionário</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="funcionario@escritorio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newEmployee.senha}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite a senha"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                  <select
                    value={newEmployee.permissao}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, permissao: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({ email: '', senha: '', permissao: 'advogado' });
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddEmployee}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Criando...' : 'Criar Funcionário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Funcionário */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Funcionário</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedEmployee.email}
                    onChange={(e) => setSelectedEmployee(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newEmployee.senha}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Deixe vazio para manter a atual"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                  <select
                    value={selectedEmployee.permissao}
                    onChange={(e) => setSelectedEmployee(prev => prev ? ({ ...prev, permissao: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="advogado">Advogado</option>
                    <option value="mod">Moderador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    setNewEmployee({ email: '', senha: '', permissao: 'advogado' });
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditEmployee}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}