// Detalhes do Movimento

console.log('📄 Página de Detalhes do Movimento inicializada');

// Formatador de moeda
const fmtMoeda = (valor) => {
    const valorAbs = Math.abs(valor);
    const sinal = valor < 0 ? '-' : '';
    return {
        completo: `${sinal}${valorAbs.toFixed(2).replace('.', ',')} EUR`,
        valor: `${sinal}${valorAbs.toFixed(2).replace('.', ',')}`,
        moeda: 'EUR'
    };
};

// Formatador de data
const fmtData = (dataStr) => {
    if (!dataStr) return '—';
    const data = new Date(dataStr);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// Formatador de data e hora completo
const fmtDataHora = (dataStr) => {
    if (!dataStr) return '—';
    const data = new Date(dataStr);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia} ${hora}:${minuto}`;
};

// Carregar dados do movimento da base de dados
async function carregarDetalhes() {
    console.log('🔍 Carregando detalhes do movimento...');
    
    // Tentar obter dados do localStorage
    const movimentoStr = localStorage.getItem('movimentoSelecionado');
    
    if (!movimentoStr) {
        console.warn('⚠️ Nenhum movimento encontrado');
        window.location.href = 'movimentos.html';
        return;
    }
    
    const movimento = JSON.parse(movimentoStr);
    console.log('📊 Movimento carregado:', movimento);
    
    // Verificar se temos ID da transação
    if (!movimento.id) {
        console.warn('⚠️ ID da transação não encontrado, usando dados locais');
        preencherDetalhesLocais(movimento);
        return;
    }
    
    // Buscar detalhes completos da base de dados
    if (typeof window.supabaseDB !== 'undefined') {
        try {
            console.log('🗄️ Buscando detalhes da transação ID:', movimento.id);
            const detalhes = await window.supabaseDB.buscarDetalhesTransacao(movimento.id);
            
            if (detalhes) {
                console.log('✅ Detalhes encontrados na base de dados:', detalhes);
                preencherDetalhesCompletos(movimento, detalhes);
            } else {
                console.warn('⚠️ Detalhes não encontrados na BD, usando dados básicos');
                preencherDetalhesLocais(movimento);
            }
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            preencherDetalhesLocais(movimento);
        }
    } else {
        console.warn('⚠️ Supabase não disponível, usando dados locais');
        preencherDetalhesLocais(movimento);
    }
}

// Preencher com detalhes completos da base de dados
function preencherDetalhesCompletos(movimento, detalhes) {
    console.log('✨ Preenchendo detalhes completos da base de dados');
    
    // Categoria
    document.getElementById('categoriaNome').textContent = 'Outro(s)';
    document.getElementById('categoriaSubtitulo').textContent = 'Categoria: Outros';
    
    // Descrição e Valor
    document.getElementById('movimentoDescricao').textContent = movimento.descricao || 'Movimento';
    
    // Usar o valor do movimento (com sinal) para exibição
    const valorFormatado = fmtMoeda(movimento.valor);
    const valorElement = document.getElementById('movimentoValor');
    valorElement.textContent = `${valorFormatado.valor} ${valorFormatado.moeda}`;
    
    // Colorir valor baseado no tipo
    if (movimento.valor < 0) {
        valorElement.style.color = 'white';
    } else {
        valorElement.style.color = '#4caf50';
    }
    
    // Data do movimento
    document.getElementById('dataMovimento').textContent = fmtData(detalhes.data_movimento);
    
    // Tipo
    document.getElementById('tipoMovimento').textContent = detalhes.tipo || 'Débito';
    
    // Operação
    document.getElementById('operacao').textContent = detalhes.operacao || 'Caixa directa On-line';
    
    // Conta destino
    document.getElementById('contaDestino').textContent = detalhes.conta_destino || '—';
    
    // Número de transferência
    document.getElementById('numeroTransferencia').textContent = detalhes.numero_transferencia || '—';
    
    // Montante da transferência
    const montanteTransfFormatado = fmtMoeda(detalhes.montante_transferencia);
    document.getElementById('montanteTransferencia').textContent = `${montanteTransfFormatado.valor} ${montanteTransfFormatado.moeda}`;
    
    // Montante original
    const montanteOrigFormatado = fmtMoeda(detalhes.montante_original);
    document.getElementById('montanteOriginal').textContent = `${montanteOrigFormatado.valor} ${montanteOrigFormatado.moeda}`;
    
    // Saldo contabilístico após movimento
    const saldoContabFormatado = fmtMoeda(detalhes.saldo_contabilistico);
    document.getElementById('saldoContabilistico').textContent = `${saldoContabFormatado.valor} ${saldoContabFormatado.moeda}`;
    
    // Saldo disponível após movimento
    const saldoDispFormatado = fmtMoeda(detalhes.saldo_disponivel_apos_movimento);
    document.getElementById('saldoDisponivel').textContent = `${saldoDispFormatado.valor} ${saldoDispFormatado.moeda}`;
    
    console.log('✅ Detalhes preenchidos com sucesso!');
}

// Preencher com dados locais (fallback)
function preencherDetalhesLocais(movimento) {
    console.log('📝 Preenchendo com dados locais (fallback)');
    
    // Categoria
    document.getElementById('categoriaNome').textContent = 'Outro(s)';
    document.getElementById('categoriaSubtitulo').textContent = 'Categoria: Outros';
    
    // Descrição e Valor
    document.getElementById('movimentoDescricao').textContent = movimento.descricao || 'Movimento';
    
    const valorFormatado = fmtMoeda(movimento.valor);
    const valorElement = document.getElementById('movimentoValor');
    valorElement.textContent = `${valorFormatado.valor} ${valorFormatado.moeda}`;
    
    // Colorir valor
    if (movimento.valor < 0) {
        valorElement.style.color = 'white';
    } else {
        valorElement.style.color = '#4caf50';
    }
    
    // Datas
    document.getElementById('dataMovimento').textContent = fmtData(movimento.data);
    
    // Tipo
    const tipo = movimento.valor < 0 ? 'Débito' : 'Crédito';
    document.getElementById('tipoMovimento').textContent = tipo;
    
    // Operação
    document.getElementById('operacao').textContent = 'Caixa directa On-line';
    
    // Conta destino e Número de transferência
    document.getElementById('contaDestino').textContent = '—';
    document.getElementById('numeroTransferencia').textContent = '—';
    
    // Montantes
    document.getElementById('montanteTransferencia').textContent = `${valorFormatado.valor} ${valorFormatado.moeda}`;
    document.getElementById('montanteOriginal').textContent = `${valorFormatado.valor} ${valorFormatado.moeda}`;
    
    // Saldos após movimento
    const saldoApos = movimento.saldoApos || 0;
    const saldoFormatado = fmtMoeda(saldoApos);
    document.getElementById('saldoContabilistico').textContent = `${saldoFormatado.valor} ${saldoFormatado.moeda}`;
    document.getElementById('saldoDisponivel').textContent = `${saldoFormatado.valor} ${saldoFormatado.moeda}`;
}

// Apagar transação com confirmação dupla
async function apagarTransacao() {
    try {
        // Buscar dados do movimento
        const movimentoStr = localStorage.getItem('movimentoSelecionado');
        if (!movimentoStr) {
            alert('❌ Erro: Transação não encontrada.');
            return;
        }

        const movimento = JSON.parse(movimentoStr);
        const { id, descricao, valor } = movimento;

        console.log('🗑️ Solicitação de exclusão:', { id, descricao, valor });

        // Confirmação 1: Avisar sobre a ação
        const confirmar1 = confirm(
            `⚠️ ATENÇÃO!\n\n` +
            `Você está prestes a APAGAR esta transação:\n\n` +
            `📋 ${descricao}\n` +
            `💰 ${valor > 0 ? '+' : ''}${valor.toFixed(2)} EUR\n\n` +
            `O saldo será revertido automaticamente.\n\n` +
            `Deseja continuar?`
        );

        if (!confirmar1) {
            console.log('❌ Exclusão cancelada pelo usuário (1ª confirmação)');
            return;
        }

        // Confirmação 2: Confirmar definitivamente
        const confirmar2 = confirm(
            `🚨 ÚLTIMA CONFIRMAÇÃO!\n\n` +
            `Esta ação NÃO PODE SER DESFEITA!\n\n` +
            `Tem CERTEZA que deseja apagar esta transação?\n\n` +
            `Digite OK para confirmar.`
        );

        if (!confirmar2) {
            console.log('❌ Exclusão cancelada pelo usuário (2ª confirmação)');
            return;
        }

        // Verificar se o Supabase está disponível
        const USAR_SUPABASE = true; // ou buscar da configuração
        if (!USAR_SUPABASE || typeof window.supabaseDB === 'undefined') {
            alert('❌ Erro: Sistema de banco de dados não disponível.');
            console.error('❌ Supabase não está configurado');
            return;
        }

        // Executar a exclusão
        console.log('🗑️ Executando exclusão...');
        const resultado = await window.supabaseDB.apagarTransacao(id, valor);

        if (!resultado || !resultado.sucesso) {
            throw new Error(resultado?.erro || 'Erro desconhecido ao apagar transação');
        }

        // Sucesso!
        console.log('✅ Transação apagada com sucesso!');
        console.log('   • Saldo anterior:', resultado.saldoAnterior);
        console.log('   • Saldo novo:', resultado.saldoNovo);

        // Limpar localStorage
        localStorage.removeItem('movimentoSelecionado');

        // Mostrar mensagem de sucesso
        alert(
            `✅ Transação apagada com sucesso!\n\n` +
            `💰 Saldo revertido:\n` +
            `   De: ${resultado.saldoAnterior.toFixed(2)} EUR\n` +
            `   Para: ${resultado.saldoNovo.toFixed(2)} EUR\n\n` +
            `Redirecionando para Movimentos...`
        );

        // Aguardar um momento e redirecionar
        setTimeout(() => {
            window.location.href = 'movimentos.html';
        }, 500);

    } catch (error) {
        console.error('❌ ERRO ao apagar transação:', error);
        alert(
            `❌ Erro ao apagar transação!\n\n` +
            `${error.message}\n\n` +
            `Por favor, tente novamente ou contate o suporte.`
        );
    }
}

// Marcar que está navegando no site
sessionStorage.setItem('isNavigating', 'true');

// Inicializar ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    carregarDetalhes();
    
    // Event listener para botão de apagar
    const btnApagarTransacao = document.getElementById('btnApagarTransacao');
    if (btnApagarTransacao) {
        btnApagarTransacao.addEventListener('click', apagarTransacao);
        console.log('✅ Botão de apagar transação conectado');
    }
});

console.log('✅ Detalhes do movimento prontos');

// Loading Modal
window.addEventListener('load', () => {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        setTimeout(() => {
            loadingModal.classList.add('hidden');
        }, 1000);
    }
});
