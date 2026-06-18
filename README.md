# zk-wavescout-coordinator

The **Oracles & Payload Relayer** module of ZK-WaveScout — a zero-knowledge-powered automated bounty validation engine for the Soroban ecosystem. It bridges Stellar on-chain events to GitHub pull requests, automatically decrypting and merging verified contributor solutions.

---

## System Topology

```
                                    [ Maintainer ]
                                          │
                     Creates Challenge    │ (Posts encrypted solution to Coordinator DB)
                     & Funds Bounty       ▼
                 ┌─────────────────────────────────┐
                 │      Soroban Smart Contract      │
                 └────────────────┬────────────────┘
                                  ▲
                                  │ Invokes claim_bounty() with ZK Proof
                                  │
  ┌─────────────────┐  Generates  │  ┌─────────────────────────────────┐
  │  Noir Circuit   ├─────────────┼──┤      Contributor Client         │
  │  (Off-chain)    │  ZK Proof   │  │       (Frontend dApp)           │
  └─────────────────┘             │  └────────────────┬────────────────┘
                                  │                   │ POST /api/submissions/upload
                                  │                   ▼
  ┌─────────────────┐             │  ┌─────────────────────────────────┐
  │ GitHub Repo     │◄────────────┼──┤      zk-wavescout-coordinator   │
  │ (Automated PR)  │  Opens PR   │  │      (this module)              │
  └─────────────────┘  on decrypt │  └─────────────────────────────────┘
                                  ▼
                       [ bounty_claimed Event ]
```

---

## Module Architecture

### Four Sub-Modules

| Module | Role |
|--------|------|
| `zk-wavescout-circuits` | Noir ZK circuit — proves knowledge of secret solution $s$ s.t. $H = \text{Poseidon}(s)$ without revealing $s$ |
| `zk-wavescout-contracts` | Soroban smart contract — escrow vault, proof verifier, payout dispatcher, event emitter |
| `zk-wavescout-coordinator` | **This module** — Stellar event listener, AES-GCM decryptor, GitHub PR opener |
| `zk-wavescout-frontend` | Browser dApp — in-browser Noir WASM proving, Stellar RPC queries, solution upload |

---

## Integration Lifecycle

```
[1. Challenge Setup]
Maintainer calls create_challenge() ──► Soroban Contract stores H = Poseidon(s)
                                   └──► POST /api/submissions/upload (encrypted solution E)

[2. Proving Phase]
Contributor writes solution s ──► Frontend WASM Prover ──► ZK Proof + public inputs

[3. On-Chain Claim]
Frontend calls claim_bounty(proof) ──► Contract verifies ──► Releases USDC ──► Emits bounty_claimed

[4. Automation & Merge]
Coordinator streams Stellar events ──► Decrypts E with revealed key K ──► Opens GitHub PR
```

---

## Directory Structure

```
zk-wavescout-coordinator/
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts      # Express server + decryption orchestrator
    ├── stellar.ts    # Horizon event stream listener
    ├── github.ts     # Octokit PR automation
    └── types.ts      # Shared interfaces
```

---

## Cryptographic Decryption Pipeline

The contributor encrypts their solution $C$ client-side before the on-chain claim:

$$E = \text{AES-GCM-Encrypt}(C,\; K)$$

$E$, the IV, and the auth tag are uploaded to `/api/submissions/upload`. $K$ is revealed only after the Soroban contract emits `bounty_claimed`. The coordinator then:

1. Derives the AES key: `scryptSync(K, KDF_SALT, 32)`
2. Decrypts $E$ with the stored IV and auth tag
3. Calls the GitHub API to commit the plaintext and open a PR

### Security: Wallet Binding

The Noir circuit includes the contributor's Stellar address as a public input constraint:

$$H == \text{Poseidon}(s) \;\land\; \text{Dummy} == \text{ContributorWallet}$$

This binds the proof to the sender's key. Any replay or front-run attempt with a different address fails on-chain verification.

---

## Bug Fixes (vs. original scaffold)

| # | Bug | Fix |
|---|-----|-----|
| 1 | `Horizon.Server` URL contained markdown link syntax: `'[https://...](https://...)'` | Use plain string `'https://horizon-testnet.stellar.org'` |
| 2 | `scryptSync(secret, 'salt', 32)` — hardcoded literal `'salt'` is cryptographically weak | Salt is now read from `KDF_SALT` env var as a `Buffer.from(salt, 'hex')` |
| 3 | `setAuthTag` received the raw `payload.authTag` string instead of a `Buffer` | Wrapped with `Buffer.from(payload.authTag, 'hex')` |
| 4 | `dotenv` was never loaded — `process.env` vars were always `undefined` | Added `import 'dotenv/config'` at the top of `index.ts` |
| 5 | `@octokit/rest` was missing from `package.json` dependencies | Added `"@octokit/rest": "^20.0.2"` |
| 6 | Stellar event listener was a no-op stub | Replaced with real `horizonServer.transactions().forAccount().cursor('now').stream()` call in `stellar.ts` |

---

## Setup

```bash
cp .env.example .env
# Fill in CONTRACT_ADDRESS, KDF_SALT, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

npm install
npm run build
npm start
```

### Generate a KDF_SALT

```bash
openssl rand -hex 32
```

---

## API

### `POST /api/submissions/upload`

Buffers an encrypted solution before the on-chain claim is finalised.

**Body:**
```json
{
  "contributorAddress": "GXXXX...",
  "encryptedCode": "<base64 ciphertext>",
  "iv": "<32 hex chars — 16 bytes>",
  "authTag": "<32 hex chars — 16 bytes>"
}
```

**Response:**
```json
{ "status": "encrypted_payload_buffered" }
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port (default `5000`) |
| `CONTRACT_ADDRESS` | Soroban contract's Stellar account address |
| `KDF_SALT` | 64-char hex salt for `scryptSync` key derivation |
| `GITHUB_TOKEN` | GitHub personal access token with `repo` scope |
| `GITHUB_OWNER` | GitHub org or username |
| `GITHUB_REPO` | Target repository name |
| `GITHUB_BASE_BRANCH` | Branch to open PRs against (default `main`) |
