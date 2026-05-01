import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

/**
 * Build Validation Gates — PinchPad Infrastructure Integrity
 * 
 * This test suite verifies that the project's "Infrastructure as Code" 
 * remains consistent and deployment-ready. It prevents regressions 
 * in Docker configuration and critical build paths.
 */

describe('Infrastructure Validation — Build Gates', () => {
  describe('Project Structure', () => {
    it('should have all critical configuration files', () => {
      const required = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'vite.config.ts',
        'server.ts'
      ];
      required.forEach(file => {
        expect(fs.existsSync(path.join(PROJECT_ROOT, file)), `Missing critical file: ${file}`).toBe(true);
      });
    });

    it('should have the src directory structure', () => {
      expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/server'))).toBe(true);
      expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/features'))).toBe(true);
      expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/shared'))).toBe(true);
      expect(fs.existsSync(path.join(PROJECT_ROOT, 'src/hooks'))).toBe(true);
    });
  });

  describe('Docker Configuration', () => {
    it('should have a valid production Dockerfile', () => {
      const dockerfile = path.join(PROJECT_ROOT, 'Dockerfile');
      expect(fs.existsSync(dockerfile)).toBe(true);

      const content = fs.readFileSync(dockerfile, 'utf-8');
      // Verify runtime stability requirements
      expect(content).toContain('npm install');
      expect(content).toContain('COPY --from=builder /app/src ./src');
      expect(content).toContain('EXPOSE 8282');
      expect(content).toContain('"npx"');
      expect(content).toContain('"tsx"');
      expect(content).toContain('"server.ts"');
    });

    it('should have a valid production docker-compose.yml', () => {
      const compose = path.join(PROJECT_ROOT, 'docker-compose.yml');
      expect(fs.existsSync(compose)).toBe(true);

      const content = fs.readFileSync(compose, 'utf-8');
      // Verify port unification (8282)
      expect(content).toContain('"8282:8282"');
      expect(content).toContain('PORT=8282');
      // Verify image tag alignment
      expect(content).toContain('pinchpad:main');
    });

    it('should have docker-entrypoint.sh with correct permissions', () => {
      const entrypoint = path.join(PROJECT_ROOT, 'docker-entrypoint.sh');
      expect(fs.existsSync(entrypoint)).toBe(true);
      
      const stats = fs.statSync(entrypoint);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      expect(isExecutable, 'docker-entrypoint.sh must be executable').toBe(true);
    });
  });

  describe('NPM Scripts & Dependencies', () => {
    it('should have necessary scripts for the ecosystem', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
    });

    it('should have tsx and typescript available for runtime', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      expect(allDeps.tsx).toBeDefined();
      expect(allDeps.typescript).toBeDefined();
    });
  });
});
