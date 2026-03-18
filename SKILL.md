---
name: lsp28-grid
description: Manage LSP28 The Grid on LUKSO Universal Profiles. Create, update, and manage grid layouts with mini-apps, iframes, and external links. Use when working with Universal Profile grids, LSP28 data encoding, VerifiableURI format, or The Grid feature on LUKSO.
---

# LSP28 The Grid Skill

Manage LSP28 The Grid on Universal Profiles. Create modular grid layouts with tabs, mini-apps, iframes, social embeds, images, and text blocks.

## Quick Start

### 1. Configure Environment

```bash
export UP_PRIVATE_KEY="your_controller_private_key"
export UP_ADDRESS="your_universal_profile_address"
export KEY_MANAGER="your_key_manager_address"
```

### 2. Build Grid Layout

The LSP28 grid is stored as a `LSP28TheGrid` JSON object — an array of **tabs**, each containing an array of **grid elements**.

```javascript
const { ethers } = require('ethers');

// Grid data structure — LSP28TheGrid array-of-tabs format
// Reference: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
const gridData = {
  LSP28TheGrid: [
    {
      title: 'My Socials',
      gridColumns: 2,
      visibility: 'public',   // optional: 'public' | 'private'
      grid: [
        {
          width: 2,
          height: 2,
          type: 'TEXT',
          properties: {
            title: 'Welcome',
            titleColor: '#ffffff',
            text: 'Building on LUKSO 🆙',
            textColor: '#cccccc',
            backgroundColor: '#1a1a2e',
            link: 'https://universaleverything.io'
          }
        },
        {
          width: 1,
          height: 3,
          type: 'IFRAME',
          properties: {
            src: 'https://example.com/embed',
            allow: 'accelerometer; autoplay; clipboard-write',
            sandbox: 'allow-forms;allow-pointer-lock;allow-popups;allow-same-origin;allow-scripts;allow-top-navigation',
            allowfullscreen: true
          }
        },
        {
          width: 2,
          height: 2,
          type: 'IMAGES',
          properties: {
            type: 'carousel',
            images: [
              'https://example.com/photo1.jpg',
              'https://example.com/photo2.jpg'
            ]
          }
        },
        {
          width: 2,
          height: 1,
          type: 'X',
          properties: {
            type: 'post',
            username: 'lukso_io',
            id: '1804519711377436675',
            theme: 'light',
            language: 'en',
            donottrack: true
          }
        }
      ]
    },
    {
      title: 'Widgets',
      gridColumns: 2,
      grid: [
        {
          width: 2,
          height: 1,
          type: 'ELFSIGHT',
          properties: {
            id: 'your-elfsight-widget-id'
          }
        }
      ]
    }
  ]
};
```

### 3. Encode as VerifiableURI and Set On-Chain

The grid JSON is stored as a [VerifiableURI](https://docs.lukso.tech/standards/metadata/lsp2-json-schema/#verifiableuri) — a compact bytes encoding pairing a content hash with a URI.

#### Option A: Using ERC725.js (recommended)

```javascript
const { ERC725 } = require('@erc725/erc725.js');

const LSP28_SCHEMA = [
  {
    name: 'LSP28TheGrid',
    key: '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff',
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'VerifiableURI'
  }
];

// Encode the full grid JSON as a base64 data URI
const jsonString = JSON.stringify(gridData);
const base64Data = Buffer.from(jsonString).toString('base64');
const dataUri = `data:application/json;base64,${base64Data}`;

// ERC725.js encodes the VerifiableURI bytes (hash + URI) correctly
const erc725 = new ERC725(LSP28_SCHEMA);
const encoded = erc725.encodeData([
  { keyName: 'LSP28TheGrid', value: { url: dataUri } }
]);
// encoded.values[0] is the hex-encoded VerifiableURI bytes to pass to setData
const verifiableUriBytes = encoded.values[0];
```

#### Option B: Manual encoding with ethers.js

```javascript
// VerifiableURI format (LSP2): hashFunctionBytes2 + hash + uri
// For on-chain base64, hash is keccak256 of the raw JSON string
const jsonString = JSON.stringify(gridData);
const contentHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
const base64Data = Buffer.from(jsonString).toString('base64');
const dataUri = `data:application/json;base64,${base64Data}`;

// Pack: 0x6f357c6a (keccak256(utf8) method ID, bytes2) + hash (bytes32) + URI bytes
const hashFunction = '0x6f357c6a';  // keccak256(utf8) selector
const verifiableUriBytes = ethers.concat([
  hashFunction,
  contentHash,
  ethers.toUtf8Bytes(dataUri)
]);
```

### 4. Execute Transaction

```javascript
// LSP28 Grid data key — keccak256('LSP28TheGrid')
// Reference: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
const LSP28_GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

// Minimal ABIs
const LSP0_ABI = ['function setData(bytes32 dataKey, bytes dataValue) external'];
const LSP6_ABI = ['function execute(bytes calldata payload) external payable returns (bytes memory)'];

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.lukso.network');
const wallet = new ethers.Wallet(process.env.UP_PRIVATE_KEY, provider);

// Encode setData call on UP
const upInterface = new ethers.Interface(LSP0_ABI);
const executeData = upInterface.encodeFunctionData('setData', [
  LSP28_GRID_KEY,
  verifiableUriBytes   // from Option A or B above
]);

// Send via KeyManager
const keyManager = new ethers.Contract(process.env.KEY_MANAGER, LSP6_ABI, wallet);
const tx = await keyManager.execute(executeData);
const receipt = await tx.wait();
console.log('Grid updated in block:', receipt.blockNumber);
```

---

## Data Structure Reference

### Tab Properties

Each object in the `LSP28TheGrid` array is a **tab**:

| Property | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Display name of the tab |
| `gridColumns` | number | ✅ | Number of columns (recommended: 2–4) |
| `visibility` | string | ❌ | `'public'` or `'private'` (UI hint only — data is still on-chain) |
| `grid` | array | ✅ | Array of grid elements |

### Grid Element Common Properties

Each element in a tab's `grid` array:

| Property | Type | Required | Description |
|---|---|---|---|
| `width` | number | ✅ | Width in grid steps (recommended: 1–3) |
| `height` | number | ✅ | Height in grid steps (recommended: 1–3) |
| `type` | string | ✅ | Element type (see below) |
| `properties` | object | ✅ | Type-specific configuration |

### Element Types

**IFRAME — Embedded Web Content / Mini-Apps**
```javascript
{
  width: 2, height: 3,
  type: 'IFRAME',
  properties: {
    src: 'https://my-mini-app.com',                         // Required: URL to embed
    allow: 'accelerometer; autoplay; clipboard-write',      // Optional: Permissions Policy
    sandbox: 'allow-forms;allow-pointer-lock;allow-popups;allow-same-origin;allow-scripts;allow-top-navigation',
    allowfullscreen: true,                                   // Optional
    referrerpolicy: 'no-referrer'                           // Optional
  }
}
```

**TEXT — Text Content Block**
```javascript
{
  width: 2, height: 2,
  type: 'TEXT',
  properties: {
    title: 'About Me',               // Optional (supports Markdown)
    titleColor: '#ffffff',           // Optional: override title color
    text: 'Building on **LUKSO** 🆙',// Optional: body text (supports Markdown)
    textColor: '#cccccc',            // Optional: text color
    backgroundColor: '#1a1a2e',      // Optional: background color (hex)
    backgroundImage: 'https://...',  // Optional: background image URL
    link: 'https://lukso.network'    // Optional: makes entire block clickable
  }
}
```

**IMAGES — Image Gallery**
```javascript
{
  width: 2, height: 2,
  type: 'IMAGES',
  properties: {
    type: 'carousel',               // Optional: 'grid' (default) or 'carousel'
    images: [                       // Required: array of image URLs
      'https://example.com/photo1.jpg',
      'ipfs://bafk.../photo2.jpg'   // IPFS URLs also work
    ]
  }
}
```

**X — X/Twitter Embed**
```javascript
{
  width: 2, height: 1,
  type: 'X',
  properties: {
    type: 'post',                   // 'post' or 'timeline'
    username: 'lukso_io',           // X/Twitter handle
    id: '1804519711377436675',      // Post ID (required for type: 'post')
    theme: 'light',                 // 'light' or 'dark'
    language: 'en',                 // language code
    donottrack: true                // Opt out of tracking
  }
}
```

**ELFSIGHT — Widget Embed**
```javascript
{
  width: 2, height: 1,
  type: 'ELFSIGHT',
  properties: {
    id: 'your-elfsight-widget-id'   // Required: Elfsight widget ID
  }
}
```

**INSTAGRAM — Instagram Post Embed**
```javascript
{
  width: 2, height: 2,
  type: 'INSTAGRAM',
  properties: {
    type: 'p',                      // 'p' for post, 'reel' for reel
    id: 'your-instagram-post-id'
  }
}
```

**QR_CODE — QR Code**
```javascript
{
  width: 2, height: 1,
  type: 'QR_CODE',
  properties: {
    data: 'https://universaleverything.io/your-profile'  // Data to encode in QR
  }
}
```

---

## Important Constants

| Constant | Value | Description |
|---|---|---|
| `LSP28_GRID_KEY` | `0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff` | ERC725Y data key — keccak256('LSP28TheGrid') |
| Chain ID | `42` | LUKSO Mainnet |
| RPC URL | `https://rpc.mainnet.lukso.network` | Public RPC endpoint |

> ⚠️ **Draft standard note:** LSP28 is currently a draft. The data key is not yet exported from `@lukso/lsp-smart-contracts`. Define the ERC725Y schema inline (as shown above) until the standard is finalised.

---

## VerifiableURI Encoding Details

The `valueContent` of the LSP28 key is `VerifiableURI` (defined in LSP2). It is **not** a plain string — it's a bytes-encoded structure:

```
bytes2  hashFunctionSelector   // 0x6f357c6a = keccak256(utf8)
bytes32 contentHash            // keccak256 hash of the JSON string
bytes   uri                    // UTF-8 encoded URI (data: or ipfs://)
```

**Using ERC725.js** handles this encoding automatically and is the recommended approach. The manual ethers.js encoding in Option B above is provided for reference only.

For large grids, prefer uploading JSON to **IPFS** and using the `ipfs://` URI instead of the `data:application/json;base64` inline approach. This keeps on-chain storage small.

---

## Color Contrast Requirements

| Background | Text Color | Result |
|---|---|---|
| `#1a1a2e` (dark) | `#ffffff` (white) | ✅ Good contrast |
| `#ffffff` (white) | `#000000` (black) | ✅ Good contrast |
| `#fe005b` (pink) | `#ffffff` (white) | ✅ Good contrast |
| `#000000` (black) | `#fe005b` (pink) | ✅ Good contrast |

---

## Common Mistakes

❌ **Wrong data key** (old/incorrect hash):
```javascript
// WRONG — old incorrect value:
const LSP28_GRID_KEY = '0x31cf14955c5b0052c1491ec06644438ec7c14454be5eb6cb9ce4e4edef647423';

// CORRECT — keccak256('LSP28TheGrid'):
const LSP28_GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
```

❌ **Old flat grid format** (pre-LSP28 spec):
```javascript
// WRONG — outdated format with isEditable/items:
const gridData = { isEditable: true, items: [...] };

// CORRECT — LSP28TheGrid array-of-tabs structure:
const gridData = { LSP28TheGrid: [{ title: '...', gridColumns: 2, grid: [...] }] };
```

❌ **Passing plain string instead of VerifiableURI bytes:**
```javascript
// WRONG — setData expects VerifiableURI bytes, not a raw UTF-8 string:
setData(key, ethers.toUtf8Bytes(verifiableUri))

// CORRECT — use ERC725.js encodeData() or manual VerifiableURI packing
```

---

## Transaction Flow

```
Controller Key
    ↓
KeyManager.execute(payload)
    ↓
UP.setData(LSP28_GRID_KEY, verifiableUriBytes)
    ↓
Grid updated on-chain
```

---

## CLI Usage

```bash
# Use the built-in example grid
node scripts/update-grid.js --example

# Load from a JSON file
node scripts/update-grid.js --file my-grid.json
```

---

## References

- `references/lsp28-spec.md` — Full LSP28 specification reference
- `scripts/update-grid.js` — Complete working example script
- LSP28 Standard: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-28-TheGrid.md
- LUKSO Docs — Setting Your Grid: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
- LSP2 VerifiableURI: https://docs.lukso.tech/standards/metadata/lsp2-json-schema/#verifiableuri
- ERC725.js encodeData: https://docs.lukso.tech/tools/libraries/erc725js/methods/#encodedata
