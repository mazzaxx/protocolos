import React from 'react';
import { Scale, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Scale className="h-8 w-8 text-blue-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              Painel de Protocolos Jurídicos
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Informações do usuário */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                user?.permissao === 'admin' ? 'bg-red-100 text-red-800' :
                user?.permissao === 'mod' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {user?.permissao}
              </span>
            </div>
            
            {/* Botão de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}