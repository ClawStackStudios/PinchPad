export async function deriveShellKey(huKey: string, userUuid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(huKey),
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(userUuid),
      info: encoder.encode('clawchives-shellcryption-v1')
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptField(plaintext: string, shellKey: CryptoKey, aad: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      additionalData: encoder.encode(aad)
    },
    shellKey,
    encoder.encode(plaintext)
  );

  const result = {
    v: 1,
    alg: 'AES-GCM-256',
    iv: arrayBufferToBase64(iv),
    ct: arrayBufferToBase64(ciphertextBuffer),
    aad
  };

  return JSON.stringify(result);
}

export async function decryptField(encryptedJson: string, shellKey: CryptoKey, aad: string): Promise<string> {
  try {
    const data = JSON.parse(encryptedJson);
    if (data.v !== 1 || data.alg !== 'AES-GCM-256' || data.aad !== aad) {
      throw new Error('Invalid encryption format or AAD mismatch');
    }

    const iv = base64ToArrayBuffer(data.iv);
    const ct = base64ToArrayBuffer(data.ct);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        additionalData: new TextEncoder().encode(aad)
      },
      shellKey,
      ct
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed: data may be tampered');
  }
}

export async function encryptRecord<T extends Record<string, any>>(
  record: T,
  sensitiveFields: (keyof T)[],
  shellKey: CryptoKey,
  table: string
): Promise<T> {
  const result = { ...record };
  const recordId = record.id || record.uuid;
  if (!recordId) throw new Error('Record must have an id or uuid for AAD');
  
  const aad = `${table}:${recordId}`;

  for (const field of sensitiveFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await encryptField(result[field] as string, shellKey, aad) as any;
    }
  }

  return result;
}

export async function decryptRecord<T extends Record<string, any>>(
  record: T,
  sensitiveFields: (keyof T)[],
  shellKey: CryptoKey,
  table: string
): Promise<T> {
  const result = { ...record };
  const recordId = record.id || record.uuid;
  if (!recordId) throw new Error('Record must have an id or uuid for AAD');
  
  const aad = `${table}:${recordId}`;

  for (const field of sensitiveFields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = await decryptField(result[field] as string, shellKey, aad) as any;
      } catch (e) {
        result[field] = '[Decryption Failed]' as any;
      }
    }
  }

  return result;
}
