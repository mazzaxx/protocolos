import { testConnection, getDatabaseStats, initializeDb } from './db.js';

console.log('🧪 Testando conectividade Railway PostgreSQL...');

async function runTests() {
  try {
    console.log('🔍 Teste 1: Conectividade básica');
    await testConnection();
    console.log('✅ Conectividade OK');
    
    console.log('🔍 Teste 2: Estatísticas do banco');
    const stats = await getDatabaseStats();
    console.log('📊 Estatísticas:', stats);
    
    console.log('🔍 Teste 3: Inicialização completa');
    await initializeDb();
    console.log('✅ Inicialização OK');
    
    console.log('🎉 Todos os testes Railway passaram!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Teste Railway falhou:', error);
    process.exit(1);
  }
}

runTests();