# GasNow Tools

> ## ⚠️ AVISO CRÍTICO DE INFRAESTRUTURA — LEIA ANTES DE QUALQUER DEPLOY
>
> **Este projeto roda via Docker. Cada `docker-compose up --build` gera uma nova imagem (~63MB).**
> **Imagens antigas ficam como "dangling" e acumulam no disco da VPS.**
>
> **OBRIGATÓRIO após qualquer rebuild:**
> ```bash
> docker image prune -f        # remove imagens dangling
> docker builder prune -f      # limpa build cache (pode acumular 30+ GB)
> ```
> Em 2026-03-07 o disco chegou a **99% de uso** por causa desse acúmulo.
> Ver relatório completo: `/home/docker-sites/STORAGE_REPORT.md`
>
> **Nunca instale `node_modules` localmente** (havia 364MB desnecessários no host). Remova se existir:
> ```bash
> rm -rf /home/docker-sites/gasnow2.0/node_modules
> ```

[![Site](https://img.shields.io/badge/Visit%20Site-gasnow.tools-blue)](https://gasnow.tools)
[![GitHub](https://img.shields.io/github/stars/j0n777/gasnow?style=social)](https://github.com/j0n777/gasnow)

## 🚀 What is GasNow?

**GasNow** is a real-time cryptocurrency market intelligence platform providing:

- **Real-time Gas Fees** (ETH, BTC)
- **Market Stress Index** - Derivatives-based risk indicator
- **Leverage Index** - Market positioning gauge
- **Fear & Greed Index** - Market sentiment indicator
- **Bitcoin Cycle Position** - Halving cycle analysis
- **Market Cycle** - BTC vs Altcoin dominance
- **Trending Tokens & Top Gainers** (CoinGecko data)
- **Global Market Cap**
- **Integrated Crypto News** (CoinDesk, Cointelegraph, Decrypt)
- **Light/Dark Mode**
- **Modern, Responsive Design**

Visit: [https://gasnow.tools](https://gasnow.tools)

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Supabase Edge Functions (Deno), PostgreSQL
- **Data Sources:** CoinGecko, Binance, Alternative.me, Mempool.space, Beaconcha.in
- **Hosting:** Docker, Nginx (Internal port `80` routed globally via *Traefik* on the VPS. Do not map manually.)

---

## 🌐 Features

### Real-time Indicators
- **Leverage Index**: Calculates market leverage from funding rates, open interest, and long/short ratios
- **Market Stress Index**: Multi-factor risk assessment using derivatives data
- **Fear & Greed Index**: Market sentiment from Alternative.me API
- **Bitcoin Cycle**: Position in the current halving cycle with historical comparison

### Market Data
- Gas fees for Ethereum and Bitcoin
- Top 100 coins with gainers and trending tokens
- Market capitalization and dominance metrics
- Stablecoin supply tracking (USDT, USDC)

### Design
- Glassmorphic UI with smooth animations
- Responsive layout for all devices
- Dark/Light mode toggle

---

## 🤝 Contribute

GasNow is a collaborative project. All help is welcome:
- Report bugs and suggest improvements via [Issues](https://github.com/j0n777/gasnow/issues)
- Submit Pull Requests
- Suggest new integrations or UX/UI improvements
- Help with translations and documentation

**Please note:** You are NOT permitted to copy, clone, redistribute, or use this codebase outside the official repository. All contributions must be made via pull requests or issues on GitHub.

---

## 💚 Support the Project

GasNow is maintained independently and non-profit. If this project helps you, consider donating to help cover server and API costs:

- **USDT (ERC20):** `0x4e21C77Ca734cb87cF034D31a72A2c3d74191E0d`
- **BTC (Lightning):** `jonata@walletofsatoshi.com`
- Or contact us for other ways to support!

Every donation makes a difference and helps keep the project online and free for everyone.

---

## 🔗 Useful Links

- [Official Website](https://gasnow.tools)
- [GitHub Repository](https://github.com/j0n777/gasnow)

---

## 📄 License & Usage Policy

**This project is NOT open source.**

- You are NOT permitted to copy, clone, redistribute, or use this codebase, in whole or in part, outside the official repository.
- Contributions are welcome via pull requests and issues on GitHub only.
- For partnership, licensing, or other inquiries, please contact: gasnow@protonmail.com

See the LICENSE file for full details.

---

> Made with 💙 by the crypto community. Join us!