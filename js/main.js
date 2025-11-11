// Dados da aplicação
let saldo = 0;
let transacoes = [];
let perfilUsuario = {
    nome: 'João',
    avatarUrl: 'images/IMG_3008.JPG'
};

// Configuração: ativar para usar Supabase
const USAR_SUPABASE = true;

// Formatador de moeda (retorna objeto com valor e moeda separados)
const fmt = v => {
    const valor = Math.abs(v).toFixed(2).replace('.', ',');
    const sinal = v < 0 ? '-' : '+';
    return {
        completo: `${sinal}${valor} EUR`,
        valor: `${sinal}${valor}`,
        moeda: 'EUR'
    };
};

// Formatador de data
const fmtData = (dataStr) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
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
        return `${dia} ${mes}`;
    }
};

// Função para obter nome do mês anterior
function getMesAnterior() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const hoje = new Date();
    const mesPassado = hoje.getMonth() - 1;
    const mesIndex = mesPassado < 0 ? 11 : mesPassado;
    return meses[mesIndex];
}

// Função para determinar categoria baseada na descrição
function determinarCategoria(descricao) {
    // Retorna sempre "Diversos" com ícone de imagem
    return { 
        nome: 'Diversos', 
        icone: 'images/discount-label-price-svgrepo-com.png', 
        cor: 'amarelo',
        isImage: true  // Flag para indicar que é imagem
    };
}

// Função para renderizar despesas do mês
function renderDespesasMes() {
    console.log('📊 Renderizando despesas do mês...');
    console.log('Total de transações:', transacoes.length);
    
    // Atualizar título com mês anterior
    const mesTitulo = getMesAnterior();
    const tituloElement = document.getElementById('tituloMesDespesas');
    if (tituloElement) {
        tituloElement.textContent = `Despesas em ${mesTitulo}`;
    }

    // Filtrar transações do mês passado (apenas negativas = despesas)
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const inicioMesPassado = new Date(mesPassado.getFullYear(), mesPassado.getMonth(), 1);
    const fimMesPassado = new Date(mesPassado.getFullYear(), mesPassado.getMonth() + 1, 0);

    console.log('Período:', inicioMesPassado.toLocaleDateString(), 'até', fimMesPassado.toLocaleDateString());

    const despesasMes = transacoes.filter(t => {
        if (t.valor >= 0 || !t.data) return false; // Apenas valores negativos (despesas)
        
        const dataTransacao = new Date(t.data);
        return dataTransacao >= inicioMesPassado && dataTransacao <= fimMesPassado;
    });
    
    console.log('Despesas encontradas no mês passado:', despesasMes.length);
    
    // Se não houver despesas do mês passado, mostrar dos últimos 30 dias
    if (despesasMes.length === 0) {
        console.log('⚠️ Nenhuma despesa no mês passado. Mostrando últimos 30 dias...');
        const ultimosTrintaDias = new Date();
        ultimosTrintaDias.setDate(ultimosTrintaDias.getDate() - 30);
        
        const despesasRecentes = transacoes.filter(t => {
            if (t.valor >= 0 || !t.data) return false;
            const dataTransacao = new Date(t.data);
            return dataTransacao >= ultimosTrintaDias;
        });
        
        console.log('Despesas dos últimos 30 dias:', despesasRecentes.length);
        despesasMes.push(...despesasRecentes);
    }

    // Agrupar por categoria
    const categorias = {};
    let totalDespesas = 0;

    despesasMes.forEach(t => {
        const categoria = determinarCategoria(t.desc);
        const valor = Math.abs(t.valor);
        
        if (!categorias[categoria.nome]) {
            categorias[categoria.nome] = {
                nome: categoria.nome,
                icone: categoria.icone,
                cor: categoria.cor,
                isImage: categoria.isImage || false,
                total: 0
            };
        }
        
        categorias[categoria.nome].total += valor;
        totalDespesas += valor;
    });

    // Converter para array e ordenar por valor
    const categoriasArray = Object.values(categorias).sort((a, b) => b.total - a.total);

    // Renderizar
    const container = document.getElementById('despesasContainer');
    if (!container) return;
    
    if (categoriasArray.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #a0a8c0;">
                <p>Sem despesas registadas em ${mesTitulo}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    // Mostrar top 3 categorias
    categoriasArray.slice(0, 3).forEach(cat => {
        const percentagem = ((cat.total / totalDespesas) * 52.45).toFixed(2);
        const valorFormatado = cat.total.toFixed(2).replace('.', ',');
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'despesa-item';
        
        // Determinar como renderizar o ícone
        const iconeHTML = cat.isImage 
            ? `<img src="${cat.icone}" alt="${cat.nome}" style="width: 32px; height: 32px; object-fit: contain;">` 
            : cat.icone;
        
        itemDiv.innerHTML = `
            <div class="despesa-icon ${cat.cor}">
                ${iconeHTML}
            </div>
            <div class="despesa-info">
                <div class="despesa-header">
                    <span class="despesa-nome">${cat.nome}</span>
                    <div class="despesa-valores">
                        <span class="despesa-percentagem">${percentagem}%</span>
                        <span class="despesa-valor">${valorFormatado}</span>
                        <span class="despesa-valor-moeda">EUR</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${cat.cor}" style="width: ${percentagem}%"></div>
                </div>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

// Atualizar interface (com Supabase)
async function atualizarUI() {
    if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
        try {
            // Buscar transações do Supabase
            const transacoesDB = await window.supabaseDB.buscarTransacoes();
            if (transacoesDB && transacoesDB.length > 0) {
                transacoes = transacoesDB.map(t => ({
                    id: t.id,
                    desc: t.descricao,
                    valor: parseFloat(t.valor),
                    data: t.created_at
                }));
                
                // Ordenar por data decrescente (mais recentes primeiro)
                transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
                console.log('📋 Transações ordenadas:', transacoes.length);
                console.log('🕒 Mais recente:', transacoes[0]?.desc, transacoes[0]?.data);
            }
            
            // Buscar saldo do Supabase
            const saldoDB = await window.supabaseDB.buscarSaldo();
            if (saldoDB !== null) {
                saldo = saldoDB;
            } else {
                saldo = transacoes.reduce((acc, t) => acc + t.valor, 0);
            }
        } catch (error) {
            console.error('Erro ao buscar dados do Supabase:', error);
            saldo = transacoes.reduce((acc, t) => acc + t.valor, 0);
        }
    } else {
        saldo = transacoes.reduce((acc, t) => acc + t.valor, 0);
    }
    
    renderTransacoes();
    atualizarSaldoUI();
    renderDespesasMes();
}

// Atualizar o valor do saldo na interface
function atualizarSaldoUI() {
    const saldoElement = document.querySelector('.saldo-valor');
    if (saldoElement) {
        const valorFormatado = saldo.toFixed(2).replace('.', ',');
        saldoElement.innerHTML = `
            <span class="saldo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="5" y1="19" x2="19" y2="5"></line>
                </svg>
            </span>
            ${valorFormatado}<span class="saldo-moeda">EUR</span>
        `;
    }
}
        function renderTransacoes() {
            const lista = document.getElementById("txList");
            lista.innerHTML = '';
            
            // Pegar as 3 transações mais recentes (já ordenadas por data decrescente)
            const ultimasTransacoes = transacoes.slice(0, 3);
            
            console.log('🎯 Renderizando últimas 3 transações:');
            ultimasTransacoes.forEach((tx, i) => {
                console.log(`  ${i+1}. ${tx.desc} - ${tx.valor} - ${tx.data}`);
                
                const el = document.createElement('div');
                el.className = 'tx';
                el.style.cursor = 'pointer';
                const valorFormatado = fmt(tx.valor);
                const tipoValor = tx.valor < 0 ? 'neg' : 'pos';
                el.innerHTML = `
                    <div class="tx-info">
                        <div class="tx-desc">${tx.desc}</div>
                        <div class="tx-data">${fmtData(tx.data)}</div>
                    </div>
                    <div class="tx-valor ${tipoValor}">
                        <span class="tx-valor-numero">${valorFormatado.valor}</span>
                        <span class="tx-valor-moeda">${valorFormatado.moeda}</span>
                    </div>
                `;
                
                // Adicionar event listener para abrir detalhes
                el.addEventListener('click', () => {
                    console.log('🔍 Abrindo detalhes da transação:', tx);
                    
                    // Criar objeto de movimento para salvar
                    const movimento = {
                        id: tx.id,
                        descricao: tx.desc,
                        valor: tx.valor,
                        data: tx.data
                    };
                    
                    // Salvar no localStorage
                    localStorage.setItem('movimentoSelecionado', JSON.stringify(movimento));
                    
                    // Redirecionar para página de detalhes
                    window.location.href = 'detalhes-movimento.html';
                });
                
                lista.appendChild(el);
            });
        }

        /* MB WAY Modal */
        const modal = document.getElementById("modalMB");
        const menu = document.getElementById("mbMenu");
        const formEnvio = document.getElementById("formEnvio");
        const formReceber = document.getElementById("formReceber");

        function abrirModal() { 
            modal.classList.add("show"); 
        }
        
        function fecharModal() { 
            modal.classList.remove("show"); 
            menu.style.display = "block"; 
            formEnvio.style.display = "none"; 
            formReceber.style.display = "none";
        }
        
        function voltarMenu() { 
            menu.style.display = "block"; 
            formEnvio.style.display = "none"; 
            formReceber.style.display = "none";
        }

        document.getElementById("btnMBWay").addEventListener("click", abrirModal);

        menu.querySelectorAll("button[data-opcao]").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.dataset.opcao === "enviar") {
                    menu.style.display = "none";
                    formEnvio.style.display = "block";
                } else if (btn.dataset.opcao === "receber") {
                    menu.style.display = "none";
                    formReceber.style.display = "block";
                }
            });
        });

        document.getElementById("btnEnviarDinheiro").addEventListener("click", async () => {
            const dest = document.getElementById("destinatario").value.trim();
            const val = parseFloat(document.getElementById("valorEnvio").value);
            
            if (!dest || isNaN(val) || val <= 0) {
                return alert("Preencha corretamente os campos.");
            }
            
            if (val > saldo) {
                return alert("Saldo insuficiente.");
            }
            
            const descricao = ` ${dest}`;
            
            // Salvar no Supabase se estiver ativo
            if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
                try {
                    console.log('💸 ENVIAR DINHEIRO MB WAY - Iniciando...');
                    console.log(`   Destinatário: ${dest}`);
                    console.log(`   Valor: -${val}€`);
                    console.log(`   Saldo ANTES: ${saldo}€`);
                    
                    // PASSO 1: Calcular novo saldo
                    const novoSaldo = saldo - val;
                    
                    // PASSO 2: Adicionar transação completa com detalhes
                    console.log('📝 Salvando transação completa com detalhes...');
                    await window.supabaseDB.adicionarTransacaoCompleta(descricao, -val, novoSaldo);
                    console.log('✅ Transação e detalhes salvos!');
                    
                    // PASSO 3: Atualizar saldo no banco
                    console.log(`💳 Atualizando saldo: ${saldo}€ - ${val}€ = ${novoSaldo}€`);
                    await window.supabaseDB.atualizarSaldo(novoSaldo);
                    console.log('✅ Saldo atualizado!');
                    
                    console.log('✅ ENVIO CONCLUÍDO COM SUCESSO!');
                } catch (error) {
                    console.error('❌ ERRO ao enviar dinheiro:', error);
                    alert('⚠️ Erro ao salvar no banco de dados. Tente novamente.');
                    return;
                }
            } else {
                // Modo local
                transacoes.push({ desc: descricao, valor: -val, data: new Date().toISOString() });
            }
            
            await atualizarUI();
            alert(`💸 Dinheiro enviado com sucesso para ${dest} no valor de ${fmt(val).completo}.`);
            fecharModal();
            
            // Limpar campos
            document.getElementById("destinatario").value = '';
            document.getElementById("valorEnvio").value = '';
        });

        // Função para receber transferência
        document.getElementById("btnReceberDinheiro").addEventListener("click", async () => {
            const remetente = document.getElementById("remetente").value.trim();
            const val = parseFloat(document.getElementById("valorReceber").value);
            
            if (!remetente || isNaN(val) || val === 0) {
                return alert("Preencha corretamente os campos. O valor não pode ser zero.");
            }
            
            let descricao;
            let tipoTransacao;
            
            if (val > 0) {
                descricao = `${remetente}`;
                tipoTransacao = "recebida";
            } else {
                descricao = `${remetente}`;
                tipoTransacao = "estorno";
            }
            
            // Salvar no Supabase se estiver ativo
            if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
                try {
                    console.log('💰 RECEBER TRANSFERÊNCIA - Iniciando...');
                    console.log(`   Remetente: ${remetente}`);
                    console.log(`   Valor: ${val}€`);
                    console.log(`   Saldo ANTES: ${saldo}€`);
                    
                    // PASSO 1: Calcular novo saldo
                    const novoSaldo = saldo + val;
                    
                    // PASSO 2: Adicionar transação completa com detalhes
                    console.log('📝 Salvando transação completa com detalhes...');
                    await window.supabaseDB.adicionarTransacaoCompleta(descricao, val, novoSaldo);
                    console.log('✅ Transação e detalhes salvos!');
                    
                    // PASSO 3: Atualizar saldo no banco
                    console.log(`💳 Atualizando saldo: ${saldo}€ + ${val}€ = ${novoSaldo}€`);
                    await window.supabaseDB.atualizarSaldo(novoSaldo);
                    console.log('✅ Saldo atualizado na base de dados!');
                    
                    console.log('✅ TRANSFERÊNCIA RECEBIDA COM SUCESSO!');
                } catch (error) {
                    console.error('❌ ERRO ao receber transferência:', error);
                    alert('⚠️ Erro ao salvar no banco de dados. Tente novamente.');
                    return;
                }
            } else {
                // Modo local
                console.log('💾 Modo local - Adicionando transação localmente');
                transacoes.push({ desc: descricao, valor: val, data: new Date().toISOString() });
            }
            
            await atualizarUI();
            
            if (val > 0) {
                alert(`💰 Transferência recebida de ${remetente} no valor de ${fmt(val).completo}!`);
            } else {
                alert(`↩️ Devolução/Estorno processado para ${remetente} no valor de ${fmt(Math.abs(val)).completo}.`);
            }
            
            fecharModal();
            
            // Limpar campos
            document.getElementById("remetente").value = '';
            document.getElementById("valorReceber").value = '';
        });

        // ========================================
        // MODAL TRANSFERIR
        // ========================================
        
        const modalTransferir = document.getElementById("modalTransferir");
        
        function abrirModalTransferir() {
            modalTransferir.classList.add("show");
        }
        
        function fecharModalTransferir() {
            modalTransferir.classList.remove("show");
            // Limpar campos
            document.getElementById("ibanDestino").value = '';
            document.getElementById("nomeBeneficiario").value = '';
            document.getElementById("valorTransferencia").value = '';
            document.getElementById("descricaoTransferencia").value = '';
        }
        
        document.getElementById("btnTransferir").addEventListener("click", abrirModalTransferir);
        
        document.getElementById("btnConfirmarTransferencia").addEventListener("click", async () => {
            const iban = document.getElementById("ibanDestino").value.trim();
            const beneficiario = document.getElementById("nomeBeneficiario").value.trim();
            const val = parseFloat(document.getElementById("valorTransferencia").value);
            const descOpcional = document.getElementById("descricaoTransferencia").value.trim();
            
            if (!iban || !beneficiario || isNaN(val) || val <= 0) {
                return alert("Preencha todos os campos obrigatórios!");
            }
            
            if (val > saldo) {
                return alert("Saldo insuficiente para realizar a transferência.");
            }
            
            const descricao = descOpcional 
                ? `Transferência para ${beneficiario} - ${descOpcional}`
                : `Transferência para ${beneficiario}`;
            
            // Salvar no Supabase
            if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
                try {
                    console.log('🏦 TRANSFERÊNCIA BANCÁRIA - Iniciando...');
                    console.log(`   Beneficiário: ${beneficiario}`);
                    console.log(`   IBAN: ${iban}`);
                    console.log(`   Valor: -${val}€`);
                    console.log(`   Saldo ANTES: ${saldo}€`);
                    
                    // PASSO 1: Calcular novo saldo
                    const novoSaldo = saldo - val;
                    
                    // PASSO 2: Adicionar transação completa com detalhes
                    console.log('📝 Salvando transação completa com detalhes...');
                    await window.supabaseDB.adicionarTransacaoCompleta(descricao, -val, novoSaldo);
                    console.log('✅ Transação e detalhes salvos!');
                    
                    // PASSO 3: Atualizar saldo
                    console.log(`💳 Atualizando saldo: ${saldo}€ - ${val}€ = ${novoSaldo}€`);
                    await window.supabaseDB.atualizarSaldo(novoSaldo);
                    console.log('✅ Saldo atualizado!');
                    
                    console.log('✅ TRANSFERÊNCIA CONCLUÍDA!');
                } catch (error) {
                    console.error('❌ ERRO na transferência:', error);
                    alert('⚠️ Erro ao processar transferência. Tente novamente.');
                    return;
                }
            } else {
                transacoes.push({ desc: descricao, valor: -val, data: new Date().toISOString() });
            }
            
            await atualizarUI();
            alert(`✅ Transferência de ${fmt(val).completo} para ${beneficiario} realizada com sucesso!`);
            fecharModalTransferir();
        });

        // ========================================
        // MODAL PAGAMENTOS
        // ========================================
        
        const modalPagamentos = document.getElementById("modalPagamentos");
        
        function abrirModalPagamentos() {
            modalPagamentos.classList.add("show");
        }
        
        function fecharModalPagamentos() {
            modalPagamentos.classList.remove("show");
            // Limpar campos
            document.getElementById("entidade").value = '';
            document.getElementById("referencia").value = '';
            document.getElementById("valorPagamento").value = '';
            document.getElementById("descricaoPagamento").value = '';
        }
        
        document.getElementById("btnPagamentos").addEventListener("click", abrirModalPagamentos);
        
        document.getElementById("btnConfirmarPagamento").addEventListener("click", async () => {
            const entidade = document.getElementById("entidade").value.trim();
            const referencia = document.getElementById("referencia").value.trim();
            const val = parseFloat(document.getElementById("valorPagamento").value);
            const descPagamento = document.getElementById("descricaoPagamento").value.trim();
            
            if (!entidade || !referencia || isNaN(val) || val <= 0 || !descPagamento) {
                return alert("Preencha todos os campos!");
            }
            
            if (val > saldo) {
                return alert("Saldo insuficiente para realizar o pagamento.");
            }
            
            const descricao = `Pagamento ${descPagamento} - Ent: ${entidade} Ref: ${referencia}`;
            
            // Salvar no Supabase
            if (USAR_SUPABASE && typeof window.supabaseDB !== 'undefined') {
                try {
                    console.log('🧾 PAGAMENTO DE SERVIÇO - Iniciando...');
                    console.log(`   Descrição: ${descPagamento}`);
                    console.log(`   Entidade: ${entidade}`);
                    console.log(`   Referência: ${referencia}`);
                    console.log(`   Valor: -${val}€`);
                    console.log(`   Saldo ANTES: ${saldo}€`);
                    
                    // PASSO 1: Calcular novo saldo
                    const novoSaldo = saldo - val;
                    
                    // PASSO 2: Adicionar transação completa com detalhes
                    console.log('📝 Salvando transação completa com detalhes...');
                    await window.supabaseDB.adicionarTransacaoCompleta(descricao, -val, novoSaldo);
                    console.log('✅ Transação e detalhes salvos!');
                    
                    // PASSO 3: Atualizar saldo
                    console.log(`💳 Atualizando saldo: ${saldo}€ - ${val}€ = ${novoSaldo}€`);
                    await window.supabaseDB.atualizarSaldo(novoSaldo);
                    console.log('✅ Saldo atualizado!');
                    
                    console.log('✅ PAGAMENTO CONCLUÍDO!');
                } catch (error) {
                    console.error('❌ ERRO no pagamento:', error);
                    alert('⚠️ Erro ao processar pagamento. Tente novamente.');
                    return;
                }
            } else {
                transacoes.push({ desc: descricao, valor: -val, data: new Date().toISOString() });
            }
            
            await atualizarUI();
            alert(`✅ Pagamento de ${fmt(val).completo} processado com sucesso!\nEntidade: ${entidade}\nReferência: ${referencia}`);
            fecharModalPagamentos();
        });

        /* Ver Tudo - Redireciona para página de movimentos */
        document.getElementById("btnVerTudo").addEventListener("click", () => {
            window.location.href = "movimentos.html";
        });

        // Botão Ver Despesas
        document.getElementById("btnVerDespesas").addEventListener("click", () => {
            window.location.href = "movimentos.html";
        });

        // Botão Criar Dados Simulados
        document.getElementById("btnDadosSimulados").addEventListener("click", async () => {
            const confirmar = confirm('🎲 Criar dados simulados?\n\nIsso irá adicionar 28 transações de teste no Supabase.');
            if (confirmar) {
                await criarDadosSimulados();
            }
        });

        // Botão central do menu flutuante - Abre MB Way
        const btnFloatingCenter = document.getElementById("btnFloatingCenter");
        if (btnFloatingCenter) {
            btnFloatingCenter.addEventListener("click", () => {
                modal.style.display = "flex";
            });
        }

        // Inicializar aplicação
        inicializarApp();

// ========================================
// 🗄️ INTEGRAÇÃO COM SUPABASE
// ========================================

// Inicializar dados no Supabase se necessário
async function inicializarDadosSupabase() {
    if (!USAR_SUPABASE || typeof window.supabaseDB === 'undefined') {
        return;
    }
    
    try {
        // Verificar se já existem transações
        const transacoesExistentes = await window.supabaseDB.buscarTransacoes();
        
        if (!transacoesExistentes || transacoesExistentes.length === 0) {
            console.log('📦 Inicializando dados no Supabase...');
            
            // Adicionar transações iniciais
            for (const tx of transacoes) {
                await window.supabaseDB.adicionarTransacao(tx.desc, tx.valor);
            }
            
            // Definir saldo inicial
            await window.supabaseDB.atualizarSaldo(saldo);
            
            console.log('✅ Dados iniciais criados no Supabase');
        }
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
    }
}

// Função para criar dados simulados
async function criarDadosSimulados() {
    if (!USAR_SUPABASE || typeof window.supabaseDB === 'undefined') {
        console.log('❌ Supabase não disponível');
        return;
    }
    
    console.log('🎲 Criando dados simulados...');
    
    try {
        // Data base: mês passado
        const hoje = new Date();
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        
        // Transações simuladas do mês passado
        const transacoesSimuladas = [
            // Diversos (Amarelo)
            { desc: 'Compra Online Amazon', valor: -89.99, diasAtras: 5 },
            { desc: 'Loja de Roupa', valor: -150.00, diasAtras: 8 },
            { desc: 'Farmácia', valor: -45.50, diasAtras: 12 },
            { desc: 'Presente Aniversário', valor: -80.00, diasAtras: 15 },
            { desc: 'Diversos Despesas', valor: -120.00, diasAtras: 20 },
            
            // Serviços (Azul)
            { desc: 'Pagamento Conta de Água', valor: -35.80, diasAtras: 3 },
            { desc: 'Conta de Luz EDP', valor: -67.50, diasAtras: 7 },
            { desc: 'Internet NOS', valor: -42.90, diasAtras: 10 },
            { desc: 'Conta de Gás', valor: -28.00, diasAtras: 14 },
            
            // Alimentação (Laranja)
            { desc: 'Compras Supermercado Continente', valor: -125.60, diasAtras: 2 },
            { desc: 'Supermercado Pingo Doce', valor: -98.40, diasAtras: 6 },
            { desc: 'Mercado de Frutas', valor: -32.50, diasAtras: 9 },
            { desc: 'Padaria', valor: -15.80, diasAtras: 11 },
            { desc: 'Comida Delivery', valor: -28.90, diasAtras: 16 },
            
            // Transporte (Verde)
            { desc: 'Gasolina BP', valor: -65.00, diasAtras: 4 },
            { desc: 'Combustível Repsol', valor: -70.00, diasAtras: 13 },
            { desc: 'Estacionamento', valor: -12.50, diasAtras: 17 },
            { desc: 'Transporte Público', valor: -40.00, diasAtras: 21 },
            
            // Entretenimento (Roxo)
            { desc: 'Cinema NOS', valor: -18.50, diasAtras: 1 },
            { desc: 'Restaurante Jantar', valor: -45.00, diasAtras: 5 },
            { desc: 'Netflix Subscrição', valor: -13.99, diasAtras: 10 },
            { desc: 'Spotify Premium', valor: -9.99, diasAtras: 15 },
            { desc: 'Lazer Bowling', valor: -35.00, diasAtras: 18 },
            
            // Receitas (valores positivos)
            { desc: 'Transferência recebida de Maria', valor: 100.00, diasAtras: 2 },
            { desc: 'Salário', valor: 1200.00, diasAtras: 1 },
            { desc: 'Freelance Projeto', valor: 350.00, diasAtras: 10 }
        ];
        
        // Adicionar cada transação com data do mês passado
        for (const tx of transacoesSimuladas) {
            const dataTransacao = new Date(mesPassado);
            dataTransacao.setDate(dataTransacao.getDate() + tx.diasAtras);
            
            await window.supabaseDB.adicionarTransacao(tx.desc, tx.valor);
            console.log(`✅ Adicionado: ${tx.desc} - ${tx.valor}€`);
            
            // Pequeno delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Calcular e definir saldo final
        const saldoFinal = transacoesSimuladas.reduce((acc, tx) => acc + tx.valor, 0);
        await window.supabaseDB.atualizarSaldo(saldoFinal);
        
        console.log(`✅ ${transacoesSimuladas.length} transações criadas!`);
        console.log(`💰 Saldo final: ${saldoFinal.toFixed(2)}€`);
        
        // Atualizar interface
        await atualizarUI();
        
        alert('✅ Dados simulados criados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao criar dados simulados:', error);
        alert('❌ Erro ao criar dados simulados. Veja o console.');
    }
}

// Expor função para o console
window.criarDadosSimulados = criarDadosSimulados;

// Função principal de inicialização
async function inicializarApp() {
    console.log('🚀 Inicializando aplicação...');
    
    if (USAR_SUPABASE) {
        console.log('🗄️ Modo Supabase ATIVADO');
        console.log('💡 Para criar dados simulados, execute: criarDadosSimulados()');
        
        // Aguardar um momento para garantir que o Supabase está carregado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Inicializar dados se necessário
        await inicializarDadosSupabase();
    } else {
        console.log('💾 Modo Local ATIVADO');
    }
    
    // Atualizar interface
    await atualizarUI();
    
    // Carregar número de conta do localStorage
    carregarNumeroConta();
    
    console.log('✅ Aplicação iniciada com sucesso!');
}

// Carregar número de conta do localStorage
function carregarNumeroConta() {
    const numero13 = localStorage.getItem('numeroConta13');
    
    if (numero13) {
        const contaNomeElement = document.querySelector('.conta-nome');
        if (contaNomeElement) {
            contaNomeElement.textContent = `Caixa Jovem Extracto - ${numero13}`;
            console.log('✅ Número de conta carregado:', numero13);
        }
    }
}

// Função de teste da conexão Supabase
async function testarSupabase() {
    if (typeof window.supabaseDB === 'undefined') {
        console.error('❌ Supabase não está carregado');
        return;
    }
    
    console.log('🧪 Testando conexão Supabase...');
    
    // Teste 1: Buscar transações
    const txs = await window.supabaseDB.buscarTransacoes();
    console.log('📊 Transações no DB:', txs);
    
    // Teste 2: Buscar saldo
    const saldoDB = await window.supabaseDB.buscarSaldo();
    console.log('💰 Saldo no DB:', saldoDB);
    
    console.log('✅ Teste concluído! Veja o console para resultados.');
}

// Descomente a linha abaixo para testar a conexão ao carregar a página:
// setTimeout(testarSupabase, 1000);

// Intro Screen
function checkIntroViewed() {
    const introScreen = document.getElementById('introScreen');
    const introVideo = document.getElementById('introVideo');
    
    if (!introScreen) return;
    
    // Verifica se já está navegando no site (sessionStorage)
    const isNavigating = sessionStorage.getItem('isNavigating');
    
    // Se já está navegando, esconde intro imediatamente
    if (isNavigating === 'true') {
        console.log('🔄 Navegando no site, pulando intro...');
        introScreen.style.display = 'none';
        return;
    }
    
    // Primeira entrada no site - mostra intro
    console.log('🎬 Primeira entrada no site! Mostrando intro...');
    
    // Função para fechar a intro
    function closeIntro() {
        console.log('🎯 Fechando intro...');
        introScreen.classList.add('fade-out');
        
        setTimeout(() => {
            introScreen.style.display = 'none';
            // Marca que agora está navegando no site
            sessionStorage.setItem('isNavigating', 'true');
            console.log('✅ Intro fechada, navegação ativa');
        }, 500);
    }
    
    // GIF toca automaticamente, então apenas fecha após 3.5 segundos
    if (introVideo) {
        // Espera o GIF carregar
        introVideo.addEventListener('load', () => {
            console.log('✅ Intro GIF carregado');
        });
        
        // Se houver erro ao carregar
        introVideo.addEventListener('error', () => {
            console.error('❌ Erro ao carregar GIF da intro');
            closeIntro();
        });
        
        // Fecha a intro após 3.5 segundos (duração aproximada do GIF)
        setTimeout(() => {
            console.log('🎬 Intro completa');
            closeIntro();
        }, 2000);
    }
}

// Inicializar intro
checkIntroViewed();

// ==================== PERFIL DO USUÁRIO ====================

// Carregar perfil da base de dados
async function carregarPerfil() {
    if (!USAR_SUPABASE) return;
    
    try {
        const perfil = await window.supabaseDB.buscarPerfil();
        
        if (perfil) {
            perfilUsuario.nome = perfil.nome || 'João';
            perfilUsuario.avatarUrl = perfil.avatar_url || 'images/IMG_3008.JPG';
            
            // Atualizar interface
            atualizarPerfilUI();
            console.log('✅ Perfil carregado:', perfilUsuario);
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Atualizar interface com dados do perfil
function atualizarPerfilUI() {
    // Atualizar nome no topo
    const fraseElement = document.querySelector('.frase');
    if (fraseElement) {
        const periodo = obterPeriodoDoDia();
        fraseElement.textContent = `${periodo}, ${perfilUsuario.nome}`;
    }
    
    // Atualizar avatar
    const fotoElement = document.querySelector('.foto-perfil');
    if (fotoElement) {
        fotoElement.src = perfilUsuario.avatarUrl;
    }
    
    // Atualizar preview do avatar no modal
    const avatarPreview = document.getElementById('avatarPreview');
    if (avatarPreview) {
        avatarPreview.src = perfilUsuario.avatarUrl;
    }
}

// Obter período do dia
function obterPeriodoDoDia() {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Abrir modal de editar nome
function abrirModalEditarNome() {
    const modal = document.getElementById('modalEditarNome');
    const input = document.getElementById('inputNovoNome');
    
    if (modal && input) {
        input.value = perfilUsuario.nome;
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    }
    
    // Fechar modal MB WAY
    fecharModal();
}

// Abrir modal de editar avatar
function abrirModalEditarAvatar() {
    const modal = document.getElementById('modalEditarAvatar');
    const preview = document.getElementById('avatarPreview');
    
    if (modal && preview) {
        preview.src = perfilUsuario.avatarUrl;
        modal.style.display = 'flex';
    }
    
    // Fechar modal MB WAY
    fecharModal();
}

// Fechar modais de perfil
function fecharModalPerfil() {
    document.getElementById('modalEditarNome').style.display = 'none';
    document.getElementById('modalEditarAvatar').style.display = 'none';
}

// Salvar novo nome
async function salvarNome() {
    const input = document.getElementById('inputNovoNome');
    const novoNome = input.value.trim();
    
    if (!novoNome) {
        alert('❌ Por favor, digite um nome válido!');
        return;
    }
    
    if (novoNome.length < 2) {
        alert('❌ O nome deve ter pelo menos 2 caracteres!');
        return;
    }
    
    // Mostrar loading
    const btnSalvar = document.getElementById('btnSalvarNome');
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = '⏳ Salvando...';
    btnSalvar.disabled = true;
    
    try {
        if (USAR_SUPABASE) {
            const resultado = await window.supabaseDB.atualizarNome(novoNome);
            
            if (resultado) {
                perfilUsuario.nome = novoNome;
                atualizarPerfilUI();
                console.log('✅ Nome atualizado com sucesso!');
                
                // Fechar modal
                fecharModalPerfil();
                
                // Mostrar confirmação
                alert(`✅ Nome atualizado para "${novoNome}"!`);
            } else {
                alert('❌ Erro ao atualizar nome. Tente novamente.');
            }
        } else {
            // Modo local
            perfilUsuario.nome = novoNome;
            atualizarPerfilUI();
            fecharModalPerfil();
            alert(`✅ Nome atualizado para "${novoNome}"!`);
        }
    } catch (error) {
        console.error('Erro ao salvar nome:', error);
        alert('❌ Erro ao salvar nome. Tente novamente.');
    } finally {
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// Preview da imagem selecionada
function previewImagem(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('❌ Por favor, selecione uma imagem válida!');
        return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('❌ A imagem deve ter no máximo 5MB!');
        return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('avatarPreview');
        if (preview) {
            preview.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

// Salvar novo avatar
async function salvarAvatar() {
    const input = document.getElementById('inputAvatar');
    const file = input.files[0];
    
    if (!file) {
        alert('❌ Por favor, selecione uma imagem!');
        return;
    }
    
    // Mostrar loading
    const btnSalvar = document.getElementById('btnSalvarAvatar');
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = '⏳ Enviando...';
    btnSalvar.disabled = true;
    
    try {
        if (USAR_SUPABASE) {
            // Tentar upload da imagem
            const urlAvatar = await window.supabaseDB.uploadAvatar(file);
            
            if (urlAvatar && urlAvatar !== 'LOCAL_BASE64') {
                // Upload bem-sucedido - Atualizar no banco
                const resultado = await window.supabaseDB.atualizarAvatar(urlAvatar);
                
                if (resultado) {
                    perfilUsuario.avatarUrl = urlAvatar;
                    atualizarPerfilUI();
                    console.log('✅ Avatar salvo no Supabase!');
                    fecharModalPerfil();
                    alert('✅ Avatar atualizado com sucesso!');
                } else {
                    alert('❌ Erro ao salvar no banco de dados. Tente novamente.');
                }
            } else if (urlAvatar === 'LOCAL_BASE64') {
                // Fallback para base64 (bucket não configurado)
                console.warn('⚠️ Usando modo local. Configure o bucket "avatars" no Supabase para persistência.');
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const dataUrl = e.target.result;
                    perfilUsuario.avatarUrl = dataUrl;
                    
                    // Tentar salvar data URL no banco (funciona mas não é ideal)
                    try {
                        await window.supabaseDB.atualizarAvatar(dataUrl);
                        console.log('💾 Avatar salvo como base64 no banco');
                    } catch (err) {
                        console.warn('⚠️ Não foi possível salvar no banco, usando apenas localmente');
                    }
                    
                    atualizarPerfilUI();
                    fecharModalPerfil();
                    alert('✅ Avatar atualizado!\n\n⚠️ Nota: Configure o bucket "avatars" no Supabase para melhor performance.');
                };
                reader.readAsDataURL(file);
            } else {
                alert('❌ Erro ao fazer upload da imagem. Verifique o console para mais detalhes.');
            }
        } else {
            // Modo local - usar data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                perfilUsuario.avatarUrl = e.target.result;
                atualizarPerfilUI();
                fecharModalPerfil();
                alert('✅ Avatar atualizado!');
            };
            reader.readAsDataURL(file);
        }
    } catch (error) {
        console.error('❌ Erro ao salvar avatar:', error);
        alert('❌ Erro ao salvar avatar. Veja o console para mais detalhes.');
    } finally {
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;
    }
}

// ==================== GERENCIAMENTO DE DADOS ====================

// Limpar todos os dados
async function limparTodosDados() {
    // Confirmação dupla
    const confirma1 = confirm('🗑️ ATENÇÃO!\n\nIsso vai DELETAR todas as transações e resetar o saldo para 0€.\n\nTem certeza?');
    
    if (!confirma1) return;
    
    const confirma2 = confirm('⚠️ ÚLTIMA CONFIRMAÇÃO!\n\nEsta ação é IRREVERSÍVEL!\n\nContinuar mesmo assim?');
    
    if (!confirma2) return;
    
    try {
        if (USAR_SUPABASE) {
            // Deletar transações
            const deletado = await window.supabaseDB.deletarTodasTransacoes();
            
            if (!deletado) {
                alert('❌ Erro ao deletar transações!');
                return;
            }
            
            // Resetar saldo
            const resetado = await window.supabaseDB.resetarSaldo();
            
            if (!resetado) {
                alert('❌ Erro ao resetar saldo!');
                return;
            }
            
            console.log('✅ Todos os dados foram deletados!');
            alert('✅ Dados deletados com sucesso!\n\n• Transações: 0\n• Saldo: 0,00 EUR');
            
            // Atualizar interface
            await atualizarUI();
            fecharModal();
        } else {
            // Modo local
            transacoes = [];
            saldo = 0;
            localStorage.setItem('transacoes', JSON.stringify(transacoes));
            localStorage.setItem('saldo', saldo);
            atualizarUI();
            fecharModal();
            alert('✅ Dados deletados!');
        }
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        alert('❌ Erro ao limpar dados. Veja o console.');
    }
}

// Gerar dados aleatórios
async function gerarDadosAleatorios() {
    const confirma = confirm('🎲 Gerar Dados Novos\n\nIsso vai criar 15 transações aleatórias e definir um novo saldo.\n\nContinuar?');
    
    if (!confirma) return;
    
    try {
        if (USAR_SUPABASE) {
            console.log('🎲 Gerando dados aleatórios...');
            
            const resultado = await window.supabaseDB.gerarTransacoesAleatorias(15);
            
            if (resultado.sucesso) {
                console.log('✅ Dados gerados com sucesso!');
                alert(`✅ Dados gerados com sucesso!\n\n• ${resultado.quantidade} transações criadas\n• Novo saldo: ${resultado.saldoFinal.toFixed(2)} EUR`);
                
                // Atualizar interface
                await atualizarUI();
                fecharModal();
            } else {
                alert(`❌ Erro ao gerar dados:\n${resultado.erro}`);
            }
        } else {
            // Modo local - gerar dados simples
            transacoes = [];
            const categorias = ['Supermercado', 'Restaurante', 'Combustível', 'Salário', 'Transferência'];
            saldo = 1000;
            
            for (let i = 0; i < 15; i++) {
                const valor = (Math.random() * 200 - 50).toFixed(2);
                const categoria = categorias[Math.floor(Math.random() * categorias.length)];
                
                transacoes.push({
                    id: Date.now() + i,
                    descricao: categoria,
                    valor: parseFloat(valor),
                    data: new Date(Date.now() - i * 86400000).toISOString()
                });
            }
            
            localStorage.setItem('transacoes', JSON.stringify(transacoes));
            localStorage.setItem('saldo', saldo);
            atualizarUI();
            fecharModal();
            alert('✅ 15 transações geradas!');
        }
    } catch (error) {
        console.error('❌ Erro ao gerar dados:', error);
        alert('❌ Erro ao gerar dados. Veja o console.');
    }
}

// Gerar novo número de conta
async function gerarNovoNumeroConta() {
    try {
        if (!confirm('🔢 Deseja gerar um novo número de conta?')) {
            return;
        }
        
        // Gerar 13 dígitos aleatórios
        const numero13 = Array.from({length: 13}, () => Math.floor(Math.random() * 10)).join('');
        
        // Gerar 4 dígitos aleatórios
        const numero4 = Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join('');
        
        // Salvar no localStorage
        localStorage.setItem('numeroConta13', numero13);
        localStorage.setItem('numeroConta4', numero4);
        
        console.log('✅ Novos números gerados:');
        console.log('   13 dígitos:', numero13);
        console.log('   4 dígitos:', numero4);
        
        // Atualizar o elemento no index.html
        const contaNomeElement = document.querySelector('.conta-nome');
        if (contaNomeElement) {
            contaNomeElement.textContent = `Caixa Jovem Extracto - ${numero13}`;
            console.log('✅ Número atualizado na página principal!');
        }
        
        alert(`✅ Novo número de conta gerado!\n\n📋 ${numero13}\n🔢 Últimos 4 dígitos: ${numero4}`);
        fecharModal();
    } catch (error) {
        console.error('❌ Erro ao gerar número de conta:', error);
        alert('❌ Erro ao gerar número de conta.');
    }
}

// Event Listeners para perfil
document.addEventListener('DOMContentLoaded', () => {
    // Botões de editar
    const btnEditarNome = document.getElementById('btnEditarNome');
    const btnEditarAvatar = document.getElementById('btnEditarAvatar');
    
    if (btnEditarNome) {
        btnEditarNome.addEventListener('click', abrirModalEditarNome);
    }
    
    if (btnEditarAvatar) {
        btnEditarAvatar.addEventListener('click', abrirModalEditarAvatar);
    }
    
    // Botões de gerenciamento de dados
    const btnLimparDados = document.getElementById('btnLimparDados');
    const btnGerarDados = document.getElementById('btnGerarDados');
    const btnGerarNumeroConta = document.getElementById('btnGerarNumeroConta');
    
    if (btnLimparDados) {
        btnLimparDados.addEventListener('click', limparTodosDados);
    }
    
    if (btnGerarDados) {
        btnGerarDados.addEventListener('click', gerarDadosAleatorios);
    }
    
    if (btnGerarNumeroConta) {
        btnGerarNumeroConta.addEventListener('click', gerarNovoNumeroConta);
    }
    
    // Botões de salvar
    const btnSalvarNome = document.getElementById('btnSalvarNome');
    const btnSalvarAvatar = document.getElementById('btnSalvarAvatar');
    
    if (btnSalvarNome) {
        btnSalvarNome.addEventListener('click', salvarNome);
    }
    
    if (btnSalvarAvatar) {
        btnSalvarAvatar.addEventListener('click', salvarAvatar);
    }
    
    // Input de avatar
    const inputAvatar = document.getElementById('inputAvatar');
    if (inputAvatar) {
        inputAvatar.addEventListener('change', previewImagem);
    }
    
    // Enter no input de nome
    const inputNovoNome = document.getElementById('inputNovoNome');
    if (inputNovoNome) {
        inputNovoNome.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                salvarNome();
            }
        });
    }
    
    // Carregar perfil ao iniciar
    carregarPerfil();
});

// Marcar que está navegando quando sair da página
window.addEventListener('beforeunload', () => {
    // Mantém flag de navegação ativa
    if (sessionStorage.getItem('isNavigating') !== 'true') {
        sessionStorage.setItem('isNavigating', 'true');
    }
});

// Loading Modal
window.addEventListener('load', () => {
    const loadingModal = document.getElementById('loadingModal');
    if (loadingModal) {
        // Se a intro está visível, não mostra loading
        const introScreen = document.getElementById('introScreen');
        const isNavigating = sessionStorage.getItem('isNavigating');
        
        if (isNavigating !== 'true' && introScreen && introScreen.style.display !== 'none') {
            // Intro está ativa, esconde loading imediatamente
            loadingModal.style.display = 'none';
        } else {
            // Mostra loading normalmente
            setTimeout(() => {
                loadingModal.classList.add('hidden');
            }, 1000);
        }
    }
});