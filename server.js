require('dotenv').config();
const express = require('express');
const webhookRouter = require('./routes/webhook');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    servico: `Agente WhatsApp - ${process.env.NOME_ESTABELECIMENTO}`,
    timestamp: new Date().toISOString()
  });
});

// Endpoint temporario de diagnostico - remover apos corrigir
app.get('/debug-env', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    anthropic_key_length: key.length,
    anthropic_key_inicio: key.substring(0, 15),
    anthropic_key_fim: key.substring(key.length - 5),
    tem_aspas: key.startsWith('"') || key.startsWith("'"),
    tem_espaco: key.startsWith(' ') || key.endsWith(' '),
    supabase_url_ok: !!process.env.SUPABASE_URL,
    meta_token_ok: !!process.env.META_ACCESS_TOKEN
  });
});

// Teste direto da API Anthropic - remover apos corrigir
app.get('/test-anthropic', async (req, res) => {
  const axios = require('axios');
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Oi' }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    res.json({ sucesso: true, resposta: response.data.content[0].text });
  } catch (error) {
    res.json({
      sucesso: false,
      status: error.response?.status,
      erro: error.response?.data,
      mensagem: error.message
    });
  }
});

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agente WhatsApp rodando na porta ${PORT}`);
});
