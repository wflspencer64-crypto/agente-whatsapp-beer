const axios = require('axios');

function formatarCardapio(itens) {
  if (!itens || itens.length === 0) return 'Cardapio indisponivel no momento.';

  const porCategoria = itens.reduce((acc, item) => {
    const cat = item.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    const desc = item.descricao ? ` (${item.descricao})` : '';
    acc[cat].push(`  • ${item.nome} - R$ ${Number(item.preco).toFixed(2)}${desc}`);
    return acc;
  }, {});

  return Object.entries(porCategoria)
    .map(([cat, linhas]) => `*${cat}*\n${linhas.join('\n')}`)
    .join('\n\n');
}

async function gerarResposta(conversa, mensagemUsuario, cardapio) {
  const cardapioFormatado = formatarCardapio(cardapio);

  const systemPrompt = `Voce e o assistente virtual do *${process.env.NOME_ESTABELECIMENTO || 'Beer Bar'}*.
Seu nome e BeerBot. Voce atende pedidos pelo WhatsApp de forma simpatica e eficiente.

CARDAPIO ATUAL:
${cardapioFormatado}

SUAS RESPONSABILIDADES:
1. Recepcionar o cliente com simpatia
2. Apresentar o cardapio quando solicitado ou na primeira mensagem
3. Anotar pedidos corretamente (item + quantidade)
4. Coletar dados de entrega: nome completo, endereco (rua, numero, bairro) e telefone
5. Confirmar o pedido completo com valor total antes de finalizar
6. Aguardar confirmacao do cliente (sim/nao) antes de marcar como pedido_confirmado: true
7. Se o cliente quiser falar com humano, definir estado como "humano"

ESTADO ATUAL:
- Estado: ${conversa.estado}
- Carrinho: ${JSON.stringify(conversa.carrinho || [])}
- Dados do cliente: ${JSON.stringify(conversa.dados_cliente || {})}

REGRAS:
- Use linguagem descontraida mas profissional
- Use emojis com moderacao (ex: 🍺 ✅ 👍)
- Confirme itens antes de adicionar ao carrinho
- Calcule e mostre o total sempre que exibir resumo do pedido
- Nunca marque pedido_confirmado: true sem o cliente ter dito "sim", "confirmo", "pode ser" ou similar

RESPONDA SEMPRE EM JSON (sem texto fora do JSON):
{
  "mensagem": "texto para enviar ao cliente",
  "estado": "inicio|menu|pedido|dados_entrega|confirmacao|finalizado|humano",
  "carrinho": [{"nome": "item", "quantidade": 1, "preco": 0.00}],
  "dados_cliente": {"nome": "", "endereco": "", "telefone": ""},
  "pedido_confirmado": false
}`;

  const historico = (conversa.historico || []).map(m => ({
    role: m.role,
    content: m.conteudo
  }));

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...historico,
        { role: 'user', content: mensagemUsuario }
      ]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );

  const texto = response.data.content[0].text;

  try {
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Erro ao parsear JSON do Claude:', e.message);
  }

  return {
    mensagem: texto,
    estado: conversa.estado,
    carrinho: conversa.carrinho || [],
    dados_cliente: conversa.dados_cliente || {},
    pedido_confirmado: false
  };
}

module.exports = { gerarResposta };
