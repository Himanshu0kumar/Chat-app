/**
 * End-to-End Encryption Utilities using Web Crypto API
 * 
 * Flow:
 * 1. Each user maintains a persistent ECDH (P-256) key pair per user account.
 * 2. Public keys are exchanged over the WebSocket server as JWKs.
 * 3. Each client derives a shared AES-GCM (256-bit) symmetric key using ECDH.
 * 4. Messages and Files are encrypted with AES-GCM + random 12-byte IV.
 * 5. Ciphertext and IV are sent over WebSocket and persisted in DB; receiver decrypts locally.
 * 6. The server only sees ciphertext — raw plaintext and files NEVER leave the browser.
 */

/**
 * Generate ECDH key pair (P-256 curve)
 */
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Export private key to JWK JSON format for local storage persistence
 */
export async function exportPrivateKey(privateKey) {
  return await window.crypto.subtle.exportKey('jwk', privateKey);
}

/**
 * Import a stored JWK private key
 */
export async function importPrivateKey(jwk) {
  if (!jwk) throw new Error('Private key missing');
  let parsedJwk = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
  while (typeof parsedJwk === 'string') {
    parsedJwk = JSON.parse(parsedJwk);
  }
  return await window.crypto.subtle.importKey(
    'jwk',
    parsedJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Export public key to JWK JSON format
 */
export async function exportPublicKey(publicKey) {
  return await window.crypto.subtle.exportKey('jwk', publicKey);
}

/**
 * Import a peer's JWK public key
 */
export async function importPublicKey(jwk) {
  if (!jwk) throw new Error('Public key missing');
  let parsedJwk = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
  while (typeof parsedJwk === 'string') {
    parsedJwk = JSON.parse(parsedJwk);
  }
  return await window.crypto.subtle.importKey(
    'jwk',
    parsedJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Derive AES-GCM 256-bit shared key
 */
export async function deriveSharedKey(privateKey, remotePublicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: remotePublicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text string with AES-GCM
 */
export async function encryptMessage(sharedKey, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    data
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt text string with AES-GCM
 */
export async function decryptMessage(sharedKey, ciphertextBase64, ivBase64) {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt a File ArrayBuffer with AES-GCM
 */
export async function encryptFile(sharedKey, fileArrayBuffer) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    sharedKey,
    fileArrayBuffer
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a File ArrayBuffer with AES-GCM
 */
export async function decryptFile(sharedKey, ciphertextBase64, ivBase64) {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  return await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    ciphertextBuffer
  );
}

/**
 * Compute key fingerprint (SHA-256)
 */
export async function computeKeyFingerprint(jwk) {
  const str = JSON.stringify(jwk);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const chunks = hex.toUpperCase().match(/.{1,4}/g) || [];
  return chunks.slice(0, 4).join(':');
}

// Helpers
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
