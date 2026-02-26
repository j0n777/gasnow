# Refinamento: Seção "Privacy Tools" V2

## 🎯 Objetivos
1.  **Expandir Categorias**: Aumentar para 5+ abas (Email, VPN, Wallets, P2P, Swaps).
2.  **Densidade**: Garantir pelo menos 4 itens por aba.
3.  **Remoção**: Deletar `StealthExWidget` (quebrado) e `Sponsors` (mover para "Partner with us").
4.  **UI Polish**: Corrigir hover states, contraste de botões e cores.
5.  **Partners**: Adicionar call-to-action "Become a Partner" com email `partners@gasnow.tools`.

---

## 🏗️ Nova Estrutura de Abas (`PrivacyDojo.tsx`)

### 1. 📬 Email & Communication (Novo)
- **Proton Mail**: Encrypted email
- **Tutanota**: Private email
- **SimpleLogin**: Email aliases
- **Session**: Private messenger
- **Simplex**: Metadata-free chat

### 2. 🛡️ VPN & Network (Novo)
- **Mullvad**: No info needed
- **IVPN**: Privacy focused
- **Proton VPN**: Swiss privacy
- **Tor Browser**: Anonymity network
- **I2P**: Invisible internet

### 3. 💱 No-KYC Swaps (Expandido)
- **StealthEX**: (Destaque Premium) - *Migrar do widget antigo*
- **Trocador.app**: Aggregator
- **Simpleswap**: Instant
- **FixedFloat**: Lightning support
- **eXch**: High privacy

### 4. 🤝 P2P Markets (Expandido)
- **SpikeToSpike**: (Referral JON)
- **RoboSats**: Lightning P2P
- **Bisq**: DAO
- **HodlHodl**: Multisig
- **Peach Bitcoin**: Mobile P2P (Adicionar)

### 5. 💰 Wallets (Expandido)
- **Samourai**: Privacy features
- **Sparrow**: Best desktop
- **Monero GUI**: The standard
- **Cake Wallet**: Mobile Monero/BTC
- **Phoenix**: Lightning non-custodial

### 6. 💳 Cards & Off-ramp
- **KAST**: (Referral HP8K5JYH)
- **Bitrefill**: Cards/Refills
- **Prepaidify**: Prepaid cards?
- *Need 4th item*: **Coincards**?

---

## 🎨 Layout & UI Fixes
- **Button Hover**: Garantir que o `ghost` ou `outline` button tenha contraste adequado no hover (atualmente texto some?). Usar `hover:bg-primary hover:text-primary-foreground`.
- **Card Hover**: Suavizar a sombra e border color.
- **Sponsors Removal**: Remover seção 8 e 9 da `Index.tsx`.
- **Footer Call**: Adicionar "Become a Sponsor: partners@gasnow.tools" no rodapé do componente ou do site.

## 📍 Plano de Execução
1.  Atualizar `PrivacyDojo.tsx` com as novas categorias e ferramentas.
2.  Ajustar classes Tailwind para corrigir hover.
3.  Atualizar `Index.tsx`: Remover `<StealthExWidget />` e `<Sponsors />`.
4.  Adicionar rodapé de contato.
