# ScanProof React Native (Android-first MVP)

## Architecture decisions
- **Framework**: Expo React Native + TypeScript (strict mode) for fastest Android MVP iteration, with `expo prebuild` support for native deep-link intent generation.
- **Wallet**: Solana Mobile Wallet Adapter (MWA) protocol for universal multi-wallet support (Phantom, Solflare, Backpack, etc.) with encrypted session management and signature verification.
- **Structure**: Clean separation into `models`, `services`, `hooks`, `state`, `screens`, and `navigation`.
- **Reliability-first**: explicit app errors, operation timeouts (IPFS/wallet), safe persistence, and signature verification before accepting sign-in/proof signatures.

## Exact setup commands
```bash
# 1) Create and install (already done in this repo, listed for reproducibility)
npx create-expo-app@latest . --template blank-typescript
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @solana/web3.js bs58 tweetnacl expo-linking expo-constants js-sha256 @solana-mobile/mobile-wallet-adapter-protocol @solana-mobile/mobile-wallet-adapter-protocol-web3js js-base64
npm install --save-dev jest jest-expo @types/jest @testing-library/react-native @testing-library/jest-native react-test-renderer@19.1.0

# 2) Validate
npx tsc --noEmit
npx jest --runInBand

# 3) Run Android
npx expo start --android

# Optional native prebuild (recommended for release)
npx expo prebuild --platform android
```

## Folder structure
```text
.
├─ App.tsx
├─ app.json
├─ index.ts
├─ package.json
├─ src
│  ├─ config
│  │  └─ env.ts
│  ├─ hooks
│  │  ├─ use-proofs.ts
│  │  └─ use-wallet.ts
│  ├─ models
│  │  ├─ proof.ts
│  │  ├─ signed-payload.ts
│  │  ├─ verification-result.ts
│  │  └─ wallet-session.ts
│  ├─ navigation
│  │  └─ app-navigator.tsx
│  ├─ screens
│  │  ├─ create-proof-screen.tsx
│  │  ├─ home-screen.tsx
│  │  ├─ proof-details-screen.tsx
│  │  ├─ proof-list-screen.tsx
│  │  ├─ verify-proof-screen.tsx
│  │  └─ wallet-connect-screen.tsx
│  ├─ services
│  │  ├─ index.ts
│  │  ├─ ipfs
│  │  │  └─ ipfs-service.ts
│  │  ├─ proof
│  │  │  └─ proof-service.ts
│  │  ├─ solana
│  │  │  └─ solana-service.ts
│  │  ├─ storage
│  │  │  ├─ storage-keys.ts
│  │  │  └─ storage-service.ts
│  │  ├─ verification
│  │  │  └─ verification-service.ts
│  │  └─ wallet
│  │     ├─ deep-link-transport.ts
│  │     ├─ mwa-wallet-service.ts
│  │     ├─ phantom-wallet-service.ts
│  │     └─ wallet-types.ts
│  ├─ state
│  │  └─ app-state.tsx
│  ├─ types
│  │  └─ navigation.ts
│  └─ utils
│     ├─ canonical-json.ts
│     ├─ errors.ts
│     ├─ hash.ts
│     └─ logger.ts
└─ tests
   ├─ integration
   │  └─ wallet-connect-sign.test.ts
   ├─ setup.ts
   └─ unit
      ├─ hash.test.ts
      └─ verification.test.ts
```

## Android config for MWA wallet integration
- `app.json` includes:
  - `scheme`: `scanproof`
  - Android package: `com.scanproof.mobile`
  - Intent filter for app deep links: `scanproof://wallet-callback`
- Wallet service uses Solana Mobile Wallet Adapter (MWA) protocol for:
  - `authorize` - Connect and authorize with any MWA-compatible wallet
  - `signMessages` - Sign messages with connected wallet
  - `deauthorize` - Disconnect and clear session
- MWA supports multiple wallets: Phantom, Solflare, Backpack, and any MWA-compatible wallet
- Session management with automatic restore and validation

## Step-by-step run instructions
1. Install dependencies: `npm install`
2. Create local env file: `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`).
3. Set Pinata credentials in `.env`:
  - `PINATA_JWT=...` **or**
  - `PINATA_API_KEY=...` and `PINATA_API_SECRET=...`
4. Ensure an MWA-compatible wallet (Phantom, Solflare, Backpack, etc.) is installed on Android device/emulator.
5. Start app: `npx expo start --android`
6. Open **Wallet Connect** screen and tap **Connect + Sign In**.
7. Choose your wallet and approve connection and signature.
8. Back in app, confirm wallet address is shown as connected.
9. Create proof from **Create Proof** (optionally upload to IPFS).
10. Verify it from **Verify Proof** using proof id.

## Verification checklist (wallet sign-in)
- [ ] Android opens MWA-compatible wallet app from ScanProof.
- [ ] Wallet returns authorization response to app.
- [ ] App saves `WalletSession` with auth token.
- [ ] App signs sign-in challenge and verifies signature locally.
- [ ] Force close app and reopen; session restore reconnects from storage.
- [ ] Disconnect clears local session and wallet state.
- [ ] Invalid response / timeout surfaces explicit error message.

## Troubleshooting (Android wallet failures)
- **Wallet app does not open**
  - Confirm an MWA-compatible wallet is installed (Phantom, Solflare, Backpack, etc.).
  - Ensure wallet app is up to date with MWA support.
  - Rebuild native Android app after config changes: `npx expo prebuild --platform android`.
- **Authorization fails**
  - Check that wallet app supports the configured cluster (devnet/mainnet).
  - Ensure app identity configuration is correct in services initialization.
- **Signature verification fails**
  - Check clock skew and ensure message bytes are not transformed.
  - Confirm wallet address/public key and signature encoding (base58).
- **Session restore fails**
  - Stored session may be stale; disconnect and reconnect.
  - Verify Solana RPC availability (`SOLANA_RPC_URL`).
- **IPFS upload fails**
  - Ensure `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_API_SECRET` is configured.
  - Check network and Pinata endpoint availability.
