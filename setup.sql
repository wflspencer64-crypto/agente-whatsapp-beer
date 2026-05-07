-- Execute este script no SQL Editor do Supabase antes de subir o servidor

-- Remove tabelas anteriores com tipos incompativeis (ordem importa por causa das FKs)
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS conversas CASCADE;
DROP TABLE IF EXISTS cardapio CASCADE;

-- Conversas ativas com cada cliente
CREATE TABLE conversas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone    TEXT NOT NULL,
  nome_contato TEXT,
  estado      TEXT DEFAULT 'inicio',
  carrinho    JSONB DEFAULT '[]',
  dados_cliente JSONB DEFAULT '{}',
  ativa       BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Historico de mensagens de cada conversa
CREATE TABLE mensagens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID REFERENCES conversas(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo    TEXT NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos finalizados
CREATE TABLE pedidos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id      UUID REFERENCES conversas(id),
  telefone         TEXT NOT NULL,
  nome_cliente     TEXT,
  endereco         TEXT,
  telefone_entrega TEXT,
  itens            JSONB NOT NULL DEFAULT '[]',
  total            NUMERIC(10,2) DEFAULT 0,
  status           TEXT DEFAULT 'recebido'
                   CHECK (status IN ('recebido','em_preparo','saiu_entrega','entregue','cancelado')),
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Cardapio
CREATE TABLE cardapio (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  preco       NUMERIC(10,2) NOT NULL,
  categoria   TEXT DEFAULT 'Outros',
  disponivel  BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_conversas_telefone ON conversas(telefone);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);

-- RLS
ALTER TABLE conversas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardapio    ENABLE ROW LEVEL SECURITY;

-- Politicas abertas (servidor usa anon key)
CREATE POLICY "allow_all" ON conversas  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON mensagens  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON pedidos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON cardapio   FOR ALL USING (true) WITH CHECK (true);

-- Itens de exemplo para teste (remova depois)
INSERT INTO cardapio (nome, descricao, preco, categoria) VALUES
  ('Heineken 600ml',  'Long neck gelada',           18.00, 'Cervejas'),
  ('Brahma Duplo Malte', 'Lata 350ml',               8.00, 'Cervejas'),
  ('IPA Artesanal',   'Cerveja artesanal local',     22.00, 'Cervejas'),
  ('Porcao de Fritas','Porcao grande crocante',      25.00, 'Porcoes'),
  ('Tira-Gosto Misto','Calabresa + frango + fritas', 38.00, 'Porcoes'),
  ('Agua Mineral',    '500ml com ou sem gas',         5.00, 'Nao Alcoolicos'),
  ('Refrigerante',    'Coca, Guarana ou Sprite lata', 7.00, 'Nao Alcoolicos')
ON CONFLICT DO NOTHING;
