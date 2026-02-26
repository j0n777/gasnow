# Implementação: Seção "Privacy Tools" Unificada

## Objetivo
Criar um componente interativo (`PrivacyDojo`) que mescla a densidade de conteúdo de um grid com a organização de abas, posicionado logo após a seção de "Latest News". Foco em privacidade, No-KYC e P2P.

---

## 🏗️ Arquitetura do Componente

### 1. Novo Componente: `src/components/PrivacyDojo.tsx`
Utilizará `Tabs` do Shadcn UI para organizar categorias sem ocupar espaço vertical excessivo.

**Estrutura das Abas:**
1.  **💱 No-KYC Swaps**
    - **StealthEX** (Destaque Principal / Widget Integrado?)
    - *Nota: O usuário pediu para manter o widget do StealthEX separado ou integrar? "nessa seção também vai ser excelente...". Talvez mover o widget atual para dentro desta aba ou manter como destaque e usar cards menores aqui?*
    - *Decisão*: Manter o Widget StealthEX Full Width onde está (como parceiro premium) e adicionar o StealthEX também na lista de ferramentas com link direto.
    - **Outros**: Trocador.app (se houver).
2.  **🤝 P2P Markets** (Foco em compra/venda fiat)
    - **SpikeToSpike** (Destaque Brasileiro/Nostr) -> Referral JON
    - **HodlHodl** -> Referral?
    - **Bisq** -> Link download
    - **RoboSats** -> Link Tor/Web
3.  **💳 Crypto Cards** (Off-ramp)
    - **KAST** -> Referral HP8K5JYH
    - **Outros** (Bitrefill, etc., se houver)
4.  **🛡️ Privacy Tools** (Software Essencial)
    - **Tor Browser**
    - **Samourai/Sparrow Wallet**
    - **Monero GUI**
    - **Simplex Chat** / **Session**

### 2. Dados e Links (Hardcoded ou Config?)
Criar um array de objetos `privacyTools` dentro do componente para fácil manutenção.
Campos: `name`, `description`, `url`, `icon` (Lucide ou Emoji), `tags` (e.g. "Nostr", "Recommended").

---

## 📍 Integração no `Index.tsx`

Inserir `<PrivacyDojo />` logo após `<NewsSection />` e antes de `<StealthExWidget />`.

```tsx
/* 6. News Section */
<NewsSection />

/* 7. Privacy Tools (NOVO) */
<section aria-labelledby="privacy-heading">
  <h2 id="privacy-heading" className="sr-only">Privacy & Security Tools</h2>
  <PrivacyDojo />
</section>

/* 8. StealthEx Sponsor */
<StealthExWidget />
```

---

## 🎨 Layout Visual (Mockup)

```
[ Tab: P2P MARKETS ]
┌─────────────────────────────────────────────────────────────┐
│  🇧🇷 SpikeToSpike (Nostr P2P)     🦅 Bisq (DAO)              │
│  "Bisq brasileira via Nostr"      "The sovereign standard"  │
│  [ VISITAR ]                      [ DOWNLOAD ]              │
│                                                             │
│  ⚡ RoboSats (Lightning)          🤝 HodlHodl               │
│  "Buy BTC via Lightning"          "Multisig P2P"            │
│  [ USAR AGORA ]                   [ VISITAR ]               │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Checklist
- [ ] Criar `src/components/PrivacyDojo.tsx`
- [ ] Implementar Tabs e Grid de Cards
- [ ] Popular com os links de referral fornecidos (SpikeToSpike, KAST, etc.)
- [ ] Inserir componente na `Index.tsx`
- [ ] Verificar responsividade (Mobile = Stack, Desktop = Grid 2x2 ou 4x1)
