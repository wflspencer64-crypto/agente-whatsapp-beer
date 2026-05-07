const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function getOuCriarConversa(telefone, nomeContato) {
  const { data } = await supabase
    .from('conversas')
    .select('*')
    .eq('telefone', telefone)
    .eq('ativa', true)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single();

  if (data) return data;

  const { data: nova, error } = await supabase
    .from('conversas')
    .insert({
      telefone,
      nome_contato: nomeContato,
      estado: 'inicio',
      carrinho: [],
      dados_cliente: {},
      ativa: true
    })
    .select()
    .single();

  if (error) throw error;
  return nova;
}

async function atualizarConversa(id, updates) {
  const { error } = await supabase
    .from('conversas')
    .update({ ...updates, atualizado_em: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

async function adicionarMensagem(conversaId, role, conteudo) {
  const { error } = await supabase
    .from('mensagens')
    .insert({ conversa_id: conversaId, role, conteudo });

  if (error) throw error;
}

async function getMensagens(conversaId) {
  const { data, error } = await supabase
    .from('mensagens')
    .select('role, conteudo')
    .eq('conversa_id', conversaId)
    .order('criado_em', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data || [];
}

async function getCardapio() {
  const { data, error } = await supabase
    .from('cardapio')
    .select('*')
    .eq('disponivel', true)
    .order('categoria');

  if (error) throw error;
  return data || [];
}

async function criarPedido(conversaId, telefone, dadosCliente, carrinho) {
  const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      conversa_id: conversaId,
      telefone,
      nome_cliente: dadosCliente.nome,
      endereco: dadosCliente.endereco,
      telefone_entrega: dadosCliente.telefone || telefone,
      itens: carrinho,
      total,
      status: 'recebido'
    })
    .select()
    .single();

  if (error) throw error;
  return pedido;
}

module.exports = {
  getOuCriarConversa,
  atualizarConversa,
  adicionarMensagem,
  getMensagens,
  getCardapio,
  criarPedido
};
