# LSP28 The Grid — Specification Reference

## Overview

LSP28 The Grid is a standard for organizing and displaying modular content on Universal Profiles. It allows UP owners to create a multi-tab grid layout containing mini-apps, iframes, social embeds, images, text blocks, and other interactive content.

> **Draft standard:** LSP28 is currently a draft. The data key is not yet exported from `@lukso/lsp-smart-contracts`. Define the ERC725Y schema inline until the standard is finalised.

---

## Data Key

```
keccak256('LSP28TheGrid') = 0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff
```

⚠️ Note: An earlier draft used `0x31cf14955c5b0052c1491ec06644438ec7c14454be5eb6cb9ce4e4edef647423` — this is **incorrect** and should not be used.

**ERC725Y JSON Schema:**
```json
{
  "name": "LSP28TheGrid",
  "key": "0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff",
  "keyType": "Singleton",
  "valueType": "bytes",
  "valueContent": "VerifiableURI"
}
```

---

## Data Format

The grid data is stored as a **VerifiableURI** (defined by [LSP2](https://docs.lukso.tech/standards/metadata/lsp2-json-schema/#verifiableuri)).

### VerifiableURI Bytes Layout

```
bytes2  hashFunctionSelector   // 0x6f357c6a = keccak256(utf8) selector
bytes32 contentHash            // keccak256 hash of the JSON string (or IPFS content)
bytes   uri                    // UTF-8 encoded URI (data:application/json;base64,... or ipfs://...)
```

The URI points to the JSON data — either:
- **Inline base64**: `data:application/json;base64,<base64-encoded-json>` (convenient, on-chain)
- **IPFS**: `ipfs://<CID>` (preferred for large grids; keeps on-chain storage minimal)

Use `ERC725.encodeData()` from [erc725.js](https://docs.lukso.tech/tools/libraries/erc725js/methods/#encodedata) for correct encoding.

---

## JSON Schema

```typescript
interface LSP28TheGridData {
  LSP28TheGrid: Tab[];
}

interface Tab {
  title: string;           // Required: display name of the tab
  gridColumns: number;     // Required: number of columns (recommended 2–4)
  visibility?: 'public' | 'private';  // Optional: UI hint only (data still on-chain)
  grid: GridElement[];     // Required: array of grid elements
}

interface GridElement {
  width: number;           // Required: width in grid steps (recommended 1–3)
  height: number;          // Required: height in grid steps (recommended 1–3)
  type: ElementType;       // Required: element type (see below)
  properties: object;      // Required: type-specific properties
}

type ElementType =
  | 'IFRAME'
  | 'TEXT'
  | 'IMAGES'
  | 'X'
  | 'ELFSIGHT'
  | 'INSTAGRAM'
  | 'QR_CODE';
  // Custom types are also allowed by the spec
```

---

## Element Types

### IFRAME — Embedded Web Content / Mini-Apps

```json
{
  "width": 2,
  "height": 3,
  "type": "IFRAME",
  "properties": {
    "src": "https://my-mini-app.com",
    "allow": "accelerometer; autoplay; clipboard-write",
    "sandbox": "allow-forms;allow-pointer-lock;allow-popups;allow-same-origin;allow-scripts;allow-top-navigation",
    "allowfullscreen": true,
    "referrerpolicy": "no-referrer"
  }
}
```

| Property | Required | Description |
|---|---|---|
| `src` | ✅ | URL to embed |
| `allow` | ❌ | Iframe [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#allow) |
| `sandbox` | ❌ | Iframe [sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox) restrictions |
| `allowfullscreen` | ❌ | Allow fullscreen mode |
| `referrerpolicy` | ❌ | Referrer policy |

### TEXT — Text Content Block

```json
{
  "width": 2,
  "height": 2,
  "type": "TEXT",
  "properties": {
    "title": "About Me",
    "titleColor": "#ffffff",
    "text": "Building on **LUKSO** 🆙",
    "textColor": "#cccccc",
    "backgroundColor": "#1a1a2e",
    "backgroundImage": "https://example.com/bg.jpg",
    "link": "https://lukso.network"
  }
}
```

| Property | Required | Description |
|---|---|---|
| `title` | ❌ | Title text (supports Markdown) |
| `titleColor` | ❌ | Override color for the title |
| `text` | ❌ | Body text (supports Markdown) |
| `textColor` | ❌ | Text color (hex) |
| `backgroundColor` | ❌ | Background color (hex) |
| `backgroundImage` | ❌ | Background image URL |
| `link` | ❌ | Makes the entire block clickable |

### IMAGES — Image Gallery

```json
{
  "width": 2,
  "height": 2,
  "type": "IMAGES",
  "properties": {
    "type": "carousel",
    "images": [
      "https://example.com/photo1.jpg",
      "ipfs://bafk.../photo2.jpg"
    ]
  }
}
```

| Property | Required | Description |
|---|---|---|
| `images` | ✅ | Array of image URLs (HTTPS or IPFS) |
| `type` | ❌ | `'grid'` (default) or `'carousel'` |

### X — X/Twitter Embed

```json
{
  "width": 2,
  "height": 1,
  "type": "X",
  "properties": {
    "type": "post",
    "username": "lukso_io",
    "id": "1804519711377436675",
    "theme": "light",
    "language": "en",
    "donottrack": true
  }
}
```

| Property | Required | Description |
|---|---|---|
| `type` | ✅ | `'post'` or `'timeline'` |
| `username` | ✅ | X/Twitter handle |
| `id` | ✅ (for post) | Post ID |
| `theme` | ❌ | `'light'` or `'dark'` |
| `language` | ❌ | Language code (e.g. `'en'`) |
| `donottrack` | ❌ | Opt out of tracking |

### ELFSIGHT — Widget Embed

```json
{
  "width": 2,
  "height": 1,
  "type": "ELFSIGHT",
  "properties": {
    "id": "your-elfsight-widget-id"
  }
}
```

| Property | Required | Description |
|---|---|---|
| `id` | ✅ | Elfsight widget ID |

### INSTAGRAM — Instagram Post Embed

```json
{
  "width": 2,
  "height": 2,
  "type": "INSTAGRAM",
  "properties": {
    "type": "p",
    "id": "your-post-id"
  }
}
```

| Property | Required | Description |
|---|---|---|
| `type` | ✅ | `'p'` (post) or `'reel'` |
| `id` | ✅ | Instagram post/reel ID |

### QR_CODE — QR Code

```json
{
  "width": 2,
  "height": 1,
  "type": "QR_CODE",
  "properties": {
    "data": "https://universaleverything.io/your-profile"
  }
}
```

| Property | Required | Description |
|---|---|---|
| `data` | ✅ | Data to encode in the QR code |

---

## Best Practices

### Width / Height Layout

- `gridColumns` on the tab controls how many columns the layout has (typically 2).
- Element `width` and `height` are in **grid steps** — e.g., `width: 2` on a 2-column grid spans the full width.
- Recommended: `width` 1–3, `height` 1–3 for most elements.
- Full-width banner: `{ width: gridColumns, height: 1 }`
- Square tile: `{ width: 1, height: 1 }`

### Color Contrast

Always ensure sufficient contrast between background and text:

| Background | Text | Contrast |
|---|---|---|
| `#1a1a2e` (dark) | `#ffffff` (white) | 15.8:1 ✅ |
| `#ffffff` (white) | `#000000` (black) | 21:1 ✅ |
| `#fe005b` (pink) | `#ffffff` (white) | 4.5:1 ✅ |
| `#000000` (black) | `#fe005b` (pink) | 4.5:1 ✅ |

### IPFS vs Inline Base64

For large grids (many elements or large images), upload the JSON to IPFS and use an `ipfs://` URI. This reduces on-chain storage costs significantly. For small grids, `data:application/json;base64,…` is convenient and avoids a separate IPFS dependency.

---

## Common Errors

### Wrong data key

```javascript
// ❌ WRONG — old incorrect hash:
const LSP28_GRID_KEY = '0x31cf14955c5b0052c1491ec06644438ec7c14454be5eb6cb9ce4e4edef647423';

// ✅ CORRECT — keccak256('LSP28TheGrid'):
const LSP28_GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';
```

### Old flat grid format

```javascript
// ❌ WRONG — outdated isEditable/items format:
const gridData = { isEditable: true, items: [{ type: 'miniapp', id: '...', ... }] };

// ✅ CORRECT — LSP28TheGrid array-of-tabs structure:
const gridData = {
  LSP28TheGrid: [{ title: 'Tab Name', gridColumns: 2, grid: [...] }]
};
```

### Wrong VerifiableURI encoding

```javascript
// ❌ WRONG — passing a raw string:
setData(key, ethers.toUtf8Bytes('data:application/json;base64,...'))

// ✅ CORRECT — use ERC725.js encodeData() or the manual concat approach:
const verifiableUriBytes = ethers.concat([hashFunctionSelector, contentHash, ethers.toUtf8Bytes(dataUri)]);
setData(key, verifiableUriBytes)
```

---

## Resources

- LSP28 Standard: https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-28-TheGrid.md
- LUKSO Docs — Setting Your Grid: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
- LSP2 VerifiableURI: https://docs.lukso.tech/standards/metadata/lsp2-json-schema/#verifiableuri
- ERC725.js encodeData: https://docs.lukso.tech/tools/libraries/erc725js/methods/#encodedata
