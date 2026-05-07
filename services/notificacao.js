const nodemailer = require('nodemailer');
const { enviarMensagem } = require('./whatsapp');

function formatarPedido(pedido) {
  const itens = (pedido.itens || [])
    .map(i => `  - ${i.quantidade}x ${i.nome}  R$ ${(i.preco * i.quantidade).toFixed(2)}`)
    .join('\n');

  return `NOVO PEDIDO #${String(pedido.id).substring(0, 8).toUpperCase()}
----------------------------
Cliente:  ${pedido.nome_cliente}
Telefone: ${pedido.telefone_entrega}
Endereco: ${pedido.endereco}

ITENS:
${itens}

TOTAL: R$ ${Number(pedido.total).toFixed(2)}
----------------------------
${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
}

async function notificarEmail(pedido) {
  if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_ESTABELECIMENTO) return;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS
    }
  });

  const texto = formatarPedido(pedido);

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.EMAIL_ESTABELECIMENTO,
    subject: `Novo Pedido - ${pedido.nome_cliente}`,
    text: texto,
    html: `<pre style="font-family:monospace;font-size:14px">${texto}</pre>`
  });

  console.log(`Email de pedido enviado para ${process.env.EMAIL_ESTABELECIMENTO}`);
}

async function notificarWhatsApp(pedido) {
  if (!process.env.WHATSAPP_ESTABELECIMENTO) return;

  await enviarMensagem(
    process.env.WHATSAPP_ESTABELECIMENTO,
    formatarPedido(pedido)
  );

  console.log(`Notificacao WhatsApp enviada para ${process.env.WHATSAPP_ESTABELECIMENTO}`);
}

async function notificarPedido(pedido) {
  const resultados = await Promise.allSettled([
    notificarEmail(pedido),
    notificarWhatsApp(pedido)
  ]);

  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Erro na notificacao ${i === 0 ? 'email' : 'whatsapp'}:`, r.reason?.message);
    }
  });
}

module.exports = { notificarPedido };
