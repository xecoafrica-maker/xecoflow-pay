# Boost Biashara Loan — Merchant Admin Portal

## Persona
Merchant is the lender. Their customers are borrowers.
The merchant uses this portal to manage loans they have given.

## Non-negotiables
1. Zero impact on existing XecoFlow code.
2. Uses the existing merchant session (xeco_session cookie).
3. Consent is upstream (marketplace "installed" state).
4. Additive only.

## Sections
1. Dashboard
2. Applications
3. Active Loans
4. Loan Detail
5. Borrowers
6. Products
7. Reports
8. Exports
9. Reminders
10. Webhooks
11. Settings

## API Base
Browser -> /api/lending/* -> Next.js proxy -> credit-service-engine
Proxy reads session cookie and forwards x-merchant-id.