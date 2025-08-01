
export async function key_downloader(kind: 'public' | 'private', key: CryptoKey) {
  const file_name = kind == 'public' ? 'pub.key' : 'priv.key';
  const bytes = await crypto.subtle.exportKey(kind == 'public' ? 'spki' : 'pkcs8', key);
  const blob = new Blob([bytes], { type: "application/x-ckey-file" });
  return () => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file_name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ===============================================
// |
// |    RSA Key Management
// |
// -----------------------------------------------

export async function generate_rsa_keys() {
  const keys = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const crypt = key_encryption_helpers(keys);
  return {
    get private_key() { return keys.privateKey; },
    get public_key() { return keys.publicKey; },

    export_private_key: () => crypto.subtle.exportKey('pkcs8', keys.privateKey),
    export_public_key: () => crypto.subtle.exportKey('spki', keys.publicKey),

    encrypt: crypt.encrypt,
    decrypt: crypt.decrypt,
  };
}

export function key_encryption_helpers({ privateKey, publicKey }: { privateKey: CryptoKey; publicKey: CryptoKey }) {
  return {
    encrypt: async (data: string | BufferSource) => {
      const encoder = new TextEncoder();
      const bytes = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        typeof data === 'string' ? encoder.encode(data) : data
      );
      return bytes;
    },

    decrypt: async (data: BufferSource) => {
      const bytes = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        data,
      );
      return bytes;
    },
  } as const;
}


// ===============================================
// |
// |    EDCH Key Management
// |
// -----------------------------------------------


export async function generate_ecdh_keys() {
  const keys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  return {
    get private_key() { return keys.privateKey; },
    get public_key() { return keys.publicKey; },

    export_private_key: () => crypto.subtle.exportKey('pkcs8', keys.privateKey),
    export_public_key: () => crypto.subtle.exportKey('spki', keys.publicKey),

    derive: key_deriver(keys.privateKey),
  } as const;
}

export async function import_ecdh_key(buffer: ArrayBuffer | Uint8Array) {
  return await crypto.subtle.importKey(
    'spki',
    buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  )
}

export const generate_iv = () => crypto.getRandomValues(new Uint8Array(12));

export function key_deriver(private_key: CryptoKey) {
  return async (public_key: CryptoKey) => {
    const shared = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: public_key,
      },
      private_key,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return {
      encrypt: async (message: string, iv = generate_iv()) => {
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          shared,
          encoder.encode(message)
        );

        return { buffer: encrypted, iv };
      },

      decrypt: async (data: { buffer: ArrayBuffer | Uint8Array; iv: ArrayBuffer | Uint8Array }) => {
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: data.iv,
          },
          shared,
          data.buffer
        );

        return decoder.decode(decrypted);
      },
    };
  };
}
