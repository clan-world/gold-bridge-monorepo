# GOLD Bridge Deployment Cockpit

The cockpit is a local operator UI for the GOLD bridge. It pairs the React web app with a localhost Node helper that can read deployment state, query RPCs, and run the existing deployment scripts one step at a time.

## Run it

Terminal 1:

```bash
pnpm cockpit:api
```

Terminal 2:

```bash
pnpm web
```

The helper defaults to `127.0.0.1:8787`. Keep it bound to localhost unless you add authentication. It can run deployment commands using local `.env` values.
In worktrees that use `port-for`, run the same commands with the allocated backend/frontend ports and set `VITE_COCKPIT_API_URL` to the backend URL.

For phone signing, set `VITE_WALLET_CONNECT_PROJECT_ID` to a Reown project id. The app has a localhost fallback project id for development, but production/mainnet use should have its own project.

## What it shows

- Environment: Wormhole network, Solana/Base chain pair, RPCs, local key configuration, and WalletConnect project id status.
- Overview: readiness checks, deployer gas balances, deployer GOLD balances, Solana/Base GOLD supplies, and proof transactions.
- Addresses: Solana mint/NTT/transceiver and Base proxy/implementation/ProxyAdmin/timelock/NTT/transceiver with explorer links.
- Authority: Base token owner, minter, ProxyAdmin owner, timelock delay, recovery status, NTT modes, pausers, limits, and configured authority defaults.
- Deploy: guided steps for local setup, NTT setup, Base proxy deployment, minter handoff, preflight, proof transfers, and artifact export.
- Upgrade: proxy and timelock upgrade surface plus schedule/execute helpers.
- Recovery: operator-held Base GOLD recovery preview/execute helpers.
- Bridge: the existing Wormhole Connect NTT bridge widget.
- Wallets: Reown AppKit EVM connection, network switching, WalletConnect/mobile signing, plus a Solana identity button.
- Wallet-signed EVM operations: Base proxy deploy, V2 implementation deploy, timelock minter handoff, timelock upgrade calls, and recovery governance calls.
- Go/No-Go: on-chain and artifact-backed readiness checks with manual note fields for human approvals; exported reports include those notes.
- Guide: a step-by-step deployment spine with phases, blockers, fixed/prefilled/editable fields, active controls, post-step checks, and live evidence for each deployment step.
- Fresh rehearsal controls: snapshot current `.env`/artifacts/NTT project state, then prepare a clean local testnet run by moving the current NTT project aside and clearing deployment-derived env keys.
- NTT guide diagnostics: project file presence, RPC overrides, local key readiness, funding hints, NTT modes, owners, transceivers, pausers, rate limits, and CLI gotchas are shown before each NTT helper step.

## Safety model

- Read-only checks can run immediately.
- Mutating testnet actions require preview first; high-risk actions require a typed confirmation.
- Mainnet and critical actions require stronger typed confirmation.
- Private keys and mnemonics are not returned by the API.
- Mainnet should use connected wallets, multisigs, timelock calldata, or dry-run/export flows rather than raw private keys in `.env`.

## Current boundary

The second pass makes Base/EVM operations wallet-signed. Wormhole NTT project generation, Solana NTT manager deployment, NTT push/status, and bridge proof transfers still use the local CLI helpers.

## Fresh rehearsal flow

1. Start the API and web app.
2. Open the Guide tab and connect the EVM deployer through Reown/AppKit.
3. Use **Snapshot current deployment** before any fresh rehearsal reset. Snapshots are written under `.rehearsals/` and are intentionally ignored by git.
4. Use **Prepare fresh rehearsal** when you are ready to overwrite local deployment state. It snapshots first, moves the current NTT project aside, clears deployment-derived `.env` keys, and empties `artifacts/`.
5. Work down the active step card; each step shows fixed values, editable values, outputs, postconditions, and the right wallet or CLI control.
6. Use wallet-signed cards for Base proxy and timelock work.
7. Use local CLI cards for NTT project generation, RPC overrides, Solana/Base NTT deployment, NTT push/status, and proof transfers.
8. Export artifacts and the Go/No-Go readiness report after all critical evidence is green.

The generated web config readiness check requires the generated config to match the currently detected addresses. A stale generated config is treated as incomplete even if the file exists.
