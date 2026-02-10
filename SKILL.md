---
name: lsp28-grid
description: Manage LSP28 The Grid on LUKSO Universal Profiles. Create, update, and manage grid layouts with mini-apps, iframes, and external links. Use when working with Universal Profile grids, LSP28 data encoding, VerifiableURI format, or The Grid feature on LUKSO.
---

# LSP28 The Grid Skill

Manage LSP28 The Grid on Universal Profiles. Create grid layouts with mini-apps, iframes, and external links.

## Quick Start

### Update Grid Layout

```javascript
const { ethers } = require('ethers');

// Grid data structure
const gridData = {
  isEditable: true,
  items: [
    {
      type: 'miniapp',
      id: 'app1',
      title: 'My App',
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      text: 'Click me'
    },
    {
      type: 'iframe',
      src: 'https://example.com/embed',
      id: 'frame1',
      title: 'External Content'
    },
    {
      type: 'external',
      url: 'https://example.com',
      id: 'link1',
      title: 'Visit Site'
    }
  ]
};

// Encode as VerifiableURI
const jsonString = JSON.stringify(gridData);
const base64Data = Buffer.from(jsonString).toString('base64');
const verifiableUri = `data:application/json;base64,${base64Data}`;
```

### Execute via KeyManager

```javascript
// LSP28 Grid data key
const LSP28_GRID_KEY = '0x31cf14955c5b0052c1491ec06644438ec7c14454be5eb6cb9ce4e4edef647423';

// Encode execute payload
const upInterface = new ethers.Interface(LSP0_ABI);
const executeData = upInterface.encodeFunctionData('setData', [
  LSP28_GRID_KEY,
  ethers.toUtf8Bytes(verifiableUri)
]);

// Send via KeyManager
const keyManager = new ethers.Contract(keyManagerAddress, LSP6_ABI, wallet);
const tx = await keyManager.execute(executeData);
await tx.wait();
```

## Data Structure

### Grid Item Types

**Mini-App (type: 'miniapp')**
```javascript
{
  type: 'miniapp',
  id: 'unique-id',
  title: 'App Title',
  text: 'Button text',
  backgroundColor: '#fe005b',
  textColor: '#ffffff',
  size: 'medium' // small, medium, large
}
```

**IFrame (type: 'iframe')**
```javascript
{
  type: 'iframe',
  id: 'unique-id',
  title: 'Frame Title',
  src: 'https://example.com/embed'
}
```

**External Link (type: 'external')**
```javascript
{
  type: 'external',
  id: 'unique-id',
  title: 'Link Title',
  url: 'https://example.com'
}
```

### Full Grid Structure

```javascript
{
  isEditable: true,
  items: [
    // Array of grid items
  ]
}
```

## Important Keys

- **LSP28 Grid Data Key:** `0x31cf14955c5b0052c1491ec06644438ec7c14454be5eb6cb9ce4e4edef647423`

## Color Contrast Requirements

Ensure text is readable on background colors:

- Dark background (#1a1a2e) → Light text (#ffffff)
- Light background (#ffffff) → Dark text (#000000)
- Brand colors (#fe005b) → Light text (#ffffff)

## VerifiableURI Format

The grid data must be encoded as a VerifiableURI:

```
data:application/json;base64,<base64-encoded-json>
```

Example:
```javascript
const encoded = `data:application/json;base64,${Buffer.from(JSON.stringify(gridData)).toString('base64')}`;
```

## Transaction Flow

```
Controller Key → KeyManager.execute() → UP.setData() → Store Grid
```

## See Also

- References: `references/lsp28-spec.md` for full LSP28 specification
- Scripts: `scripts/update-grid.js` for working example
