const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v20.0';

async function enviarMensagem(para, texto) {
  const response = await axios.post(
    `${BASE_URL}/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: para,
      type: 'text',
      text: { body: texto }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log(`Mensagem enviada para ${para}:`, JSON.stringify(response.data));
  return response.data;
}

module.exports = { enviarMensagem };
