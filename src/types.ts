export interface Protocol {
  id: string;
  processNumber: string;
  court: string;
  system: string;
  jurisdiction: '1º Grau' | '2º Grau';
  processType: 'civel' | 'trabalhista'; // Novo campo para diferenciar tipos
  isFatal: boolean;
  needsProcuration: boolean;
  procurationType?: string;
  needsGuia: boolean;
  guias: ProtocolGuia[];
  petitionType: string;
  observations?: string;
  documents: ProtocolDocument[];
  status: 'Aguardando' | 'Em Execução' | 'Peticionado' | 'Devolvido' | 'Cancelado';
  assignedTo?: 'Manual' | 'Deyse' | 'Enzo' | 'Iago' | null; // Para fila manual
  createdBy: number; // ID do usuário que criou o protocolo
  returnReason?: string; // Motivo da devolução
  taskCode: string; // Código da Tarefa (obrigatório, apenas números)
  createdAt: Date;
  updatedAt: Date;
  queuePosition: number;
  activityLog?: ProtocolActivity[]; // Log de atividades do protocolo
  isDistribution?: boolean; // Indica se é uma distribuição
}

export interface ProtocolGuia {
  id: string;
  number: string;
  system: 'ESAJ' | 'TJRJ Eletrônico';
}
export interface ProtocolActivity {
  id: string;
  timestamp: Date;
  action: 'created' | 'moved_to_queue' | 'status_changed' | 'returned' | 'resubmitted';
  description: string;
  performedBy?: string; // Email ou nome de quem executou a ação
  details?: string; // Detalhes adicionais (ex: motivo da devolução)
}

export interface ProtocolAlert {
  id: string;
  protocolId: string;
  message: string;
  createdBy: number; // ID do usuário que criou o alerta
  createdAt: Date;
  isRead: boolean;
}

export interface User {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
  equipe?: string;
  firstLogin?: boolean;
}

export const USER_PERMISSIONS = {
  admin: {
    canAccessAllQueues: true,
    canMoveProtocols: true,
    canViewTracking: true,
    canSendProtocols: true,
  },
  mod: {
    canAccessAllQueues: true,
    canMoveProtocols: true,
    canViewTracking: true,
    canSendProtocols: true,
  },
  advogado: {
    canAccessAllQueues: false,
    canMoveProtocols: false,
    canViewTracking: true,
    canSendProtocols: true,
  },
};

export interface ProtocolDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Base64 para simulação
  category: 'petition' | 'complementary';
}

export const PROCURATION_TYPES = [
  'Grupo Santander - Aymore/Santander/Santander leasing',
  'Grupo Votorantim - Banco Votorantim/BV',
  'Grupo Safra - Safra/J Safra/Safra crédito',
  'Associação Petrobras de Saúde - APS',
  'Petróleo Brasileiro - Petrobras',
  'Fundação São Francisco Xavier - FSFX',
  'Banco Pan',
  'Banco BRB',
  'Banco ITAÚ',
  'Superdigital',
  'UNIMED',
  'Previdência Usiminas',
  'Sankyu',
  'Aperam América',
  'Aperam Bioenergia',
  'Consul',
  'Outros (especificar)',
];

export const COURTS = [
  // Tribunais Superiores
  'Supremo Tribunal Federal',
  'Superior Tribunal de Justiça',
  'Tribunal Superior do Trabalho',
  'Superior Tribunal Militar',
  'Tribunal Superior Eleitoral',
  
  // Tribunais Regionais Federais
  'Tribunal Regional Federal da 1ª Região',
  'Tribunal Regional Federal da 2ª Região',
  'Tribunal Regional Federal da 3ª Região',
  'Tribunal Regional Federal da 4ª Região',
  'Tribunal Regional Federal da 5ª Região',
  'Tribunal Regional Federal da 6ª Região',
  
  // Tribunais de Justiça Estaduais
  'Tribunal de Justiça do Acre',
  'Tribunal de Justiça de Alagoas',
  'Tribunal de Justiça do Amapá',
  'Tribunal de Justiça do Amazonas',
  'Tribunal de Justiça da Bahia',
  'Tribunal de Justiça do Ceará',
  'Tribunal de Justiça do Distrito Federal e Territórios',
  'Tribunal de Justiça do Espírito Santo',
  'Tribunal de Justiça de Goiás',
  'Tribunal de Justiça do Maranhão',
  'Tribunal de Justiça do Mato Grosso',
  'Tribunal de Justiça do Mato Grosso do Sul',
  'Tribunal de Justiça de Minas Gerais',
  'Tribunal de Justiça do Pará',
  'Tribunal de Justiça da Paraíba',
  'Tribunal de Justiça do Paraná',
  'Tribunal de Justiça de Pernambuco',
  'Tribunal de Justiça do Piauí',
  'Tribunal de Justiça do Rio de Janeiro',
  'Tribunal de Justiça do Rio Grande do Norte',
  'Tribunal de Justiça do Rio Grande do Sul',
  'Tribunal de Justiça de Rondônia',
  'Tribunal de Justiça de Roraima',
  'Tribunal de Justiça de Santa Catarina',
  'Tribunal de Justiça de São Paulo',
  'Tribunal de Justiça de Sergipe',
  'Tribunal de Justiça de Tocantins',
  
  // Tribunais Regionais do Trabalho
  'Tribunal Regional do Trabalho da 1ª Região (RJ)',
  'Tribunal Regional do Trabalho da 2ª Região (SP)',
  'Tribunal Regional do Trabalho da 3ª Região (MG)',
  'Tribunal Regional do Trabalho da 4ª Região (RS)',
  'Tribunal Regional do Trabalho da 5ª Região (BA)',
  'Tribunal Regional do Trabalho da 6ª Região (PE)',
  'Tribunal Regional do Trabalho da 7ª Região (CE)',
  'Tribunal Regional do Trabalho da 8ª Região (PA)',
  'Tribunal Regional do Trabalho da 9ª Região (PR)',
  'Tribunal Regional do Trabalho da 10ª Região (DF)',
  'Tribunal Regional do Trabalho da 11ª Região (AM)',
  'Tribunal Regional do Trabalho da 12ª Região (SC)',
  'Tribunal Regional do Trabalho da 13ª Região (PB)',
  'Tribunal Regional do Trabalho da 14ª Região (RO)',
  'Tribunal Regional do Trabalho da 15ª Região (SP)',
  'Tribunal Regional do Trabalho da 16ª Região (MA)',
  'Tribunal Regional do Trabalho da 17ª Região (ES)',
  'Tribunal Regional do Trabalho da 18ª Região (GO)',
  'Tribunal Regional do Trabalho da 19ª Região (AL)',
  'Tribunal Regional do Trabalho da 20ª Região (SE)',
  'Tribunal Regional do Trabalho da 21ª Região (RN)',
  'Tribunal Regional do Trabalho da 22ª Região (PI)',
  'Tribunal Regional do Trabalho da 23ª Região (MT)',
  'Tribunal Regional do Trabalho da 24ª Região (MS)',
  
  // Tribunais Regionais Eleitorais
  'Tribunal Regional Eleitoral do Acre',
  'Tribunal Regional Eleitoral de Alagoas',
  'Tribunal Regional Eleitoral do Amapá',
  'Tribunal Regional Eleitoral do Amazonas',
  'Tribunal Regional Eleitoral da Bahia',
  'Tribunal Regional Eleitoral do Ceará',
  'Tribunal Regional Eleitoral do Distrito Federal',
  'Tribunal Regional Eleitoral do Espírito Santo',
  'Tribunal Regional Eleitoral de Goiás',
  'Tribunal Regional Eleitoral do Maranhão',
  'Tribunal Regional Eleitoral do Mato Grosso',
  'Tribunal Regional Eleitoral do Mato Grosso do Sul',
  'Tribunal Regional Eleitoral de Minas Gerais',
  'Tribunal Regional Eleitoral do Pará',
  'Tribunal Regional Eleitoral da Paraíba',
  'Tribunal Regional Eleitoral do Paraná',
  'Tribunal Regional Eleitoral de Pernambuco',
  'Tribunal Regional Eleitoral do Piauí',
  'Tribunal Regional Eleitoral do Rio de Janeiro',
  'Tribunal Regional Eleitoral do Rio Grande do Norte',
  'Tribunal Regional Eleitoral do Rio Grande do Sul',
  'Tribunal Regional Eleitoral de Rondônia',
  'Tribunal Regional Eleitoral de Roraima',
  'Tribunal Regional Eleitoral de Santa Catarina',
  'Tribunal Regional Eleitoral de São Paulo',
  'Tribunal Regional Eleitoral de Sergipe',
  'Tribunal Regional Eleitoral de Tocantins',
  
  // Tribunais de Justiça Militar
  'Tribunal de Justiça Militar do Estado de Minas Gerais',
  'Tribunal de Justiça Militar do Estado do Rio Grande do Sul',
  'Tribunal de Justiça Militar do Estado de São Paulo',
];

export const PETITION_TYPES = [
  'Manifestação',
  'Contestação',
  'Tréplica',
  'Recurso de Apelação',
  'Recurso Especial',
  'Recurso Extraordinário',
  'Agravo de Instrumento',
  'Embargos de Declaração',
  'Petição Inicial',
  'Reconvenção',
  'Impugnação',
  'Alegações Finais',
  'Memoriais',
  'Petição Avulsa',
  'Cumprimento de Sentença',
  'Execução',
  'Outros'
];

export const PROCESS_TYPES = [
  { value: 'civel', label: 'Cível' },
  { value: 'trabalhista', label: 'Trabalhista' }
];

export const STATUS_COLORS = {
  'Aguardando': 'bg-yellow-100 text-yellow-800',
  'Em Execução': 'bg-blue-100 text-blue-800',
  'Peticionado': 'bg-green-100 text-green-800',
  'Devolvido': 'bg-orange-100 text-orange-800',
  'Cancelado': 'bg-red-100 text-red-800',
};

export const TRIBUNAL_SYSTEMS = [
  'ESAJ',
  'PJe',
  'Projudi',
  'TJRJ Eletrônico',
  'eProc',
  'eProc SP',
  'Portal do Adv',
  'Sistema não identificado',
];