import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const DATA_DIR = process.env.DATA_DIR || './data';

/**
 * Generates a self-signed SSL certificate using the system's openssl binary.
 * This avoids external NPM dependencies and aligns with sovereign architecture.
 */
export function generateSelfSignedCert() {
  const CERT_PATH = process.env.CERT_PATH;
  
  // Priority 1: User-provided certificate directory via env
  if (CERT_PATH && existsSync(join(CERT_PATH, 'cert.pem'))) {
    console.log('🔒 Using user-provided certificate from:', CERT_PATH);
    return { cert: join(CERT_PATH, 'cert.pem'), key: join(CERT_PATH, 'key.pem') };
  }

  // Skip if auto-generation is explicitly disabled
  if (process.env.ENABLE_AUTO_CERT === 'false') {
    console.log('🔒 Auto-cert generation disabled via ENABLE_AUTO_CERT=false');
    return null;
  }

  // Priority 2: Check if certs already exist in DATA_DIR
  const certPath = join(DATA_DIR, 'cert.pem');
  const keyPath = join(DATA_DIR, 'key.pem');

  if (existsSync(certPath) && existsSync(keyPath)) {
    console.log('🔒 Certificate already exists, reusing existing files.');
    return { cert: certPath, key: keyPath };
  }

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log('🔒 Generating self-signed SSL certificate via openssl binary...');
  try {
    // Generate 2048-bit RSA key and self-signed certificate (365 days)
    // -nodes: No passphrase for the private key
    // -subj: Non-interactive subject field
    const cmd = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`;
    
    execSync(cmd, { stdio: 'inherit' });
    
    console.log(`✅ Certificate generated: ${certPath}`);
    console.log(`✅ Private key generated: ${keyPath}`);

    return { cert: certPath, key: keyPath };
  } catch (error: any) {
    console.error('❌ Failed to generate certificate via openssl binary. Ensure openssl is installed in the environment.');
    console.error('   Error:', error.message);
    return null;
  }
}

/**
 * Returns the currently active certificate paths if they exist.
 */
export function getCertPaths() {
  const CERT_PATH = process.env.CERT_PATH;
  if (CERT_PATH && existsSync(join(CERT_PATH, 'cert.pem'))) {
    return { cert: join(CERT_PATH, 'cert.pem'), key: join(CERT_PATH, 'key.pem') };
  }

  const certPath = join(DATA_DIR, 'cert.pem');
  const keyPath = join(DATA_DIR, 'key.pem');

  if (existsSync(certPath) && existsSync(keyPath)) {
    return { cert: certPath, key: keyPath };
  }

  return null;
}
