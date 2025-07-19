export interface Protocol {
  id: string;
  processNumber: string;
  court: string;
  system: string;
  jurisdiction: '1º Grau' | '2º Grau';
  isFatal: boolean;
  needsProcuration: boolean;
  petitionType: string;
  observations?: string;
  documents: ProtocolDocument[];
  status: 'Aguardando' | 'Peticionado' | 'Erro' | 'Devolvido';
  assignedTo?: 'Carlos' | 'Deyse' | null; // Para fila manual
  createdBy: number; // ID do usuário que criou o protocolo
  returnReason?: string; // Motivo da devolução
  createdAt: Date;
  updatedAt: Date;
  queuePosition: number;
  activityLog?: ProtocolActivity[]; // Log de atividades do protocolo
}

export interface ProtocolActivity {
  id: string;
  timestamp: Date;
  action: 'created' | 'moved_to_queue' | 'status_changed' | 'returned' | 'resubmitted';
  description: string;
  performedBy?: string; // Email ou nome de quem executou a ação
  details?: string; // Detalhes adicionais (ex: motivo da devolução)
}

export interface User {
  id: number;
  email: string;
  permissao: 'admin' | 'mod' | 'advogado';
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

export const COURTS = [
  'Tribunal de Justiça de São Paulo',
  'Tribunal de Justiça do Rio de Janeiro',
  'Tribunal de Justiça de Minas Gerais',
  'Tribunal Regional Federal da 1ª Região',
  'Tribunal Regional Federal da 2ª Região',
  'Tribunal Regional Federal da 3ª Região',
  'Superior Tribunal de Justiça',
  'Supremo Tribunal Federal',
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
  'Outros',
];

export const STATUS_COLORS = {
  'Aguardando': 'bg-yellow-100 text-yellow-800',
  'Peticionado': 'bg-green-100 text-green-800',
  'Erro': 'bg-red-100 text-red-800',
  'Devolvido': 'bg-orange-100 text-orange-800',
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