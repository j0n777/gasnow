-- =============================================================================
-- GasNow 2.0 - Security Setup (RLS Policies)
-- =============================================================================
-- Execute este SQL no SQL Editor do novo Supabase
-- Este script configura políticas de segurança para todas as tabelas
-- =============================================================================

-- IMPORTANTE: Entendendo a segurança do Supabase
-- ================================================
-- 
-- Existem 2 roles principais:
-- 1. `anon` - Usuários não autenticados (público via anon key)
-- 2. `service_role` - Acesso total (usado por Edge Functions)
--
-- Sua arquitetura:
-- - Frontend (usuários) → anon key → só leitura (SELECT)
-- - Edge Functions → service_role key → escrita (INSERT, UPDATE, DELETE)
-- - Cron jobs → chamam Edge Functions → usam service_role internamente
--
-- O `service_role` key SEMPRE BYPASSA RLS, então suas Edge Functions
-- conseguem escrever mesmo com RLS restritivo.
-- =============================================================================

-- =============================================================================
-- CONFIGURAÇÃO: Habilitar RLS e criar políticas para TODAS as tabelas
-- =============================================================================

-- 1. GAS_PRICES
-- -----------------------------------------------------------------------------
ALTER TABLE gas_prices ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver) para evitar conflitos
DROP POLICY IF EXISTS "Allow public read access" ON gas_prices;
DROP POLICY IF EXISTS "gas_prices_read_policy" ON gas_prices;

-- Política: Apenas leitura pública
CREATE POLICY "gas_prices_read_policy" ON gas_prices
  FOR SELECT
  TO public
  USING (true);

-- 2. CRYPTO_PRICES
-- -----------------------------------------------------------------------------
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON crypto_prices;
DROP POLICY IF EXISTS "crypto_prices_read_policy" ON crypto_prices;

CREATE POLICY "crypto_prices_read_policy" ON crypto_prices
  FOR SELECT
  TO public
  USING (true);

-- 3. MARKET_DATA
-- -----------------------------------------------------------------------------
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON market_data;
DROP POLICY IF EXISTS "market_data_read_policy" ON market_data;

CREATE POLICY "market_data_read_policy" ON market_data
  FOR SELECT
  TO public
  USING (true);

-- 4. FEAR_GREED_INDEX
-- -----------------------------------------------------------------------------
ALTER TABLE fear_greed_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON fear_greed_index;
DROP POLICY IF EXISTS "fear_greed_index_read_policy" ON fear_greed_index;

CREATE POLICY "fear_greed_index_read_policy" ON fear_greed_index
  FOR SELECT
  TO public
  USING (true);

-- 5. ALTSEASON_INDEX
-- -----------------------------------------------------------------------------
ALTER TABLE altseason_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON altseason_index;
DROP POLICY IF EXISTS "altseason_index_read_policy" ON altseason_index;

CREATE POLICY "altseason_index_read_policy" ON altseason_index
  FOR SELECT
  TO public
  USING (true);

-- 6. CRYPTO_NEWS
-- -----------------------------------------------------------------------------
ALTER TABLE crypto_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON crypto_news;
DROP POLICY IF EXISTS "crypto_news_read_policy" ON crypto_news;

CREATE POLICY "crypto_news_read_policy" ON crypto_news
  FOR SELECT
  TO public
  USING (true);

-- 7. TRENDING_TOKENS
-- -----------------------------------------------------------------------------
ALTER TABLE trending_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON trending_tokens;
DROP POLICY IF EXISTS "trending_tokens_read_policy" ON trending_tokens;

CREATE POLICY "trending_tokens_read_policy" ON trending_tokens
  FOR SELECT
  TO public
  USING (true);

-- 8. DERIVATIVES_DATA
-- -----------------------------------------------------------------------------
ALTER TABLE derivatives_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON derivatives_data;
DROP POLICY IF EXISTS "derivatives_data_read_policy" ON derivatives_data;

CREATE POLICY "derivatives_data_read_policy" ON derivatives_data
  FOR SELECT
  TO public
  USING (true);

-- 9. MARKET_STRESS_INDEX
-- -----------------------------------------------------------------------------
ALTER TABLE market_stress_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON market_stress_index;
DROP POLICY IF EXISTS "market_stress_index_read_policy" ON market_stress_index;

CREATE POLICY "market_stress_index_read_policy" ON market_stress_index
  FOR SELECT
  TO public
  USING (true);

-- 10. STABLECOIN_SUPPLY
-- -----------------------------------------------------------------------------
ALTER TABLE stablecoin_supply ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON stablecoin_supply;
DROP POLICY IF EXISTS "stablecoin_supply_read_policy" ON stablecoin_supply;

CREATE POLICY "stablecoin_supply_read_policy" ON stablecoin_supply
  FOR SELECT
  TO public
  USING (true);

-- 11. BITCOIN_CYCLE_DATA
-- -----------------------------------------------------------------------------
ALTER TABLE bitcoin_cycle_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON bitcoin_cycle_data;
DROP POLICY IF EXISTS "bitcoin_cycle_data_read_policy" ON bitcoin_cycle_data;

CREATE POLICY "bitcoin_cycle_data_read_policy" ON bitcoin_cycle_data
  FOR SELECT
  TO public
  USING (true);

-- 12. CYCLE_STATISTICS
-- -----------------------------------------------------------------------------
ALTER TABLE cycle_statistics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON cycle_statistics;
DROP POLICY IF EXISTS "cycle_statistics_read_policy" ON cycle_statistics;

CREATE POLICY "cycle_statistics_read_policy" ON cycle_statistics
  FOR SELECT
  TO public
  USING (true);

-- 13. CURRENT_CYCLE_POSITION
-- -----------------------------------------------------------------------------
ALTER TABLE current_cycle_position ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON current_cycle_position;
DROP POLICY IF EXISTS "current_cycle_position_read_policy" ON current_cycle_position;

CREATE POLICY "current_cycle_position_read_policy" ON current_cycle_position
  FOR SELECT
  TO public
  USING (true);

-- =============================================================================
-- VERIFICAÇÃO: Listar todas as políticas criadas
-- =============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- RESUMO DE SEGURANÇA
-- =============================================================================
-- 
-- ✅ Leitura (SELECT): Permitida para todos (público)
--    - Frontend pode ler dados via anon key
--
-- ❌ Escrita (INSERT/UPDATE/DELETE): BLOQUEADA para anon key
--    - Nenhuma política de escrita = bloqueado por padrão
--    - Edge Functions usam service_role key → bypassa RLS → pode escrever
--
-- Resultado final:
-- - Usuários do site podem VER os dados
-- - Apenas suas Edge Functions podem MODIFICAR os dados
-- - Mesmo se alguém roubar a anon key, não pode inserir/deletar nada
--
-- =============================================================================
