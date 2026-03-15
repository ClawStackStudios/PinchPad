---
agent: perf-auditor
status: warn
findings: 1
---

# Performance Audit Report

## Summary
The application is extremely fast due to the Vite build system and the use of SQLite in WAL mode. The UI transitions are smooth and don't block the main thread.

## Findings

### 1. Scaling Bottleneck in Note Decryption
- **Severity**: Low
- **Location**: `src/services/noteService.ts`
- **Description**: The `getAll` function decrypts every note in the user's pot simultaneously. While fine for a prototype, this will cause UI stuttering as the user amasses hundreds of pearls.
- **Remediation**: Implement pagination or a "decrypt-on-view" strategy where Only the visible notes or the currently selected note is decrypted.

## Metrics
- **Initial Load Time**: 10/10 (Vite is lightning fast)
- **Runtime Performance**: 9/10 (Efficient React usage)
- **Scalability**: 6/10 (Encryption overhead as data grows)

**Maintained by CrustAgent©™**
