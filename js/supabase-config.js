// Configuração do Supabase
const SUPABASE_URL = "https://gzrutxnpddsconbaayqt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnV0eG5wZGRzY29uYmFheXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIxMDYsImV4cCI6MjA3ODAyODEwNn0.zbbenomx5FS0F4iS9y96ewv2V31eivjxGOamilisWCE";

// Criar cliente Supabase usando a biblioteca CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ Supabase conectado com sucesso!");

// Funções auxiliares para interação com o banco de dados

// Buscar todas as transações do usuário
async function buscarTransacoes() {
  try {
    const { data, error } = await supabaseClient
      .from("transacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return null;
  }
}

// Adicionar nova transação
async function adicionarTransacao(descricao, valor) {
  try {
    const { data, error } = await supabaseClient
      .from("transacoes")
      .insert([
        {
          descricao: descricao,
          valor: valor,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    console.log("✅ Transação adicionada:", data);
    return data;
  } catch (error) {
    console.error("Erro ao adicionar transação:", error);
    return null;
  }
}

// Buscar saldo atual do usuário
async function buscarSaldo() {
  try {
    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("saldo")
      .single();

    if (error) throw error;
    return data?.saldo || 0;
  } catch (error) {
    console.error("Erro ao buscar saldo:", error);
    return 0;
  }
}

// Atualizar saldo do usuário
async function atualizarSaldo(novoSaldo) {
  try {
    const { data, error } = await supabaseClient
      .from("usuarios")
      .update({ saldo: novoSaldo })
      .eq("id", 1) // Assumindo usuário ID 1
      .select();

    if (error) throw error;
    console.log("✅ Saldo atualizado:", data);
    return data;
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error);
    return null;
  }
}

// Função auxiliar para gerar número aleatório
function gerarNumeroAleatorio(digitos) {
  let numero = "";
  for (let i = 0; i < digitos; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  return numero;
}

// Adicionar detalhes da transação
async function adicionarDetalhesTransacao(transacaoId, montante, saldoAtual) {
  try {
    const agora = new Date();
    const saldoAposMovimento = parseFloat(saldoAtual.toFixed(2));

    const contaDestino = gerarNumeroAleatorio(13);
    const numeroTransferencia = gerarNumeroAleatorio(9);

    const detalhes = {
      transacao_id: transacaoId,
      montante_transacao: parseFloat(montante.toFixed(2)),
      data_movimento: agora.toISOString(),
      data_transacao: agora.toISOString(),
      tipo: "Débito",
      operacao: "Caixa directa On-line",
      conta_destino: contaDestino,
      numero_transferencia: numeroTransferencia,
      montante_transferencia: parseFloat(montante.toFixed(2)),
      montante_original: parseFloat(montante.toFixed(2)),
      saldo_contabilistico: saldoAposMovimento,
      saldo_disponivel_apos_movimento: saldoAposMovimento,
      created_at: agora.toISOString(),
    };

    console.log("📋 Preparando detalhes da transação:");
    console.log("   Transação ID:", transacaoId);
    console.log("   Conta Destino:", contaDestino);
    console.log("   Nº Transferência:", numeroTransferencia);
    console.log("   Montante:", montante);
    console.log("   Saldo após:", saldoAposMovimento);

    const { data, error } = await supabaseClient
      .from("detalhes_transacoes")
      .insert([detalhes])
      .select();

    if (error) {
      console.error("❌ Erro ao inserir detalhes:", error);
      throw error;
    }

    console.log("✅ Detalhes da transação salvos na BD:", data);
    console.log("   ✓ Conta destino salva:", data[0]?.conta_destino);
    console.log("   ✓ Nº transferência salvo:", data[0]?.numero_transferencia);

    return data;
  } catch (error) {
    console.error("❌ ERRO ao adicionar detalhes da transação:", error);
    console.error("   Mensagem:", error.message);
    console.error("   Detalhes:", error.details || "N/A");
    console.error("   Hint:", error.hint || "N/A");
    return null;
  }
}

// Adicionar nova transação com detalhes completos
async function adicionarTransacaoCompleta(descricao, valor, saldoAtual) {
  try {
    // PASSO 1: Adicionar transação principal
    const { data: transacao, error: errorTransacao } = await supabaseClient
      .from("transacoes")
      .insert([
        {
          descricao: descricao,
          valor: valor,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (errorTransacao) throw errorTransacao;

    const transacaoId = transacao[0].id;
    console.log("✅ Transação principal criada com ID:", transacaoId);

    // PASSO 2: Adicionar detalhes da transação com dados aleatórios
    await adicionarDetalhesTransacao(transacaoId, Math.abs(valor), saldoAtual);

    return transacao;
  } catch (error) {
    console.error("Erro ao adicionar transação completa:", error);
    return null;
  }
}

// Adicionar transação com detalhes personalizados
async function adicionarTransacaoComDetalhes(transacaoData, detalhesData) {
  try {
    console.log("📝 Iniciando transação com detalhes personalizados...");
    console.log("   Descrição:", transacaoData.descricao);
    console.log("   Valor:", transacaoData.valor);
    console.log("   Conta destino:", detalhesData.conta_destino);
    console.log("   Categoria:", detalhesData.categoria);
    
    // Validações
    if (!transacaoData.descricao || transacaoData.valor === undefined) {
      throw new Error("Descrição e valor são obrigatórios");
    }
    
    // PASSO 1: Adicionar transação principal
    const { data: transacao, error: errorTransacao } = await supabaseClient
      .from("transacoes")
      .insert([
        {
          descricao: transacaoData.descricao,
          valor: transacaoData.valor,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (errorTransacao) {
      console.error("❌ Erro ao criar transação:", errorTransacao);
      throw errorTransacao;
    }

    const transacaoId = transacao[0].id;
    console.log("✅ Transação principal criada com ID:", transacaoId);

    // PASSO 2: Preparar detalhes personalizados usando os campos CORRETOS da tabela
    const agora = new Date().toISOString();
    const valorAbsoluto = Math.abs(transacaoData.valor);
    const tipo = transacaoData.valor < 0 ? "Débito" : "Crédito";
    
    const detalhesCompletos = {
      transacao_id: transacaoId,
      montante_transacao: valorAbsoluto,
      data_movimento: agora,
      data_transacao: agora,
      tipo: tipo,
      operacao: detalhesData.tipo_operacao || "Caixa directa On-line",
      conta_destino: detalhesData.conta_destino || null,
      numero_transferencia: `${Math.floor(Math.random() * 1000000000)}`,
      montante_transferencia: valorAbsoluto,
      montante_original: valorAbsoluto,
      saldo_contabilistico: transacaoData.saldoApos || 0,
      saldo_disponivel_apos_movimento: transacaoData.saldoApos || 0,
    };

    console.log("📋 Detalhes a serem inseridos:", {
      transacao_id: detalhesCompletos.transacao_id,
      tipo: detalhesCompletos.tipo,
      conta_destino: detalhesCompletos.conta_destino,
      montante: detalhesCompletos.montante_transacao,
      operacao: detalhesCompletos.operacao
    });

    // PASSO 3: Inserir detalhes
    const { data: detalhesInseridos, error: errorDetalhes } = await supabaseClient
      .from("detalhes_transacoes")
      .insert([detalhesCompletos])
      .select();

    if (errorDetalhes) {
      console.error("❌ ERRO ao inserir detalhes:");
      console.error("   Código:", errorDetalhes.code);
      console.error("   Mensagem:", errorDetalhes.message);
      console.error("   Detalhes:", errorDetalhes.details);
      console.error("   Hint:", errorDetalhes.hint);
      throw errorDetalhes;
    }

    console.log("✅ Detalhes personalizados salvos com sucesso!");
    console.log("   ID dos detalhes:", detalhesInseridos[0].id);
    console.log("   Tipo:", detalhesCompletos.tipo);
    console.log("   Conta destino:", detalhesCompletos.conta_destino);
    console.log("   Operação:", detalhesCompletos.operacao);
    console.log("   Saldo após:", detalhesCompletos.saldo_disponivel_apos_movimento);

    return transacao[0];
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao adicionar transação com detalhes:");
    console.error("   Tipo:", error.constructor.name);
    console.error("   Mensagem:", error.message);
    console.error("   Stack:", error.stack);
    throw error; // Re-lançar o erro para que seja capturado pelo chamador
  }
}

// Buscar detalhes de uma transação
async function buscarDetalhesTransacao(transacaoId) {
  try {
    console.log("🔍 Buscando detalhes para transação ID:", transacaoId);

    const { data, error } = await supabaseClient
      .from("detalhes_transacoes")
      .select("*")
      .eq("transacao_id", transacaoId)
      .single();

    if (error) {
      console.error("❌ Erro ao buscar detalhes:", error);
      console.error("   Código:", error.code);
      console.error("   Mensagem:", error.message);
      throw error;
    }

    if (data) {
      console.log("✅ Detalhes encontrados:");
      console.log("   Conta Destino:", data.conta_destino);
      console.log("   Nº Transferência:", data.numero_transferencia);
      console.log("   Montante:", data.montante_transacao);
      console.log("   Saldo após:", data.saldo_disponivel_apos_movimento);
    } else {
      console.warn(
        "⚠️ Nenhum detalhe encontrado para a transação:",
        transacaoId
      );
    }

    return data;
  } catch (error) {
    console.error("❌ ERRO ao buscar detalhes da transação:", error);
    console.error("   ID procurado:", transacaoId);
    return null;
  }
}

// Buscar perfil do usuário
async function buscarPerfil() {
  try {
    const { data, error } = await supabaseClient
      .from("perfil")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}

// Atualizar nome do perfil
async function atualizarNome(novoNome) {
  try {
    const { data, error } = await supabaseClient
      .from("perfil")
      .update({ nome: novoNome })
      .eq("id", 1)
      .select();

    if (error) throw error;
    console.log("✅ Nome atualizado:", novoNome);
    return data;
  } catch (error) {
    console.error("Erro ao atualizar nome:", error);
    return null;
  }
}

// Atualizar avatar do perfil
async function atualizarAvatar(urlAvatar) {
  try {
    const { data, error } = await supabaseClient
      .from("perfil")
      .update({ avatar_url: urlAvatar })
      .eq("id", 1)
      .select();

    if (error) throw error;
    console.log("✅ Avatar atualizado:", urlAvatar);
    return data;
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    return null;
  }
}

// Atualizar números de conta do perfil
async function atualizarNumerosConta(numero13, numero4) {
  try {
    const { data, error } = await supabaseClient
      .from("perfil")
      .update({ 
        numero_conta_13: numero13,
        numero_conta_4: numero4
      })
      .eq("id", 1)
      .select();

    if (error) throw error;
    console.log("✅Números de conta atualizados na base de dados:", numero13, numero4);
    return data;
  } catch (error) {
    console.error("Erro ao atualizar números de conta:", error);
    return null;
  }
}

// Upload de imagem para Supabase Storage
async function uploadAvatar(file) {
  try {
    console.log("📤 Iniciando upload do avatar...");
    console.log(
      "   Arquivo:",
      file.name,
      "|",
      (file.size / 1024).toFixed(2),
      "KB"
    );

    const fileName = `avatar-${Date.now()}.${file.name.split(".").pop()}`;

    // Tentar upload
    const { data, error } = await supabaseClient.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Erro no upload:", error);

      // Se bucket não existe, retornar URL base64
      if (
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        console.warn(
          '⚠️ Bucket "avatars" não encontrado. Usando modo local (base64).'
        );
        return "LOCAL_BASE64"; // Sinal para usar base64
      }

      throw error;
    }

    // Obter URL pública
    const { data: urlData } = supabaseClient.storage
      .from("avatars")
      .getPublicUrl(fileName);

    console.log("✅ Avatar enviado com sucesso!");
    console.log("   URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("❌ Erro ao fazer upload do avatar:", error);
    console.error("   Detalhes:", error.message);

    // Retornar sinal para usar base64
    return "LOCAL_BASE64";
  }
}

// Deletar todas as transações
async function deletarTodasTransacoes() {
  try {
    console.log("🗑️ Deletando todas as transações...");

    // Deletar detalhes primeiro (foreign key)
    const { error: errorDetalhes } = await supabaseClient
      .from("detalhes_transacoes")
      .delete()
      .neq("id", 0); // Deletar todos (workaround para delete all)

    if (errorDetalhes) {
      console.error("Erro ao deletar detalhes:", errorDetalhes);
    }

    // Deletar transações
    const { error: errorTransacoes } = await supabaseClient
      .from("transacoes")
      .delete()
      .neq("id", 0); // Deletar todos

    if (errorTransacoes) throw errorTransacoes;

    console.log("✅ Todas as transações deletadas!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao deletar transações:", error);
    return false;
  }
}

// Resetar saldo para 0
async function resetarSaldo() {
  try {
    const { data, error } = await supabaseClient
      .from("saldo")
      .update({ valor: 0 })
      .eq("id", 1);

    if (error) throw error;
    console.log("✅ Saldo resetado para 0!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao resetar saldo:", error);
    return false;
  }
}

// Apagar transação e reverter saldo
async function apagarTransacao(transacaoId, valorTransacao) {
  try {
    console.log("🗑️ Iniciando exclusão da transação...");
    console.log("   ID:", transacaoId);
    console.log("   Valor:", valorTransacao);

    // 1. Buscar saldo atual usando a função buscarSaldo
    console.log("💰 Buscando saldo atual...");
    const saldoAtual = await buscarSaldo();
    
    if (saldoAtual === null || saldoAtual === undefined) {
      throw new Error("Não foi possível buscar o saldo atual");
    }
    
    console.log("💰 Saldo atual:", saldoAtual);

    // 2. Calcular novo saldo (reverter o efeito da transação)
    // Se foi débito (-50), adicionar 50 de volta
    // Se foi crédito (+100), subtrair 100
    const novoSaldo = parseFloat((saldoAtual - valorTransacao).toFixed(2));
    console.log("💰 Novo saldo após reversão:", novoSaldo);

    // 3. Deletar detalhes da transação primeiro (foreign key)
    console.log("🗑️ Deletando detalhes da transação...");
    const { error: errorDetalhes } = await supabaseClient
      .from("detalhes_transacoes")
      .delete()
      .eq("transacao_id", transacaoId);

    if (errorDetalhes) {
      console.warn("⚠️ Erro ao deletar detalhes:", errorDetalhes);
      console.warn("   Detalhes podem não existir, continuando...");
    } else {
      console.log("✅ Detalhes deletados!");
    }

    // 4. Deletar a transação
    console.log("🗑️ Deletando transação...");
    const { error: errorTransacao } = await supabaseClient
      .from("transacoes")
      .delete()
      .eq("id", transacaoId);

    if (errorTransacao) {
      console.error("❌ Erro ao deletar transação:", errorTransacao);
      throw errorTransacao;
    }
    console.log("✅ Transação deletada!");

    // 5. Atualizar saldo usando a função atualizarSaldo
    console.log("💰 Atualizando saldo para", novoSaldo, "...");
    const resultadoSaldo = await atualizarSaldo(novoSaldo);
    
    if (!resultadoSaldo) {
      console.error("❌ Erro ao atualizar saldo");
      throw new Error("Falha ao atualizar o saldo");
    }
    console.log("✅ Saldo atualizado!");

    console.log("\n✅ TRANSAÇÃO APAGADA COM SUCESSO!");
    console.log("   • Saldo revertido de", saldoAtual, "para", novoSaldo);

    return {
      sucesso: true,
      saldoAnterior: saldoAtual,
      saldoNovo: novoSaldo,
    };
  } catch (error) {
    console.error("❌ ERRO ao apagar transação:", error);
    console.error("   Mensagem:", error.message);
    console.error("   Stack:", error.stack);
    return { sucesso: false, erro: error.message };
  }
}

// Gerar transações aleatórias
async function gerarTransacoesAleatorias(quantidade = 10) {
  try {
    console.log(`🎲 Gerando ${quantidade} transações aleatórias...`);

    const categorias = [
      { nome: "Supermercado", tipo: "debito", icone: "", min: 20, max: 150 },
      { nome: "Restaurante", tipo: "debito", icone: "", min: 15, max: 80 },
      { nome: "Combustível", tipo: "debito", icone: "", min: 30, max: 100 },
      { nome: "Farmácia", tipo: "debito", icone: "", min: 10, max: 50 },
      { nome: "Transporte", tipo: "debito", icone: "", min: 5, max: 30 },
      { nome: "Salário", tipo: "credito", icone: "", min: 800, max: 2000 },
      {
        nome: "Transferência Recebida",
        tipo: "credito",
        icone: "",
        min: 50,
        max: 500,
      },
      { nome: "Venda Online", tipo: "credito", icone: "", min: 30, max: 200 },
      { nome: "Continente", tipo: "debito", icone: "", min: 25, max: 120 },
      { nome: "Pingo Doce", tipo: "debito", icone: "", min: 20, max: 100 },
      { nome: "Lidl", tipo: "debito", icone: "", min: 15, max: 80 },
      { nome: "Mercadona", tipo: "debito", icone: "", min: 18, max: 90 },
      { nome: "McDonald's", tipo: "debito", icone: "", min: 8, max: 25 },
      { nome: "Pizza Hut", tipo: "debito", icone: "", min: 15, max: 45 },
      { nome: "Burger King", tipo: "debito", icone: "", min: 7, max: 20 },
      { nome: "KFC", tipo: "debito", icone: "", min: 9, max: 28 },
      { nome: "Starbucks", tipo: "debito", icone: "", min: 4, max: 12 },
      {
        nome: "Pastelaria Central",
        tipo: "debito",
        icone: "",
        min: 3,
        max: 15,
      },
    ];

    const nomes = [
      "João Silva",
      "Maria Santos",
      "Pedro Costa",
      "Ana Ferreira",
      "Carlos Oliveira",
      "Sofia Martins",
      "Miguel Alves",
      "Beatriz Pereira",
      "Ricardo Costa",
      "Ana Silva",
      "Pedro Costa",
      "Miguel Alves",
      "Beatriz Pereira",
      "João Mendes",
      "Maria Silva",
      "Pedro Cardoso",
      "Ana Costa",
      "Vicente Cardoso",   
    ];

    let saldoAtual = 1000; // Começar com 1000€
    const transacoes = [];
    const metadados = []; // Guardar tipo e categoria para os detalhes

    for (let i = 0; i < quantidade; i++) {
      const categoria =
        categorias[Math.floor(Math.random() * categorias.length)];
      const valor = (
        Math.random() * (categoria.max - categoria.min) +
        categoria.min
      ).toFixed(2);
      const valorFinal =
        categoria.tipo === "debito" ? -parseFloat(valor) : parseFloat(valor);

      saldoAtual += valorFinal;

      // Data aleatória nos últimos 30 dias
      const diasAtras = Math.floor(Math.random() * 30);
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);

      const descricao =
        categoria.tipo === "debito"
          ? `${categoria.icone} ${categoria.nome}`
          : `${categoria.icone} ${categoria.nome} - ${
              nomes[Math.floor(Math.random() * nomes.length)]
            }`;

      transacoes.push({
        descricao,
        valor: valorFinal,
        created_at: data.toISOString(),
      });

      // Guardar metadados
      metadados.push({
        tipo: categoria.tipo,
        categoria: categoria.nome,
      });
    }

    // Criar pares [transacao, metadado] e ordenar por data
    const paresOrdenados = transacoes
      .map((tx, idx) => ({
        transacao: tx,
        metadado: metadados[idx],
      }))
      .sort(
        (a, b) =>
          new Date(b.transacao.created_at) - new Date(a.transacao.created_at)
      );

    // Separar novamente após ordenação
    const transacoesOrdenadas = paresOrdenados.map((p) => p.transacao);
    const metadadosOrdenados = paresOrdenados.map((p) => p.metadado);

    // Inserir todas de uma vez
    const { data: transacoesInseridas, error } = await supabaseClient
      .from("transacoes")
      .insert(transacoesOrdenadas)
      .select();

    if (error) {
      console.error("❌ Erro detalhado:", error);
      throw error;
    }

    console.log(`✅ ${transacoesInseridas.length} transações inseridas!`);

    // Criar detalhes para cada transação usando metadados
    const detalhes = transacoesInseridas.map((tx, idx) => {
      const meta = metadadosOrdenados[idx];
      return {
        transacao_id: tx.id,
        data_transacao: tx.created_at,
        valor_original: Math.abs(tx.valor),
        moeda: "EUR",
        tipo_operacao: meta.tipo === "debito" ? "Pagamento" : "Transferência",
        referencia: `REF${Math.floor(Math.random() * 1000000)}`,
        categoria: meta.categoria || "Outros",
        notas: `Transação gerada automaticamente`,
        conta_destino:
          meta.tipo === "credito"
            ? nomes[Math.floor(Math.random() * nomes.length)]
            : null,
        numero_transferencia:
          meta.tipo === "credito"
            ? `TRF${Math.floor(Math.random() * 1000000)}`
            : null,
      };
    });

    console.log(`📋 Inserindo ${detalhes.length} detalhes...`);

    const { error: errorDetalhes } = await supabaseClient
      .from("detalhes_transacoes")
      .insert(detalhes);

    if (errorDetalhes) {
      console.warn("⚠️ Erro ao inserir detalhes:", errorDetalhes);
    } else {
      console.log(`✅ Detalhes inseridos com sucesso!`);
    }

    // Atualizar saldo
    console.log(`💰 Atualizando saldo para: ${saldoAtual.toFixed(2)} EUR`);

    const { error: errorSaldo } = await supabaseClient
      .from("saldo")
      .update({ valor: saldoAtual })
      .eq("id", 1);

    if (errorSaldo) {
      console.warn("⚠️ Erro ao atualizar saldo:", errorSaldo);
    } else {
      console.log(`✅ Saldo atualizado!`);
    }

    console.log(`\n✅ RESUMO:`);
    console.log(`   • ${transacoesInseridas.length} transações geradas`);
    console.log(`   • Saldo final: ${saldoAtual.toFixed(2)} EUR`);

    return {
      sucesso: true,
      quantidade: transacoesInseridas.length,
      saldoFinal: saldoAtual,
    };
  } catch (error) {
    console.error("❌ Erro ao gerar transações:", error);
    return { sucesso: false, erro: error.message };
  }
}

// Exportar funções para uso global
window.supabaseDB = {
  buscarTransacoes,
  adicionarTransacao,
  adicionarTransacaoCompleta,
  adicionarTransacaoComDetalhes,
  buscarDetalhesTransacao,
  buscarSaldo,
  atualizarSaldo,
  buscarPerfil,
  atualizarNome,
  atualizarAvatar,
  atualizarNumerosConta,
  uploadAvatar,
  deletarTodasTransacoes,
  resetarSaldo,
  apagarTransacao,
  gerarTransacoesAleatorias,
};
