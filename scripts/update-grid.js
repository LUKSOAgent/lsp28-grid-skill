const { ethers } = require('ethers');
const fs = require('fs');

// Configuration — set via environment variables or edit directly
const PRIVATE_KEY = process.env.UP_PRIVATE_KEY || 'YOUR_CONTROLLER_PRIVATE_KEY';
const UP_ADDRESS = process.env.UP_ADDRESS || 'YOUR_UP_ADDRESS';
const KEY_MANAGER = process.env.KEY_MANAGER || 'YOUR_KEY_MANAGER_ADDRESS';
const RPC_URL = process.env.RPC_URL || 'https://rpc.mainnet.lukso.network';

// LSP28 Grid Data Key — keccak256('LSP28TheGrid')
// Reference: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
// ⚠️ Draft standard: key not yet exported from @lukso/lsp-smart-contracts; defined inline.
const LSP28_GRID_KEY = '0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff';

// Minimal ABIs
const LSP0_ABI = [
  'function setData(bytes32 dataKey, bytes dataValue) external',
  'function getData(bytes32 dataKey) external view returns (bytes)'
];

const LSP6_ABI = [
  'function execute(bytes calldata payload) external payable returns (bytes memory)'
];

/**
 * Encode grid JSON as a VerifiableURI (LSP2 format).
 *
 * VerifiableURI bytes layout:
 *   bytes2  hashFunctionSelector  — 0x6f357c6a (keccak256(utf8))
 *   bytes32 contentHash           — keccak256 of the raw JSON string
 *   bytes   uri                   — UTF-8 encoded data URI
 *
 * For large grids, prefer uploading to IPFS and using an ipfs:// URI
 * to keep on-chain storage small.
 *
 * @param {object} gridData - The LSP28TheGrid JSON object
 * @returns {Uint8Array} Encoded VerifiableURI bytes
 */
function encodeVerifiableUri(gridData) {
  const jsonString = JSON.stringify(gridData);
  const contentHash = ethers.keccak256(ethers.toUtf8Bytes(jsonString));
  const base64Data = Buffer.from(jsonString).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;

  // keccak256(utf8) hash-function selector (2 bytes)
  const hashFunctionSelector = '0x6f357c6a';

  return ethers.concat([
    hashFunctionSelector,
    contentHash,
    ethers.toUtf8Bytes(dataUri)
  ]);
}

/**
 * Update the LSP28 Grid on a Universal Profile.
 *
 * @param {object} gridData - Must follow the LSP28TheGrid array-of-tabs structure
 */
async function updateGrid(gridData) {
  console.log('🔄 Updating LSP28 Grid...\n');

  // Validate top-level structure
  if (!gridData.LSP28TheGrid || !Array.isArray(gridData.LSP28TheGrid)) {
    throw new Error(
      'Invalid grid format. Expected { LSP28TheGrid: [...] }. ' +
      'See https://docs.lukso.tech/learn/mini-apps/setting-your-grid/'
    );
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const tabs = gridData.LSP28TheGrid;
  const totalElements = tabs.reduce((acc, tab) => acc + (tab.grid ? tab.grid.length : 0), 0);

  console.log(`Tabs: ${tabs.length}`);
  console.log(`Total grid elements: ${totalElements}`);

  // Encode as VerifiableURI
  const verifiableUriBytes = encodeVerifiableUri(gridData);
  console.log(`VerifiableURI bytes length: ${verifiableUriBytes.length}`);

  // Encode setData calldata
  const upInterface = new ethers.Interface(LSP0_ABI);
  const setDataCalldata = upInterface.encodeFunctionData('setData', [
    LSP28_GRID_KEY,
    verifiableUriBytes
  ]);

  // Execute via KeyManager
  const keyManager = new ethers.Contract(KEY_MANAGER, LSP6_ABI, wallet);

  console.log('\n📤 Sending transaction...');
  const tx = await keyManager.execute(setDataCalldata);
  console.log('Transaction hash:', tx.hash);

  const receipt = await tx.wait();
  console.log('✅ Confirmed in block:', receipt.blockNumber);

  return receipt;
}

// ─── Example Grid ─────────────────────────────────────────────────────────────
//
// Full LSP28TheGrid structure: array of tabs, each with typed grid elements.
// Supported element types: IFRAME, TEXT, IMAGES, X, ELFSIGHT, INSTAGRAM, QR_CODE
// Reference: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/
//
const EXAMPLE_GRID = {
  LSP28TheGrid: [
    {
      title: 'Home',
      gridColumns: 2,
      visibility: 'public',
      grid: [
        // TEXT block — introduction / bio
        {
          width: 2,
          height: 2,
          type: 'TEXT',
          properties: {
            title: 'Welcome to my Profile',
            titleColor: '#ffffff',
            text: 'Building on **LUKSO** 🆙',
            textColor: '#cccccc',
            backgroundColor: '#1a1a2e',
            link: 'https://universaleverything.io'
          }
        },
        // IFRAME — embed a Mini-App or external dApp
        {
          width: 2,
          height: 3,
          type: 'IFRAME',
          properties: {
            src: 'https://example.com/mini-app',
            allow: 'accelerometer; autoplay; clipboard-write',
            sandbox: 'allow-forms;allow-pointer-lock;allow-popups;allow-same-origin;allow-scripts;allow-top-navigation',
            allowfullscreen: true,
            referrerpolicy: 'no-referrer'
          }
        },
        // IMAGES — photo gallery or carousel
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
        }
      ]
    },
    {
      title: 'Socials',
      gridColumns: 2,
      grid: [
        // X (Twitter) post embed
        {
          width: 2,
          height: 2,
          type: 'X',
          properties: {
            type: 'post',
            username: 'lukso_io',
            id: '1804519711377436675',
            theme: 'light',
            language: 'en',
            donottrack: true
          }
        },
        // ELFSIGHT widget
        {
          width: 2,
          height: 1,
          type: 'ELFSIGHT',
          properties: {
            id: 'your-elfsight-widget-id'
          }
        },
        // QR code
        {
          width: 2,
          height: 1,
          type: 'QR_CODE',
          properties: {
            data: 'https://universaleverything.io/your-profile'
          }
        }
      ]
    }
  ]
};

// ─── CLI ──────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--file') {
    const gridFile = args[1];
    if (!gridFile) {
      console.error('Error: --file requires a path argument');
      process.exit(1);
    }
    const gridData = JSON.parse(fs.readFileSync(gridFile, 'utf8'));
    updateGrid(gridData).catch(console.error);
  } else if (args[0] === '--example') {
    updateGrid(EXAMPLE_GRID).catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  node update-grid.js --file grid.json    # Load from JSON file');
    console.log('  node update-grid.js --example          # Use built-in example grid');
    console.log('');
    console.log('Environment variables:');
    console.log('  UP_PRIVATE_KEY  — Controller private key');
    console.log('  UP_ADDRESS      — Universal Profile address (informational)');
    console.log('  KEY_MANAGER     — Key Manager contract address');
    console.log('  RPC_URL         — LUKSO RPC endpoint (default: mainnet)');
    console.log('');
    console.log('Grid format: { LSP28TheGrid: [{ title, gridColumns, grid: [...] }] }');
    console.log('Docs: https://docs.lukso.tech/learn/mini-apps/setting-your-grid/');
    process.exit(1);
  }
}

module.exports = { updateGrid, encodeVerifiableUri, LSP28_GRID_KEY, EXAMPLE_GRID };
