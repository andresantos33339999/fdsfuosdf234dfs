// Configuração do Supabase
const SUPABASE_URL = 'https://gzrutxnpddsconbaayqt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnV0eG5wZGRzY29uYmFheXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIxMDYsImV4cCI6MjA3ODAyODEwNn0.zbbenomx5FS0F4iS9y96ewv2V31eivjxGOamilisWCE';

// Criar cliente Supabase usando a biblioteca CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase conectado com sucesso!');

// Funções auxiliares para interação com o banco de dados

// Buscar todas as transações do usuário
async function buscarTransacoes() {
    try {
        const { data, error } = await supabaseClient
            .from('transacoes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        return null;
    }
}

// Adicionar nova transação
async function adicionarTransacao(descricao, valor) {
    try {
        const { data, error } = await supabaseClient
            .from('transacoes')
            .insert([
                { 
                    descricao: descricao, 
                    valor: valor,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) throw error;
        console.log('✅ Transação adicionada:', data);
        return data;
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        return null;
    }
}

// Buscar saldo atual do usuário
async function buscarSaldo() {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('saldo')
            .single();
        
        if (error) throw error;
        return data?.saldo || 0;
    } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        return 0;
    }
}

// Atualizar saldo do usuário
async function atualizarSaldo(novoSaldo) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .update({ saldo: novoSaldo })
            .eq('id', 1) // Assumindo usuário ID 1
            .select();
        
        if (error) throw error;
        console.log('✅ Saldo atualizado:', data);
        return data;
    } catch (error) {
        console.error('Erro ao atualizar saldo:', error);
        return null;
    }
}

// Função auxiliar para gerar número aleatório
function gerarNumeroAleatorio(digitos) {
    let numero = '';
    for (let i = 0; i < digitos; i++) {
        numero += Math.floor(Math.random() * 10);
    }
    return numero;
}

// Adicionar detalhes da transação
async function adicionarDetalhesTransacao(transacaoId, montante, saldoAtual) {
    try {
        const agora = new Date();
        const saldoAposMovimento = parseFloat((saldoAtual).toFixed(2));
        
        const contaDestino = gerarNumeroAleatorio(13);
        const numeroTransferencia = gerarNumeroAleatorio(9);
        
        const detalhes = {
            transacao_id: transacaoId,
            montante_transacao: parseFloat(montante.toFixed(2)),
            data_movimento: agora.toISOString(),
            data_transacao: agora.toISOString(),
            tipo: 'Débito',
            operacao: 'Caixa directa On-line',
            conta_destino: contaDestino,
            numero_transferencia: numeroTransferencia,
            montante_transferencia: parseFloat(montante.toFixed(2)),
            montante_original: parseFloat(montante.toFixed(2)),
            saldo_contabilistico: saldoAposMovimento,
            saldo_disponivel_apos_movimento: saldoAposMovimento,
            created_at: agora.toISOString()
        };
        
        console.log('📋 Preparando detalhes da transação:');
        console.log('   Transação ID:', transacaoId);
        console.log('   Conta Destino:', contaDestino);
        console.log('   Nº Transferência:', numeroTransferencia);
        console.log('   Montante:', montante);
        console.log('   Saldo após:', saldoAposMovimento);
        
        const { data, error } = await supabaseClient
            .from('detalhes_transacoes')
            .insert([detalhes])
            .select();
        
        if (error) {
            console.error('❌ Erro ao inserir detalhes:', error);
            throw error;
        }
        
        console.log('✅ Detalhes da transação salvos na BD:', data);
        console.log('   ✓ Conta destino salva:', data[0]?.conta_destino);
        console.log('   ✓ Nº transferência salvo:', data[0]?.numero_transferencia);
        
        return data;
    } catch (error) {
        console.error('❌ ERRO ao adicionar detalhes da transação:', error);
        console.error('   Mensagem:', error.message);
        console.error('   Detalhes:', error.details || 'N/A');
        console.error('   Hint:', error.hint || 'N/A');
        return null;
    }
}

// Adicionar nova transação com detalhes completos
async function adicionarTransacaoCompleta(descricao, valor, saldoAtual) {
    try {
        // PASSO 1: Adicionar transação principal
        const { data: transacao, error: errorTransacao } = await supabaseClient
            .from('transacoes')
            .insert([
                { 
                    descricao: descricao, 
                    valor: valor,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (errorTransacao) throw errorTransacao;
        
        const transacaoId = transacao[0].id;
        console.log('✅ Transação principal criada com ID:', transacaoId);
        
        // PASSO 2: Adicionar detalhes da transação com dados aleatórios
        await adicionarDetalhesTransacao(transacaoId, Math.abs(valor), saldoAtual);
        
        return transacao;
    } catch (error) {
        console.error('Erro ao adicionar transação completa:', error);
        return null;
    }
}

// Buscar detalhes de uma transação
async function buscarDetalhesTransacao(transacaoId) {
    try {
        console.log('🔍 Buscando detalhes para transação ID:', transacaoId);
        
        const { data, error } = await supabaseClient
            .from('detalhes_transacoes')
            .select('*')
            .eq('transacao_id', transacaoId)
            .single();
        
        if (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            console.error('   Código:', error.code);
            console.error('   Mensagem:', error.message);
            throw error;
        }
        
        if (data) {
            console.log('✅ Detalhes encontrados:');
            console.log('   Conta Destino:', data.conta_destino);
            console.log('   Nº Transferência:', data.numero_transferencia);
            console.log('   Montante:', data.montante_transacao);
            console.log('   Saldo após:', data.saldo_disponivel_apos_movimento);
        } else {
            console.warn('⚠️ Nenhum detalhe encontrado para a transação:', transacaoId);
        }
        
        return data;
    } catch (error) {
        console.error('❌ ERRO ao buscar detalhes da transação:', error);
        console.error('   ID procurado:', transacaoId);
        return null;
    }
}

// Exportar funções para uso global
window.supabaseDB = {
    buscarTransacoes,
    adicionarTransacao,
    adicionarTransacaoCompleta,
    buscarDetalhesTransacao,
    buscarSaldo,
    atualizarSaldo
};
