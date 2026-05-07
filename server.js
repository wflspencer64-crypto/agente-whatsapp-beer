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

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agente WhatsApp rodando na porta ${PORT}`);
});
