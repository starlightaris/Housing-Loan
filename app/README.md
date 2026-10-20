# Seylan Bank – Digital Housing Loan Application (clickable demo)

Front-end only mock of the paper *Housing Loan Application* (Version 2026/006). No backend, database, login or real data –
every "integration" (Seylan profile lookup, document reading, CRIB, spouse fetch) is simulated with canned fictional data in `src/data/demo.ts`.

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # static output in ../docs/ for GitHub Pages
```

## Demo script
1. **Quick Start** – "Use demo NIC" → Send OTP → "Demo OTP" → Verify. ~77 fields fill in.
2. **Applicants** – choose *spouse is joint applicant*, "Use demo NIC" for the spouse → Fetch.
3. **Loan & Security** – "use sample" on the sale-agreement banner, then pick a quick-pick loan amount, rate period and tenure.
4. Everything else is pre-filled or one click (CRIB, bank statement, tax assessment). **Review & Consent** → sign (draw or "Type my name") → Submit.

Shortcut: the **Demo tools** pill (bottom-left) can *Fill whole application*, *Jump to review* or *Reset demo*.
Progress is kept in `localStorage`; Reset clears it.

## Form section → screen map
| Paper form section | Screen |
|---|---|
| 1 Applicant details | 2 Applicants |
| 2 Employment, 9 Employed abroad | 3 Employment |
| 4 Loan details, 5 Security property | 4 Loan & Security |
| 3 Assets, 8 Liabilities, 10 Past facilities | 5 Assets & Liabilities |
| 6 Income & expenditure, 7 Income tax | 6 Income & Tax |
| 11 Charges, declaration, signature | 7 Review & Consent |
