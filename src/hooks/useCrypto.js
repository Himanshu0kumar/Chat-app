import { useState, useRef, useCallback } from 'react';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  encryptFile,
  decryptFile,
  computeKeyFingerprint,
} from '../lib/crypto';

export function useCrypto() {
  const [keys, setKeys] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const sharedKeysRef = useRef(new Map());
  const peerFingerprintsRef = useRef(new Map());

  // Initialize or restore persistent crypto identity per user account
  const initCrypto = useCallback(async (userId) => {
    setIsInitializing(true);
    try {
      const skStorageKey = `cipherchat_sk_${userId || 'guest'}`;
      const pkStorageKey = `cipherchat_pk_${userId || 'guest'}`;

      let privateKey, publicKey, jwk, fingerprint;

      const storedSk = localStorage.getItem(skStorageKey);
      const storedPk = localStorage.getItem(pkStorageKey);

      if (storedSk && storedPk) {
        // Restore existing user key pair
        const skJwk = JSON.parse(storedSk);
        const pkJwk = JSON.parse(storedPk);

        privateKey = await importPrivateKey(skJwk);
        publicKey = await importPublicKey(pkJwk);
        jwk = pkJwk;
        fingerprint = await computeKeyFingerprint(pkJwk);
        console.log(`[Crypto] Restored persistent ECDH keypair for user: ${userId}`);
      } else {
        // Generate new user key pair and persist to localStorage
        const keyPair = await generateKeyPair();
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;

        const skJwk = await exportPrivateKey(privateKey);
        const pkJwk = await exportPublicKey(publicKey);

        localStorage.setItem(skStorageKey, JSON.stringify(skJwk));
        localStorage.setItem(pkStorageKey, JSON.stringify(pkJwk));

        jwk = pkJwk;
        fingerprint = await computeKeyFingerprint(pkJwk);
        console.log(`[Crypto] Generated & saved new ECDH keypair for user: ${userId}`);
      }

      const cryptoState = {
        privateKey,
        publicKey,
        jwk,
        fingerprint,
      };

      setKeys(cryptoState);
      setIsInitializing(false);
      return cryptoState;
    } catch (err) {
      console.error('Failed to initialize crypto:', err);
      setIsInitializing(false);
      throw err;
    }
  }, []);

  const getOrCreateSharedKey = useCallback(async (peerUserId, peerJwk) => {
    if (!keys?.privateKey) {
      throw new Error('Local crypto identity not initialized');
    }

    if (!peerJwk) {
      throw new Error('Peer public key is missing');
    }

    // Cache key by combination of peerUserId + peerJwk thumbprint
    const cacheKey = `${peerUserId}_${peerJwk.x}_${peerJwk.y}`;

    if (sharedKeysRef.current.has(cacheKey)) {
      return sharedKeysRef.current.get(cacheKey);
    }

    const importedPeerPublicKey = await importPublicKey(peerJwk);
    const sharedKey = await deriveSharedKey(keys.privateKey, importedPeerPublicKey);
    const peerFingerprint = await computeKeyFingerprint(peerJwk);

    sharedKeysRef.current.set(cacheKey, sharedKey);
    peerFingerprintsRef.current.set(peerUserId, peerFingerprint);

    return sharedKey;
  }, [keys]);

  const encryptForPeer = useCallback(async (peerUserId, peerJwk, plaintext) => {
    const sharedKey = await getOrCreateSharedKey(peerUserId, peerJwk);
    return await encryptMessage(sharedKey, plaintext);
  }, [getOrCreateSharedKey]);

  const decryptFromPeer = useCallback(async (peerUserId, peerJwk, ciphertext, iv) => {
    const sharedKey = await getOrCreateSharedKey(peerUserId, peerJwk);
    return await decryptMessage(sharedKey, ciphertext, iv);
  }, [getOrCreateSharedKey]);

  const encryptFileForPeer = useCallback(async (peerUserId, peerJwk, fileArrayBuffer) => {
    const sharedKey = await getOrCreateSharedKey(peerUserId, peerJwk);
    return await encryptFile(sharedKey, fileArrayBuffer);
  }, [getOrCreateSharedKey]);

  const decryptFileFromPeer = useCallback(async (peerUserId, peerJwk, ciphertext, iv) => {
    const sharedKey = await getOrCreateSharedKey(peerUserId, peerJwk);
    return await decryptFile(sharedKey, ciphertext, iv);
  }, [getOrCreateSharedKey]);

  const getPeerFingerprint = useCallback((peerUserId) => {
    return peerFingerprintsRef.current.get(peerUserId) || 'UNKNOWN';
  }, []);

  return {
    keys,
    keyPair: keys,
    isInitializing,
    initCrypto,
    encryptForPeer,
    decryptFromPeer,
    encryptFileForPeer,
    decryptFileFromPeer,
    getPeerFingerprint,
  };
}
