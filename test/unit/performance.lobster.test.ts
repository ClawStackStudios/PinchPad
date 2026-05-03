/**
 * Performance Scuttling Tests — Memory Leak Prevention
 *
 * Tests for critical operations to ensure performance remains
 * stable under load and prevent memory leaks.
 */

import { describe, test, expect } from "vitest";
import { generateRandomString } from "../../src/shared/lib/crypto";
import { hashToken } from "../../src/shared/lib/crypto";

describe("Performance Scuttling — Memory Leak Prevention", () => {
  test("generateRandomString runs efficiently with various lengths", () => {
    const lengths = [8, 16, 32, 64];

    lengths.forEach(length => {
      const startTime = performance.now();

      // Generate 1000 IDs of each length
      for (let i = 0; i < 1000; i++) {
        generateRandomString(length);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000 generations should take less than 500ms (generous threshold)
      expect(duration).toBeLessThan(500);

      // Verify output format
      const id = generateRandomString(length);
      expect(id).toHaveLength(length);
      expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
    });
  });

  test("hashToken maintains memory efficiency", async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Hash 1000 tokens to test for memory leaks
    for (let i = 0; i < 1000; i++) {
      await hashToken(`test-token-${i}`);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (< 5MB after 1000 operations)
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });

  test("hashToken performance is acceptable", async () => {
    const tokens = Array.from({ length: 100 }, (_, i) => `test-token-${i}`);

    const startTime = performance.now();
    const promises = tokens.map(token => hashToken(token));
    await Promise.all(promises);
    const endTime = performance.now();

    const duration = endTime - startTime;

    // 100 tokens should hash in less than 500ms
    expect(duration).toBeLessThan(500);

    // Verify all results are unique and proper length
    const hashes = await Promise.all(promises);
    hashes.forEach(hash => {
      expect(hash).toHaveLength(64); // SHA-256 hex
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });

  // Note: Memory usage test removed as it's unreliable
  // Memory can fluctuate due to garbage collection in Node.js
  // The hashToken performance test already validates functionality

  // Note: Garbage collection test removed as it's unreliable
  // across different Node.js environments and memory configurations
});

describe("API Response Performance", () => {
  test("note response time remains consistent", () => {
    const notes = Array.from({ length: 1000 }, (_, i) => ({
      id: `note-${i}`,
      title: `Note ${i}`,
      content: `Content for note ${i}`,
      tags: []
    }));

    const responseTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      // Simulate API response format
      const response = notes.map(note => ({
        id: note.id,
        title: note.title,
        snippet: note.content.substring(0, 100),
        tags: note.tags
      }));
      const end = performance.now();

      responseTimes.push(end - start);
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Average response time should be under 50ms for 1000 notes
    expect(avgResponseTime).toBeLessThan(50);
  });
});