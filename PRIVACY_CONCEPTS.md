# Proposta de Seção de Privacidade para GasNow

## Objetivo
Integrar ferramentas de privacidade (estilo kycnot.me/privacytools.io) mantendo a filosofia de "Dashboard Unificado" sem poluir a interface.

---

## 🎨 Opção 1: "The Privacy Row" (Integração Direta)
**Conceito**: Adicionar uma nova linha de widgets (3 colunas) focada em métricas e atalhos de privacidade, inserida entre "News" e "StealthEX". Mantém o fluxo vertical único.

**Layout Proposto**:
```
┌─────────────────────────────────────────────────────────────┐
│                      GAS PRICES (row 1)                     │
└─────────────────────────────────────────────────────────────┘
...
┌─────────────────────────────────────────────────────────────┐
│  [ Privacy Coins ]    [ No-KYC Exchanges ]   [ Tool Box ]   │
│  XMR: $150 (+2%)      TOP 3:                 Recommended:   │
│  ZEC: $30 (-1%)       1. StealthEX 🥇        1. Tor Browser │
│  SCRT: $0.40          2. HodlHodl            2. Signal      │
│  [View Chart]         3. Bisq                3. Mullvad     │
└─────────────────────────────────────────────────────────────┘
```

**Prós**:
- Visibilidade imediata.
- Integra o StealthEX (patrocinador) organicamente como "Top 1 No-KYC".
- Mantém o usuário na mesma página.

**Contras**:
- Aumenta o scroll vertical.

---

## 🎛️ Opção 2: "Privacy Mode" (Abas no Topo)
**Conceito**: Criar uma alternância de contexto no topo da página. O usuário escolhe entre ser um "Trader" (Market Data) ou um "Privacy Advocate" (Privacy Tools).

**Layout Proposto**:
```
HEADER: Logo [ GasNow ]  |  Tabs: [ 📊 Market Data ] [ 🛡️ Privacy Tools ]
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  PRIVACY DASHBOARD (Substitui a visão atual quando ativo)   │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────────────────┐   │
│  │ Privacy Index     │  │ Interactive Map               │   │
│  │ Score: 78/100     │  │ (Tor Nodes / adoption)        │   │
│  └───────────────────┘  └───────────────────────────────┘   │
│                                                             │
│  RECURSOS CATEGORIZADOS:                                    │
│  - Exchanges (DEX/CEX sem KYC)                              │
│  - Wallets (Samourai, Sparrow, Monero GUI)                  │
│  - Communication (Session, Simplex)                         │
└─────────────────────────────────────────────────────────────┘
```

**Prós**:
- Permite muito mais conteúdo (rankings completos, guias) sem poluir a home.
- Cria um "produto" novo dentro do site.

**Contras**:
- Divide a atenção. O usuário pode nunca clicar na aba.

---

## 🧩 Opção 3: "The Privacy Widget" (Componente Interativo)
**Conceito**: Um widget único, "full-width", interativo (como o de Ciclos), onde o usuário navega por categorias sem sair da home. Usando Tabs internas.

**Layout Proposto**:
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ PRIVACY DOJO (Widget Interativo)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Exchanges]  [Wallets]  [Email]  [VPN]                │  │ <-- Menu interno (Tabs)
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  🏆 Recommended for Exchanges:                        │  │
│  │  1. StealthEX (Cross-chain, No-KYC) -> [SWAP NOW]     │  │
│  │  2. RoboSats (Lightning, P2P)       -> [VISIT]        │  │
│  │                                                       │  │
│  │  💡 Did you know? KYC creates a permanent honeypot... │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Prós**:
- Compacto (ocupa altura fixa).
- Interativo e moderno.
- Educativo ("Did you know?" facts rotativos).

**Contras**:
- Mais complexo de implementar (estado interno do componente).

---

## 💡 Minha Recomendação
**Opção 3 (The Privacy Widget)** é a que melhor equilibra "Dashboard Unificado" com profundidade de conteúdo. Ela permite explorar várias categorias sem alongar a página infinitamente e sem esconder o conteúdo em outra aba.
Ela pode incluir uma aba "Exchange" que destaca o StealthEX nativamente.

**Implementação Técnica**:
- Componente `PrivacyDojo.tsx`
- Shadcn UI `Tabs` e `Card`
- Dados estáticos (JSON) com links referral quando possível.
