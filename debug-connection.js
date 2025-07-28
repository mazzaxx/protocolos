// Script de debug para testar conectividade
const testConnection = async () => {
  console.log('🔧 DIAGNÓSTICO DE CONECTIVIDADE');
  console.log('================================\n');

  // Teste 1: Verificar se o servidor local está rodando
  console.log('1️⃣ Testando servidor local (localhost:3002)...');
  try {
    const response = await fetch('http://localhost:3002');
    const data = await response.json();
    console.log('✅ Servidor local online:', data.message);
  } catch (error) {
    console.log('❌ Servidor local offline:', error.message);
    console.log('💡 Execute: npm run server ou npm run dev:full');
  }

  // Teste 2: Verificar rota de protocolos local
  console.log('\n2️⃣ Testando rota de protocolos local...');
  try {
    const response = await fetch('http://localhost:3002/api/protocolos');
    const data = await response.json();
    console.log('✅ Rota de protocolos local:', data.success ? 'Funcionando' : 'Com problemas');
    console.log('📊 Protocolos encontrados:', data.protocolos?.length || 0);
  } catch (error) {
    console.log('❌ Rota de protocolos local com erro:', error.message);
  }

  // Teste 3: Verificar health check local
  console.log('\n3️⃣ Testando health check local...');
  try {
    const response = await fetch('http://localhost:3002/health');
    const data = await response.json();
    console.log('✅ Health check local:', data.status);
    console.log('📊 Stats do banco:', data.stats);
  } catch (error) {
    console.log('❌ Health check local com erro:', error.message);
  }

  // Teste 4: Verificar servidor de produção (se configurado)
  const PROD_URL = 'https://sistema-protocolos-juridicos-production.up.railway.app';
  console.log('\n4️⃣ Testando servidor de produção...');
  try {
    const response = await fetch(PROD_URL);
    const data = await response.json();
    console.log('✅ Servidor de produção online:', data.message);
  } catch (error) {
    console.log('❌ Servidor de produção offline:', error.message);
  }

  // Teste 5: Verificar CORS
  console.log('\n5️⃣ Testando CORS...');
  try {
    const response = await fetch('http://localhost:3002/health', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ CORS funcionando, status:', response.status);
    console.log('📋 Headers CORS:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    });
  } catch (error) {
    console.log('❌ Problema com CORS:', error.message);
  }

  console.log('\n================================');
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
  console.log('\n💡 SOLUÇÕES COMUNS:');
  console.log('• Se servidor local offline: npm run server');
  console.log('• Se CORS com problema: verificar allowedOrigins no server.js');
  console.log('• Se banco com erro: verificar se database.sqlite existe');
  console.log('• Para desenvolvimento: npm run dev:full');
  console.log('• Para produção: verificar variáveis de ambiente');
};

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection().catch(console.error);
}

export { testConnection };