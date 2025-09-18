// Teste de conectividade para verificar se o servidor está funcionando
import fetch from 'node-fetch';

const BACKEND_URL = 'https://protocolos.squareweb.app';

async function testConnectivity() {
  console.log('🧪 TESTE DE CONECTIVIDADE');
  console.log('========================\n');

  // Teste 1: Verificar se o backend está online
  try {
    console.log('1️⃣ Testando backend...');
    const response = await fetch(BACKEND_URL);
    const data = await response.json();
    console.log('✅ Backend online:', data.message);
  } catch (error) {
    console.log('❌ Backend offline:', error.message);
  }

  // Teste 2: Verificar rota de protocolos
  try {
    console.log('\n2️⃣ Testando rota de protocolos...');
    const response = await fetch(`${BACKEND_URL}/api/protocolos`);
    const data = await response.json();
    console.log('✅ Rota de protocolos:', data.success ? 'Funcionando' : 'Com problemas');
    console.log('📊 Protocolos encontrados:', data.protocolos?.length || 0);
  } catch (error) {
    console.log('❌ Rota de protocolos com erro:', error.message);
  }

  // Teste 3: Verificar rota de funcionários
  try {
    console.log('\n3️⃣ Testando rota de funcionários...');
    const response = await fetch(`${BACKEND_URL}/api/admin/funcionarios`);
    const data = await response.json();
    console.log('✅ Rota de funcionários:', data.success ? 'Funcionando' : 'Com problemas');
    console.log('👥 Funcionários encontrados:', data.funcionarios?.length || 0);
  } catch (error) {
    console.log('❌ Rota de funcionários com erro:', error.message);
  }

  console.log('\n========================');
  console.log('🏁 TESTE CONCLUÍDO');
}

testConnectivity();