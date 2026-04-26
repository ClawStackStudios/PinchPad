#!/usr/bin/env node

/**
 * Truthpack Validator Hook
 * Validates code against .crustagent/vibecheck/truthpack/
 * Runs on file edits in Claude Code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get project root
const projectRoot = process.cwd();
const truthpackDir = path.join(projectRoot, '.crustagent/vibecheck/truthpack');

// Load truthpack files
function loadTruthpack() {
  try {
    return {
      routes: JSON.parse(fs.readFileSync(path.join(truthpackDir, 'routes.json'), 'utf8')),
      env: JSON.parse(fs.readFileSync(path.join(truthpackDir, 'env.json'), 'utf8')),
      auth: JSON.parse(fs.readFileSync(path.join(truthpackDir, 'auth.json'), 'utf8')),
      stability: JSON.parse(fs.readFileSync(path.join(truthpackDir, 'stability-locks.json'), 'utf8')),
    };
  } catch (err) {
    console.error(`❌ Failed to load truthpack: ${err.message}`);
    process.exit(1);
  }
}

// Parse file content for violations
function validateFileContent(filePath, content, truthpack) {
  const violations = [];
  const lines = content.split('\n');
  const seenViolations = new Set(); // Track duplicates

  // Check for unknown env vars
  const envVarPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let match;
  while ((match = envVarPattern.exec(content)) !== null) {
    const varName = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;

    // Only flag if it's not in truthpack and we haven't already reported it
    if (!truthpack.env.find(e => e.key === varName) && !seenViolations.has(varName)) {
      seenViolations.add(varName);
      violations.push({
        type: 'UNKNOWN_ENV_VAR',
        severity: 'WARN',
        line: lineNum,
        message: `Unknown env var '${varName}' — not in truthpack`,
        code: lines[lineNum - 1]?.trim() || '',
      });
    }
  }

  // Check for route violations (new routes should be in truthpack)
  if (filePath.includes('server.js') || filePath.includes('routes/')) {
    const routePattern = /\.(get|post|put|patch|delete)\s*\(\s*['"](\/[^'"]*)['"]/gi;
    const seenRoutes = new Set();

    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      const routeKey = `${method}:${routePath}`;

      if (!seenRoutes.has(routeKey)) {
        seenRoutes.add(routeKey);

        // Check if route exists in truthpack
        const knownRoute = truthpack.routes.find(
          r => r.method === method && r.path === routePath
        );

        if (!knownRoute) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          violations.push({
            type: 'UNKNOWN_ROUTE',
            severity: 'WARN',
            line: lineNum,
            message: `Route ${method} ${routePath} not in truthpack`,
            code: lines[lineNum - 1]?.trim() || '',
          });
        }
      }
    }
  }

  return violations;
}

// Format output
function formatViolations(violations) {
  if (violations.length === 0) {
    return '✅ No violations detected against truthpack';
  }

  let output = `\n⚠️  Truthpack Violations (${violations.length}):\n`;
  output += '─'.repeat(60) + '\n';

  violations.forEach((v, idx) => {
    const icon = v.severity === 'ERROR' ? '❌' : '⚠️ ';
    output += `${idx + 1}. ${icon} ${v.type}\n`;
    output += `   Line ${v.line}: ${v.message}\n`;
    output += `   Code: ${v.code}\n\n`;
  });

  output += '─'.repeat(60) + '\n';
  output += 'See .crustagent/vibecheck/truthpack/ for ground truth\n';

  return output;
}

// Main — reads JSON from stdin (Claude Code hook protocol)
async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;

  let filePath = '';
  let fileContent = '';

  try {
    const input = JSON.parse(raw);
    // Claude Code passes tool_input with file_path and new_content (Write) or file_path (Edit)
    filePath = input?.tool_input?.file_path || '';
    fileContent = input?.tool_input?.new_content || input?.tool_input?.content || '';

    // For Edit tool, content is the new_string — fall back to reading the file directly
    if (!fileContent && filePath) {
      try {
        fileContent = fs.readFileSync(filePath, 'utf8');
      } catch {
        // File unreadable — skip validation silently
        process.exit(0);
      }
    }
  } catch {
    // Malformed stdin — skip silently, don't block Claude
    process.exit(0);
  }

  if (!filePath) process.exit(0);

  const truthpack = loadTruthpack();
  const violations = validateFileContent(filePath, fileContent, truthpack);

  const output = formatViolations(violations);
  process.stdout.write(output + '\n');

  // Exit 2 = blocking (errors only). Warnings are non-blocking (exit 0).
  const hasErrors = violations.some(v => v.severity === 'ERROR');
  process.exit(hasErrors ? 2 : 0);
}

main();
