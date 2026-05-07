const express = require('express');
const router = express.Router();
const { processarMensagem } = require('../services/agente');

// Verificacao do webhook pela Meta
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso');
    return res.status(200).send(challenge);
  }

  console.error('Falha na verificacao do webhook - token invalido');
  res.sendStatus(403);
});

// Receber mensagens do WhatsApp
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    // Ignora eventos que nao sao mensagens (status, leitura, etc)
    if (!messages || messages.length === 0) {
      return res.sendStatus(200);
    }

    const msg = messages[0];

    if (msg.type !== 'text') {
      return res.sendStatus(200);
    }

    const telefone = msg.from;
    const texto = msg.text.body;
    const nomeContato = value?.contacts?.[0]?.profile?.name || 'Cliente';

    console.log(`[${new Date().toISOString()}] ${nomeContato} (${telefone}): ${texto}`);

    // Responde 200 imediatamente - Meta exige resposta em menos de 5s
    res.sendStatus(200);

    // Processa em background
    processarMensagem(telefone, texto, nomeContato).catch(err => {
      console.error('Erro ao processar mensagem:', err);
    });

  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
