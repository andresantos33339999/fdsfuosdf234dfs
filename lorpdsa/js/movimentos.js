// Página de Movimentos
const USAR_SUPABASE = true;

// Estado
let saldo = 0;
let movimentos = [];
let saldoOculto = false;

// Formatadores
const fmtMoeda = (v) => {
    const valor = Math.abs(v).toFixed(2).replace('.', ',');
    const sinal = v < 0 ? '-' : '';
    return {
        completo: `${sinal}${valor} EUR`,
        valor: `${sinal}${valor}`,
        moeda: 'EUR'
    };
};

const fmtData = (dataStr) => {
    const data = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    // Normalizar datas para comparação (zerar horas)
    const dataCompare = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const hojeCompare = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const ontemCompare = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
    
    if (dataCompare.getTime() === hojeCompare.getTime()) {
        return 'Hoje';
    } else if (dataCompare.getTime() === ontemCompare.getTime()) {
        return 'Ontem';
    } else {
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = data.toLocaleString('pt-PT', { month: 'short' });
        return `${dia}-${mes}`;
    }
};

const fmtHora = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleTimeString('pt-PT', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

// Função para obter ícone baseado na descrição
function obterIcone(descricao) {
    // Retorna sempre o mesmo ícone personalizado
    return {
        tipo: 'image',
        conteudo: 'images/discount-label-price-svgrepo-com.png'
    };
}

// Função para obter tipo baseado no valor
function obterTipo(valor) {
    if (valor > 0) return 'positivo';
    if (valor < 0) return 'negativo';
    return 'neutro';
}

// Carregar movimentos do Supabase
async function carregarMovimentos() {
    console.log('📊 Carregando movimentos...');
    
    if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
        try {
            // Buscar saldo
            const saldoDB = await window.supabaseDB.buscarSaldo();
            if (saldoDB !== null) {
                saldo = saldoDB;
                atualizarSaldoUI();
            }
            
            // Buscar transações
            const transacoesDB = await window.supabaseDB.buscarTransacoes();
            
            if (transacoesDB && transacoesDB.length > 0) {
                // Ordenar por data (mais recente primeiro)
                movimentos = transacoesDB
                    .map(t => ({
                        id: t.id,
                        descricao: t.descricao,
                        valor: parseFloat(t.valor),
                        data: t.created_at
                    }))
                    .sort((a, b) => new Date(b.data) - new Date(a.data));
                
                console.log(`✅ ${movimentos.length} movimentos carregados`);
                renderizarMovimentos();
            } else {
                mostrarMensagemVazia();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar movimentos:', error);
            mostrarErro();
        }
    } else {
        console.log('💾 Modo local - sem movimentos');
        mostrarMensagemVazia();
    }
}

// Atualizar saldo na UI
function atualizarSaldoUI() {
    const saldoElement = document.getElementById('saldoValor');
    if (saldoElement) {
        if (saldoOculto) {
            saldoElement.textContent = '••• •••';
            saldoElement.classList.add('oculto');
        } else {
            saldoElement.textContent = fmtMoeda(saldo).completo;
            saldoElement.classList.remove('oculto');
        }
    }
}

// Toggle saldo
function toggleSaldo() {
    saldoOculto = !saldoOculto;
    
    const iconeOlho = document.querySelector('.icone-olho');
    const iconeOlhoCortado = document.querySelector('.icone-olho-cortado');
    
    if (saldoOculto) {
        iconeOlho.style.display = 'none';
        iconeOlhoCortado.style.display = 'block';
    } else {
        iconeOlho.style.display = 'block';
        iconeOlhoCortado.style.display = 'none';
    }
    
    atualizarSaldoUI();
}

// Renderizar movimentos
function renderizarMovimentos() {
    const container = document.getElementById('movimentosLista');
    container.innerHTML = '';
    
    // Agrupar por data
    const grupos = {};
    let saldoAcumulado = 0;
    
    // Primeiro, calcular saldo inicial (antes de todas as transações)
    const saldoInicial = saldo - movimentos.reduce((acc, m) => acc + m.valor, 0);
    saldoAcumulado = saldoInicial;
    
    // Processar movimentos do mais antigo ao mais recente para calcular saldo correto
    const movimentosComSaldo = [...movimentos]
        .reverse()
        .map(m => {
            saldoAcumulado += m.valor;
            return {
                ...m,
                saldoApos: saldoAcumulado
            };
        })
        .reverse(); // Voltar para mais recente primeiro
    
    // Agrupar por data
    movimentosComSaldo.forEach(movimento => {
        const dataLabel = fmtData(movimento.data);
        if (!grupos[dataLabel]) {
            grupos[dataLabel] = [];
        }
        grupos[dataLabel].push(movimento);
    });
    
    // Renderizar grupos
    Object.entries(grupos).forEach(([dataLabel, movimentosGrupo]) => {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'data-grupo';
        
        const dataLabelDiv = document.createElement('div');
        dataLabelDiv.className = 'data-label';
        dataLabelDiv.textContent = dataLabel;
        grupoDiv.appendChild(dataLabelDiv);
        
        movimentosGrupo.forEach(movimento => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'movimento-item';
            
            const tipo = obterTipo(movimento.valor);
            const iconeObj = obterIcone(movimento.descricao);
            const valorFmt = fmtMoeda(movimento.valor);
            const saldoFmt = fmtMoeda(movimento.saldoApos);
            
            // Renderizar ícone como imagem ou emoji
            const iconeHTML = iconeObj.tipo === 'image' 
                ? `<img src="${iconeObj.conteudo}" alt="Ícone" style="width: 24px; height: 24px; object-fit: contain;">`
                : iconeObj.conteudo;
            
            itemDiv.innerHTML = `
                <div class="movimento-icon ${tipo}">
                    ${iconeHTML}
                </div>
                <div class="movimento-info">
                    <div class="movimento-descricao">${movimento.descricao}</div>
                    
                </div>
                <div class="movimento-valores">
                    <div class="movimento-valor ${tipo}">
                        <span class="movimento-valor-numero">${valorFmt.valor}</span>
                        <span class="movimento-valor-moeda-normal">${valorFmt.moeda}</span>
                    </div>
                    <div class="movimento-saldo-apos">
                        ${saldoFmt.valor}
                    </div>
                </div>
            `;
            
            // Adicionar evento de clique para abrir detalhes
            itemDiv.addEventListener('click', () => {
                abrirDetalhesMovimento(movimento);
            });
            
            grupoDiv.appendChild(itemDiv);
        });
        
        container.appendChild(grupoDiv);
    });
}

// Mostrar mensagem vazia
function mostrarMensagemVazia() {
    const container = document.getElementById('movimentosLista');
    container.innerHTML = `
        <div class="mensagem-vazia">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <h3>Sem movimentos</h3>
            <p>Ainda não há movimentos registrados nesta conta.</p>
        </div>
    `;
}

// Mostrar erro
function mostrarErro() {
    const container = document.getElementById('movimentosLista');
    container.innerHTML = `
        <div class="mensagem-vazia">
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar os movimentos. Tente novamente mais tarde.</p>
        </div>
    `;
}

// Função para abrir detalhes do movimento
function abrirDetalhesMovimento(movimento) {
    console.log('🔍 Abrindo detalhes do movimento:', movimento);
    
    // Salvar movimento no localStorage
    localStorage.setItem('movimentoSelecionado', JSON.stringify(movimento));
    
    // Redirecionar para página de detalhes
    window.location.href = 'detalhes-movimento.html';
}

// Event Listeners
document.getElementById('btnToggleSaldo').addEventListener('click', toggleSaldo);

// Botão central do menu flutuante - Redireciona para página inicial
const btnFloatingCenter = document.getElementById("btnFloatingCenter");
if (btnFloatingCenter) {
    btnFloatingCenter.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// Inicializar
console.log('🚀 Página de Movimentos inicializada');
carregarMovimentos();
