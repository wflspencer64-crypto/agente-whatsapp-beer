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

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agente WhatsApp rodando na porta ${PORT}`);
});
