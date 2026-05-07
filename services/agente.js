const db = require('./supabase');
const { gerarResposta } = require('./claude');
const { enviarMensagem } = require('./whatsapp');
const { notificarPedido } = require('./notificacao');

async function processarMensagem(telefone, texto, nomeContato) {
  try {
    const conversa = await db.getOuCriarConversa(telefone, nomeContato);

    // Conversa em atendimento humano - bot nao interfere
    if (conversa.estado === 'humano') {
      console.log(`Conversa ${telefone} em atendimento humano.`);
      return;
    }

    const [historico, cardapio] = await Promise.all([
      db.getMensagens(conversa.id),
      db.getCardapio()
    ]);

    conversa.historico = historico;

    await db.adicionarMensagem(conversa.id, 'user', texto);

    const resposta = await gerarResposta(conversa, texto, cardapio);

    await db.atualizarConversa(conversa.id, {
      estado: resposta.estado,
      carrinho: resposta.carrinho || conversa.carrinho,
      dados_cliente: resposta.dados_cliente || conversa.dados_cliente
    });

    await db.adicionarMensagem(conversa.id, 'assistant', resposta.mensagem);

    await enviarMensagem(telefone, resposta.mensagem);

    if (resposta.pedido_confirmado && conversa.estado !== 'finalizado') {
      const pedido = await db.criarPedido(
        conversa.id,
        telefone,
        resposta.dados_cliente,
        resposta.carrinho
      );

      await db.atualizarConversa(conversa.id, { estado: 'finalizado', ativa: false });

      await notificarPedido(pedido);
      console.log(`Pedido ${pedido.id} finalizado.`);
    }

  } catch (error) {
    console.error(`Erro ao processar mensagem de ${telefone}:`, error.message);

    try {
      await enviarMensagem(
        telefone,
        'Desculpe, tive um problema tecnico. Por favor, tente novamente em instantes!'
      );
    } catch (e) {
      console.error('Erro ao enviar mensagem de fallback:', e.message);
    }
  }
}

module.exports = { processarMensagem };
