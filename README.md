# Tell // Frankencoin Interface

`Tell` is an **independent, open-source frontend** for the [Frankencoin](https://frankencoin.com) protocol — a decentralized, oracle-free, collateral-backed stablecoin (ZCHF) on Ethereum.

This repository is a fork of the canonical [Frankencoin-ZCHF/frankencoin-dapp](https://github.com/Frankencoin-ZCHF/frankencoin-dapp), rebranded and re-themed to provide an alternative entry point to the protocol. Tell is **not affiliated with the Frankencoin Association**. All protocol code (smart contracts, indexer schema, token semantics) remains unchanged — this fork only modifies the frontend presentation layer.

> Inspired by William Tell, the Swiss folk hero. Precision-focused, terminal-styled, dark-mode-only.

Built with Next.js 14, TailwindCSS, wagmi v2, viem, and JetBrains Mono.

## Why a fork?

Decentralized infrastructure shouldn't depend on a single point of access. More frontends = more resilience for ZCHF users. This fork was created in response to the Frankencoin Association's [alternative frontend bounty](https://github.com/Frankencoin-ZCHF/Frankencoin/discussions/109).

## Attribution

All credit for the underlying dapp belongs to the [Frankencoin-ZCHF](https://github.com/Frankencoin-ZCHF) maintainers. This fork preserves the original MIT license and adds branding-level changes only. Upstream is tracked via `git remote add upstream https://github.com/Frankencoin-ZCHF/frankencoin-dapp.git`.

## Requirements

-   Node 20
-   Yarn 1.22+

## Setup

```bash
git clone https://github.com/xdecentralix/tell-dapp.git
cd tell-dapp
yarn install --frozen-lockfile
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_LANDINGPAGE_URL=https://frankencoin.com
NEXT_PUBLIC_APP_URL=https://app.<your-domain>.tld
NEXT_PUBLIC_API_URL=https://api.frankencoin.com
NEXT_PUBLIC_PONDER_URL=https://ponder.frankencoin.com
NEXT_PUBLIC_PROFILE=mainnet
NEXT_PUBLIC_WAGMI_ID=your_reown_project_id

# Server-side RPC proxy (see pages/api/rpc/[chain].ts).
# Upstream URLs and the Alchemy fallback key are server-only — they
# never reach the browser bundle.
RPC_MAINNET=http://...
RPC_POLYGON=https://polygon.llamarpc.com
RPC_ARBITRUM=http://...
RPC_OPTIMISM=http://...
RPC_BASE=http://...
RPC_AVALANCHE=https://api.avax.network/ext/bc/C/rpc
RPC_GNOSIS=http://...
RPC_SONIC=http://...
RPC_FALLBACK_ALCHEMY_KEY=your_alchemy_key
```

## Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
yarn build
yarn start
```

## Adding a New Collateral Token

1. Add the token logo (`svg` or `png`) to `public/coin/` — filename must be lowercase and match the token symbol exactly, e.g. `public/coin/wbtc.svg`.
2. Add end-of-year prices to the API repo's `yearly.service.ts` if applicable.

## License

MIT — see `LICENSE`. Forked under the terms of the upstream MIT license; original copyright notice preserved.
