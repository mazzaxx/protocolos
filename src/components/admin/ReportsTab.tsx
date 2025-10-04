import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, Search, Calendar, Eye, X, History, Clock, User, ArrowRight, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { useProtocols } from '../../hooks/useProtocols';
import { Protocol, STATUS_COLORS } from '../../types';

interface Employee {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
  equipe?: string;
  created_at: string;
  updated_at: string;
}

interface Team {
  nome: string;
  membros: number;
}

type DateFilter = 'today' | 'last3days' | 'last7days' | 'last30days' | 'all';

export function ReportsTab() {
  const { protocols } = useProtocols();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolNumberSearch, setProtocolNumberSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const protocolsPerPage = 10;
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
  
  // Estados para modal de protocolo
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadEmployees();
    loadTeams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [protocols, searchTerm, protocolNumberSearch, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, protocolNumberSearch, dateFilter]);

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/funcionarios`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.funcionarios);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/equipes`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.equipes);
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const getDateFilterRange = (filter: DateFilter): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today;
      case 'last3days':
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(now.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);
        return threeDaysAgo;
      case 'last7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return sevenDaysAgo;
      case 'last30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return thirtyDaysAgo;
      default:
        return null;
    }
  };

  const applyFilters = () => {
    let filtered = [...protocols];

    // Filtro de data
    const dateRange = getDateFilterRange(dateFilter);
    if (dateRange) {
      filtered = filtered.filter(p => new Date(p.createdAt) >= dateRange);
    }

    // Filtro de pesquisa geral
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.processNumber.toLowerCase().includes(search) ||
        p.court.toLowerCase().includes(search) ||
        p.system.toLowerCase().includes(search) ||
        p.petitionType.toLowerCase().includes(search) ||
        p.status.toLowerCase().includes(search) ||
        (p.observations && p.observations.toLowerCase().includes(search))
      );
    }

    // Filtro específico de número de protocolo
    if (protocolNumberSearch.trim()) {
      const search = protocolNumberSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.processNumber.toLowerCase().includes(search)
      );
    }

    setFilteredProtocols(filtered);
  };

  const generateStatsOnlyReport = () => {
    const civelProtocols = protocols.filter(p => p.processType === 'civel');
    const trabalhistaProtocols = protocols.filter(p => p.processType === 'trabalhista');

    const civelFatais = civelProtocols.filter(p => p.isFatal).length;
    const trabalhistaFatais = trabalhistaProtocols.filter(p => p.isFatal).length;

    const civelPercentual = civelProtocols.length > 0 ? ((civelFatais / civelProtocols.length) * 100) : 0;
    const trabalhistaPercentual = trabalhistaProtocols.length > 0 ? ((trabalhistaFatais / trabalhistaProtocols.length) * 100) : 0;

    const teamStats = teams.map(team => {
      const teamProtocols = protocols.filter(p => {
        const creator = employees.find(e => e.id === p.createdBy);
        return creator?.equipe === team.nome;
      });

      const totalProtocols = teamProtocols.length;
      const fatalProtocols = teamProtocols.filter(p => p.isFatal).length;
      const percentualFatal = totalProtocols > 0 ? ((fatalProtocols / totalProtocols) * 100) : 0;

      return {
        nome: team.nome,
        total: totalProtocols,
        fatais: fatalProtocols,
        percentualFatal: percentualFatal
      };
    });

    const totalProtocols = protocols.length;
    const totalFatais = protocols.filter(p => p.isFatal).length;
    const totalPercentual = totalProtocols > 0 ? ((totalFatais / totalProtocols) * 100) : 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Estatístico - ${new Date().toLocaleDateString('pt-BR')}</title>
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
            background: #f8f9fa;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 8px;
            font-weight: 700;
        }

        .header p {
            font-size: 1rem;
            opacity: 0.95;
        }

        .content {
            padding: 40px 30px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section:last-of-type {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #3b82f6;
            display: flex;
            align-items: center;
        }

        .section-title::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 24px;
            background: #3b82f6;
            margin-right: 12px;
            border-radius: 3px;
        }

        .table-container {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        th {
            background: #f8fafc;
            color: #1f2937;
            font-weight: 700;
            padding: 16px 20px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 14px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.95rem;
        }

        tr:hover {
            background: #f8fafc;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .total-row {
            background: #eff6ff !important;
            font-weight: 700;
        }

        .total-row:hover {
            background: #dbeafe !important;
        }

        .footer {
            background: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9rem;
        }

        .footer p {
            margin: 4px 0;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                max-width: 100%;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 20px;
            }
            th, td {
                padding: 12px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório Estatístico</h1>
            <p>Análise de Prazos Fatais - Somente Números</p>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="content">
            <!-- Análise por Pasta -->
            <div class="section">
                <h2 class="section-title">Pasta</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Pasta</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Cível</strong></td>
                                <td>${civelProtocols.length}</td>
                                <td>${civelFatais}</td>
                                <td>${civelPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><strong>Trabalhista</strong></td>
                                <td>${trabalhistaProtocols.length}</td>
                                <td>${trabalhistaFatais}</td>
                                <td>${trabalhistaPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>Total Geral</strong></td>
                                <td>${totalProtocols}</td>
                                <td>${totalFatais}</td>
                                <td>${totalPercentual.toFixed(0)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Análise por Equipe -->
            <div class="section">
                <h2 class="section-title">Equipes</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Equipe</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamStats.map(team => `
                                <tr>
                                    <td><strong>${team.nome}</strong></td>
                                    <td>${team.total}</td>
                                    <td>${team.fatais}</td>
                                    <td>${team.percentualFatal.toFixed(0)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Relatório Estatístico de Protocolos Fatais</strong></p>
            <p>Total de ${totalProtocols} protocolos analisados</p>
            <p>${teams.length} equipes registradas</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-estatistico-${getDateFilterLabel(dateFilter).toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = () => {
    // Calcular estatísticas por tipo de processo (Pasta)
    const civelProtocols = protocols.filter(p => p.processType === 'civel');
    const trabalhistaProtocols = protocols.filter(p => p.processType === 'trabalhista');

    const civelFatais = civelProtocols.filter(p => p.isFatal).length;
    const trabalhistaFatais = trabalhistaProtocols.filter(p => p.isFatal).length;

    const civelPercentual = civelProtocols.length > 0 ? ((civelFatais / civelProtocols.length) * 100) : 0;
    const trabalhistaPercentual = trabalhistaProtocols.length > 0 ? ((trabalhistaFatais / trabalhistaProtocols.length) * 100) : 0;

    // Calcular estatísticas por equipe
    const teamStats = teams.map(team => {
      const teamProtocols = protocols.filter(p => {
        const creator = employees.find(e => e.id === p.createdBy);
        return creator?.equipe === team.nome;
      });

      const totalProtocols = teamProtocols.length;
      const fatalProtocols = teamProtocols.filter(p => p.isFatal).length;
      const percentualFatal = totalProtocols > 0 ? ((fatalProtocols / totalProtocols) * 100) : 0;

      return {
        nome: team.nome,
        total: totalProtocols,
        fatais: fatalProtocols,
        percentualFatal: percentualFatal
      };
    });

    // Total geral
    const totalProtocols = protocols.length;
    const totalFatais = protocols.filter(p => p.isFatal).length;
    const totalPercentual = totalProtocols > 0 ? ((totalFatais / totalProtocols) * 100) : 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Protocolos Fatais - ${new Date().toLocaleDateString('pt-BR')}</title>
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
            background: #f8f9fa;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 8px;
            font-weight: 700;
        }

        .header p {
            font-size: 1rem;
            opacity: 0.95;
        }

        .content {
            padding: 40px 30px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section:last-of-type {
            margin-bottom: 0;
        }

        .section-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #2563eb;
            display: flex;
            align-items: center;
        }

        .section-title::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 24px;
            background: #2563eb;
            margin-right: 12px;
            border-radius: 3px;
        }

        .table-container {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        th {
            background: #f8fafc;
            color: #1f2937;
            font-weight: 700;
            padding: 16px 20px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 14px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.95rem;
        }

        tr:hover {
            background: #f8fafc;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .total-row {
            background: #eff6ff !important;
            font-weight: 700;
        }

        .total-row:hover {
            background: #dbeafe !important;
        }

        .footer {
            background: #f8f9fa;
            padding: 24px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            font-size: 0.9rem;
        }

        .footer p {
            margin: 4px 0;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                max-width: 100%;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .header {
                padding: 30px 20px;
            }
            .content {
                padding: 30px 20px;
            }
            th, td {
                padding: 12px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Protocolos Fatais</h1>
            <p>Análise de Prazos Fatais por Pasta e Equipe</p>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="content">
            <!-- Análise por Pasta -->
            <div class="section">
                <h2 class="section-title">Pasta</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Pasta</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Cível</strong></td>
                                <td>${civelProtocols.length}</td>
                                <td>${civelFatais}</td>
                                <td>${civelPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><strong>Trabalhista</strong></td>
                                <td>${trabalhistaProtocols.length}</td>
                                <td>${trabalhistaFatais}</td>
                                <td>${trabalhistaPercentual.toFixed(0)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>Total Geral</strong></td>
                                <td>${totalProtocols}</td>
                                <td>${totalFatais}</td>
                                <td>${totalPercentual.toFixed(0)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Análise por Equipe -->
            <div class="section">
                <h2 class="section-title">Equipes</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Equipe</th>
                                <th>Total</th>
                                <th>Fatais</th>
                                <th>% Fatal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamStats.map(team => `
                                <tr>
                                    <td><strong>${team.nome}</strong></td>
                                    <td>${team.total}</td>
                                    <td>${team.fatais}</td>
                                    <td>${team.percentualFatal.toFixed(0)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Preview dos Protocolos -->
            <div class="section">
                <h2 class="section-title">Protocolos do Período</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%;">Status</th>
                                <th style="width: 18%;">Processo</th>
                                <th style="width: 18%;">Tribunal</th>
                                <th style="width: 10%;">Sistema</th>
                                <th style="width: 14%;">Petição</th>
                                <th style="width: 10%;">Fila</th>
                                <th style="width: 10%;">Data</th>
                                <th style="width: 6%;">Docs</th>
                                <th style="width: 6%;">Log</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredProtocols.length === 0 ? `
                                <tr>
                                    <td colspan="9" style="text-align: center; padding: 20px; color: #6b7280;">
                                        Nenhum protocolo encontrado no período selecionado
                                    </td>
                                </tr>
                            ` : filteredProtocols.map(protocol => {
                                let statusColor = '#f59e0b';
                                let statusBg = '#fef3c7';
                                let statusText = protocol.status;

                                switch(protocol.status) {
                                    case 'Aguardando':
                                        statusColor = '#f59e0b';
                                        statusBg = '#fef3c7';
                                        break;
                                    case 'Em Execução':
                                        statusColor = '#3b82f6';
                                        statusBg = '#dbeafe';
                                        break;
                                    case 'Peticionado':
                                        statusColor = '#10b981';
                                        statusBg = '#d1fae5';
                                        break;
                                    case 'Devolvido':
                                        statusColor = '#f97316';
                                        statusBg = '#fed7aa';
                                        break;
                                    case 'Cancelado':
                                        statusColor = '#ef4444';
                                        statusBg = '#fee2e2';
                                        break;
                                }

                                let queueName = 'Fila do Robô';
                                if (protocol.assignedTo === 'Manual') queueName = 'Fila Manual';
                                else if (protocol.assignedTo === 'Deyse') queueName = 'Fila da Deyse';
                                else if (protocol.assignedTo === 'Enzo') queueName = 'Fila do Enzo';
                                else if (protocol.assignedTo === 'Iago') queueName = 'Fila do Iago';

                                const docCount = protocol.documents ? protocol.documents.length : 0;
                                const logCount = protocol.activityLog ? protocol.activityLog.length : 0;

                                return `
                                <tr style="border-bottom: 1px solid #e5e7eb;">
                                    <td style="padding: 10px 8px;">
                                        <span style="display: inline-block; padding: 4px 8px; background: ${statusBg}; color: ${statusColor}; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">${statusText}</span>
                                    </td>
                                    <td style="padding: 10px 8px; font-size: 0.85rem;">
                                        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                            ${protocol.isDistribution ? '<span style="display: inline-block; padding: 2px 6px; background: #fed7aa; color: #92400e; border-radius: 4px; font-size: 0.65rem; font-weight: 600;">📋 DIST</span>' : ''}
                                            ${protocol.processType === 'civel'
                                                ? '<span style="display: inline-block; padding: 2px 6px; background: #d1fae5; color: #065f46; border-radius: 4px; font-size: 0.65rem;">⚖️</span>'
                                                : '<span style="display: inline-block; padding: 2px 6px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 0.65rem;">👷</span>'}
                                            <strong>${protocol.processNumber || 'Sem número'}</strong>
                                        </div>
                                        ${protocol.isFatal ? '<div style="margin-top: 4px;"><span style="color: #ef4444; font-size: 0.7rem; font-weight: 700;">🚨 FATAL</span></div>' : ''}
                                        ${protocol.needsProcuration ? '<div style="margin-top: 4px;"><span style="color: #3b82f6; font-size: 0.7rem; font-weight: 700;">📄 Procuração</span></div>' : ''}
                                    </td>
                                    <td style="padding: 10px 8px; font-size: 0.75rem;">
                                        <div style="font-weight: 500; color: #1f2937;">${protocol.court.substring(0, 30)}${protocol.court.length > 30 ? '...' : ''}</div>
                                        <div style="color: #6b7280; font-size: 0.7rem; margin-top: 2px;">${protocol.jurisdiction || 'N/A'}</div>
                                    </td>
                                    <td style="padding: 10px 8px;">
                                        <span style="display: inline-block; padding: 3px 8px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 0.7rem;">${protocol.system || '-'}</span>
                                    </td>
                                    <td style="padding: 10px 8px; font-size: 0.75rem; color: #374151;">
                                        ${protocol.petitionType ? protocol.petitionType.substring(0, 25) + (protocol.petitionType.length > 25 ? '...' : '') : '-'}
                                    </td>
                                    <td style="padding: 10px 8px; font-size: 0.75rem; color: #374151;">
                                        ${queueName}
                                    </td>
                                    <td style="padding: 10px 8px; font-size: 0.75rem; color: #374151;">
                                        ${new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <span style="display: inline-block; padding: 3px 8px; background: #f3f4f6; color: #374151; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">📎 ${docCount}</span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <button onclick="alert('========== DETALHES DO PROTOCOLO ==========\\n\\n📋 INFORMAÇÕES GERAIS\\nNúmero do Processo: ${protocol.processNumber || 'N/A'}\\nTribunal: ${protocol.court || 'N/A'}\\nSistema: ${protocol.system || 'N/A'}\\nJurisdição: ${protocol.jurisdiction || 'N/A'}\\nData de Criação: ${new Date(protocol.createdAt).toLocaleString('pt-BR')}\\nStatus Atual: ${protocol.status}\\nFila Atual: ${queueName}\\n\\n${protocol.observations ? `💬 OBSERVAÇÕES\\n${protocol.observations}\\n\\n` : ''}📎 DOCUMENTOS ANEXADOS (${docCount})\\n${protocol.documents && protocol.documents.length > 0 ? protocol.documents.map((doc, i) => `${i+1}. ${doc.name} (${doc.category === 'petition' ? 'Petição' : 'Complementar'})`).join('\\n') : 'Nenhum documento anexado'}\\n\\n${protocol.guias && protocol.guias.length > 0 ? `💰 GUIAS DE RECOLHIMENTO (${protocol.guias.length})\\n${protocol.guias.map((g, i) => `${i+1}. ${g.type} - R$ ${g.value}`).join('\\n')}\\n\\n` : ''}📝 HISTÓRICO DE ATIVIDADES (${logCount})\\n${protocol.activityLog && protocol.activityLog.length > 0 ? protocol.activityLog.map((log, i) => `${i+1}. ${log.description} (${new Date(log.timestamp).toLocaleString('pt-BR')})`).join('\\n') : 'Nenhum registro de atividade'}')" style="padding: 4px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">📝 Log</button>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
                ${filteredProtocols.length > 0 ? `
                    <p style="margin-top: 12px; font-size: 0.85rem; color: #6b7280; text-align: center;">
                        Total de ${filteredProtocols.length} protocolo${filteredProtocols.length !== 1 ? 's' : ''} exibido${filteredProtocols.length !== 1 ? 's' : ''}
                    </p>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <p><strong>Relatório de Protocolos Fatais</strong></p>
            <p>Total de ${totalProtocols} protocolos analisados</p>
            <p>${teams.length} equipes registradas</p>
        </div>
    </div>
</body>
</html>`;

    // Criar e baixar o arquivo
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-protocolos-${getDateFilterLabel(dateFilter).toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  const formatActivityDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status: Protocol['status']) => {
    switch (status) {
      case 'Aguardando':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Em Execução':
        return <BarChart3 className="h-4 w-4 text-blue-500" />;
      case 'Peticionado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Devolvido':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'Cancelado':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getQueueName = (protocol: Protocol) => {
    if (protocol.assignedTo === 'Manual') return 'Fila Manual';
    if (protocol.assignedTo === 'Deyse') return 'Fila da Deyse';
    if (protocol.assignedTo === 'Enzo') return 'Fila do Enzo';
    if (protocol.assignedTo === 'Iago') return 'Fila do Iago';
    return 'Fila do Robô';
  };

  const getDateFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today': return 'Hoje';
      case 'last3days': return 'Últimos 3 dias';
      case 'last7days': return 'Últimos 7 dias';
      case 'last30days': return 'Últimos 30 dias';
      default: return 'Todos os períodos';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Relatórios e Estatísticas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Análise detalhada dos protocolos em processamento
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateHTMLReport}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório Completo
          </button>
          <button
            onClick={generateStatsOnlyReport}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório de Estatísticas
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Pesquisa Geral */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Pesquisa Geral
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tribunal, sistema, tipo..."
            />
          </div>

          {/* Filtro de Número de Protocolo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Buscar por Número
            </label>
            <input
              type="text"
              value={protocolNumberSearch}
              onChange={(e) => setProtocolNumberSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número do processo..."
            />
          </div>

          {/* Filtro de Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Hoje</option>
              <option value="last3days">Últimos 3 dias</option>
              <option value="last7days">Últimos 7 dias</option>
              <option value="last30days">Últimos 30 dias</option>
              <option value="all">Todos os períodos</option>
            </select>
          </div>
        </div>

        {/* Resumo dos Filtros */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Filtros ativos:</strong> {getDateFilterLabel(dateFilter)}
            {searchTerm && ` | Pesquisa geral: "${searchTerm}"`}
            {protocolNumberSearch && ` | Número: "${protocolNumberSearch}"`}
            {` | ${filteredProtocols.length} protocolo${filteredProtocols.length !== 1 ? 's' : ''} encontrado${filteredProtocols.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Lista de Protocolos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900">
            📋 Protocolos ({filteredProtocols.length})
          </h4>
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum protocolo encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || protocolNumberSearch || dateFilter !== 'today'
                ? 'Tente ajustar os filtros para encontrar protocolos.'
                : 'Nenhum protocolo foi criado hoje.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tribunal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sistema
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fila
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProtocols
                    .slice((currentPage - 1) * protocolsPerPage, currentPage * protocolsPerPage)
                    .map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(protocol.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[protocol.status]}`}>
                          {protocol.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
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
                          {protocol.processNumber || (protocol.isDistribution ? 'Distribuição sem número' : protocol.processNumber)}
                        </div>
                      </div>
                      {protocol.isFatal && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-red-600 font-medium">🚨 FATAL</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {protocol.court || (protocol.isDistribution ? 'Não especificado' : protocol.court)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {protocol.jurisdiction || (protocol.isDistribution ? 'Não especificado' : protocol.jurisdiction)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {protocol.system || (protocol.isDistribution ? 'Não especificado' : protocol.system)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getQueueName(protocol)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(protocol.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleProtocolClick(protocol)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Log
                      </button>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {filteredProtocols.length > protocolsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * protocolsPerPage) + 1} a {Math.min(currentPage * protocolsPerPage, filteredProtocols.length)} de {filteredProtocols.length} protocolos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.ceil(filteredProtocols.length / protocolsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(filteredProtocols.length / protocolsPerPage);
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="px-3 py-1 text-sm text-gray-500">...</span>
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredProtocols.length / protocolsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredProtocols.length / protocolsPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Visualização do Protocolo */}
      {isModalOpen && selectedProtocol && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ zIndex: 1000 }}>
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            {!showActivityLog ? (
              <>
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes do Protocolo
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
                  {/* Status do Protocolo */}
                  <div className="bg-gray-50 border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(selectedProtocol.status)}
                        <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedProtocol.status]}`}>
                          {selectedProtocol.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Fila atual: <strong>{getQueueName(selectedProtocol)}</strong>
                      </div>
                    </div>
                    {selectedProtocol.status === 'Devolvido' && selectedProtocol.returnReason && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm text-orange-800">
                          <strong>Motivo da devolução:</strong> {selectedProtocol.returnReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Informações do Processo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número do Processo
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.processNumber || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.processNumber)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tribunal
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.court || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.court)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sistema
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedProtocol.system || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.system)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Grau da Jurisdição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.jurisdiction || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.jurisdiction)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Petição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedProtocol.petitionType || (selectedProtocol.isDistribution ? ' - ' : selectedProtocol.petitionType)}
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
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                        {selectedProtocol.observations}
                      </p>
                    </div>
                  )}

                  {/* Lista de Documentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documentos Anexados ({selectedProtocol.documents.length})
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {selectedProtocol.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center py-1">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {doc.name} ({doc.category === 'petition' ? 'Petição' : 'Complementar'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de Procuração */}
                  {selectedProtocol.needsProcuration && selectedProtocol.procurationType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo de Procuração
                      </label>
                      <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-2 rounded">
                        {selectedProtocol.procurationType}
                      </p>
                    </div>
                  )}

                  {/* Guias de Recolhimento */}
                  {selectedProtocol.needsGuia && selectedProtocol.guias && selectedProtocol.guias.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guias de Recolhimento ({selectedProtocol.guias.length})
                      </label>
                      <div className="space-y-2">
                        {selectedProtocol.guias.map((guia, index) => (
                          <div key={guia.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-green-800">
                                Guia #{index + 1} - {guia.system}
                              </span>
                            </div>
                            <p className="text-sm text-green-700 font-mono">
                              {guia.number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Fechar */}
                <div className="pt-4 border-t">
                  <div className="flex justify-end">
                    <button
                      onClick={handleCloseModal}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Fechar
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
                      <strong>Processo:</strong> {selectedProtocol.processNumber || 'Distribuição sem número'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Status: {selectedProtocol.status}
                    </p>
                    <p className="text-xs text-gray-600">
                      Fila: {getQueueName(selectedProtocol)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Criado em: {formatDate(selectedProtocol.createdAt)}
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

      {/* Informações sobre Relatórios */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Sobre os Relatórios:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use os filtros para encontrar protocolos específicos ou por período</li>
          <li>• Clique em "Ver Log" para visualizar o histórico completo de cada protocolo</li>
          <li>• O relatório HTML pode ser gerado para períodos específicos</li>
          <li>• O arquivo HTML pode ser impresso ou salvo como PDF pelo navegador</li>
          <li>• Dados são atualizados em tempo real conforme novos protocolos são processados</li>
        </ul>
      </div>
    </div>
  );
}