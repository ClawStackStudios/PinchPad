export function generateBase62(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBuffer = new Uint8Array(1);
  
  while (result.length < length) {
    window.crypto.getRandomValues(randomBuffer);
    const val = randomBuffer[0];
    if (val < 248) { // 256 - (256 % 62) = 248
      result += charset[val % 62];
    }
  }
  return result;
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function downloadIdentityFile(username: string, uuid: string, token: string) {
  const identity = {
    username,
    uuid,
    token,
    createdAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(identity, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pinchpad_identity_${username}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
