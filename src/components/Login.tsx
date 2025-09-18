import React, { useState } from 'react';
import { Scale, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * COMPONENTE DE LOGIN - SQUARE CLOUD
 * 
 * Interface de autenticação otimizada para Square Cloud.
 * Design responsivo com validação robusta.
 * 
 * FUNCIONALIDADES:
 * - Login com email e senha
 * - Validação de formulário
 * - Feedback visual de erros
 * - Mostrar/ocultar senha
 * - Dados de teste incluídos
 * 
 * HOSPEDAGEM SQUARE CLOUD:
 * - Requisições otimizadas para API
 * - Tratamento de erros específico
 * - Logs detalhados para debugging
 */

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * HANDLER PARA MUDANÇAS NOS INPUTS
   * 
   * Atualiza estado do formulário e limpa erros.
   * Otimizado para performance na Square Cloud.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // SQUARE CLOUD: Limpar erro ao digitar
  };

  /**
   * HANDLER PARA SUBMISSÃO DO FORMULÁRIO
   * 
   * Processa login com validação e comunicação com Square Cloud.
   * Inclui tratamento robusto de erros e logs detalhados.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // SQUARE CLOUD: Configurar URL da API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const loginUrl = `${apiBaseUrl}/api/login`;
      
      console.log('[SQUARE CLOUD] 🔐 Tentando fazer login em:', loginUrl);
      console.log('[SQUARE CLOUD] 📧 Email:', formData.email);
      
      /**
       * REQUISIÇÃO DE LOGIN PARA SQUARE CLOUD
       * 
       * Configuração otimizada para comunicação com API.
       * Headers específicos para identificação da plataforma.
       */
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'Square Cloud', // SQUARE CLOUD: Identificação da plataforma
          'X-Client-Type': 'React Frontend' // SQUARE CLOUD: Tipo de cliente
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('[SQUARE CLOUD] 📡 Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('[SQUARE CLOUD] 📦 Dados da resposta:', data);

      if (data.success) {
        console.log('[SQUARE CLOUD] ✅ Login realizado com sucesso!');
        
        /**
         * ARMAZENAMENTO DE DADOS DO USUÁRIO
         * 
         * Salva dados no localStorage para persistência.
         * Inclui metadados da Square Cloud.
         */
        const userData = {
          ...data.user,
          platform: 'Square Cloud',
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        console.log('[SQUARE CLOUD] ❌ Falha no login:', data.message);
        setError(data.message || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('[SQUARE CLOUD] ❌ Erro de login:', err);
      
      /**
       * TRATAMENTO ESPECÍFICO DE ERROS DA SQUARE CLOUD
       * 
       * Diferentes tipos de erro com mensagens específicas.
       * Ajuda na identificação de problemas de conectividade.
       */
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Erro de conexão com a Square Cloud. Verifique sua conexão com a internet.');
      } else {
        setError('Erro de conexão com a Square Cloud. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* SQUARE CLOUD: Header com branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema Jurídico - Square Cloud
          </h1>
          <p className="text-gray-600">
            Faça login para acessar o painel hospedado na Square Cloud
          </p>
        </div>

        {/* SQUARE CLOUD: Formulário de Login Otimizado */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SQUARE CLOUD: Campo Email com validação */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* SQUARE CLOUD: Campo Senha com toggle de visibilidade */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* SQUARE CLOUD: Mensagem de Erro com estilo específico */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">
                    [Square Cloud] {error}
                  </span>
                </div>
              </div>
            )}

            {/* SQUARE CLOUD: Botão de Login com loading state */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Fazer login na Square Cloud"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Conectando à Square Cloud...
                </div>
              ) : (
                'Entrar na Square Cloud'
              )}
            </button>
          </form>

          {/* SQUARE CLOUD: Informações de Teste com dados específicos */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Dados para teste na Square Cloud:
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@escritorio.com / 123456</p>
              <p><strong>Moderador:</strong> mod@escritorio.com / 123456</p>
              <p><strong>Advogado:</strong> advogado@escritorio.com / 123456</p>
            </div>
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              <strong>Square Cloud:</strong> Sistema hospedado na plataforma brasileira Square Cloud. 
              Para desenvolvimento local, use <code>npm run dev:full</code>
            </div>
          </div>
        </div>

        {/* SQUARE CLOUD: Footer com informações da plataforma */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Sistema de Protocolos Jurídicos © 2024
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Hospedado na Square Cloud - Plataforma Brasileira
          </p>
        </div>
      </div>
    </div>
  );
}