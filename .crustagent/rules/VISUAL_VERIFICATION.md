# Rule: Visual Verification & Proof 📸

## Overview
Documentation and testing are not enough for UI/UX changes. Visual proof is required to ensure aesthetic alignment with ClawStack Studios©™ standards.

## The Screenshot Constraint
1. **Mandatory Proof**: Any change that modifies the DOM, CSS, or Theme must include a **browser screenshot** in the PR/Report.
2. **Theme Parity**: Screenshots must demonstrate both **Light Mode** and **Dark Mode** if the change impacts both (e.g., color shifts, border adjustments).
3. **Context**: Screenshots should capture the component in its natural habitat (e.g., "The Appearance Panel on the Settings Page") rather than just a cropped fragment.

## Non-UI Changes
If a change is purely backend (e.g., SQLite query optimization) or cryptographic (e.g., token hashing), visual proof should consist of **terminal output** demonstrating successful verification (e.g., `npm run test` or `EXPLAIN QUERY PLAN` output).

---
**Enforced by CrustAgent©™**
