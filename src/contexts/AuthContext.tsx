import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, USER_PERMISSIONS } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof typeof USER_PERMISSIONS.admin) => boolean;
  canAccessQueues: boolean;
  canAccessSpecificQueue: (queueName: 'carlos' | 'deyse' | 'robot') => boolean;
  canMoveToQueue: (targetQueue: 'carlos' | 'deyse' | 'robot') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: keyof typeof USER_PERMISSIONS.admin): boolean => {
    if (!user) return false;
    return USER_PERMISSIONS[user.permissao]?.[permission] || false;
  };

  const canAccessQueues = hasPermission('canAccessAllQueues');
  
  // Função específica para verificar se o usuário pode acessar uma fila específica
  const canAccessSpecificQueue = (queueName: 'carlos' | 'deyse' | 'robot'): boolean => {
    if (!user) return false;
    
    // Admin e mod podem acessar todas as filas
    if (user.permissao === 'admin' || user.permissao === 'mod') return true;
    
    return false;
  };

  // Função para verificar se pode mover protocolos entre filas
  const canMoveToQueue = (targetQueue: 'carlos' | 'deyse' | 'robot'): boolean => {
    if (!user) return false;
    
    // Admin e mod podem mover para qualquer fila
    if (user.permissao === 'admin' || user.permissao === 'mod') return true;
    
    return false;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      hasPermission, 
      canAccessQueues,
      canAccessSpecificQueue,
      canMoveToQueue
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}