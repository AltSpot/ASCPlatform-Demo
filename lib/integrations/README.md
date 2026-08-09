# lib/integrations

Deliberately empty. This is where the real third-party adapters go, and
the directory is committed so the path referenced across the codebase
actually exists in a fresh clone.

Every third party is simulated today. Each simulated path carries a
`DEMO SEAM` comment naming what is faked, what the production contract
is, and what replaces it. Find them all with:

```bash
grep -rn "DEMO SEAM" app lib components
```

## The adapters to write

| Adapter | Partner | Seam it replaces |
| --- | --- | --- |
| KYC / AML / OFAC screening | (not chosen) | `app/api/kyc/submit/route.ts`, `app/api/kyc/id/route.ts`, `app/api/kyc/selfie/route.ts` |
| Bank linking | Plaid | `app/api/bank/route.ts` POST, `components/wizard/PlaidDemoModal.tsx` |
| ACH transfers | Modern Treasury | `app/api/subscriptions/[id]/fund/route.ts` |
| E-signature | Anvil | `app/api/subscriptions/[id]/sign/route.ts` |
| Taxpayer ID tokenization | (not chosen) | `tinToken` in `lib/repositories/investor.ts` |

Accreditation is deliberately absent. AltSpot reviews the certification
letter itself, so there is no verification vendor to wire. The seam there
(`app/api/accreditation/upload/route.ts`) collapses the reviewer step
rather than standing in for a third party.

Two more production swaps live outside this directory: the Prisma
datasource in `prisma/schema.prisma` plus the adapter in `lib/db.ts`, and
the model call behind `generateAnswer` in `lib/spotbot/engine.ts`.

## The rule these adapters have to keep

Send the sensitive value to the vendor, retain the reference, never the
data. Taxpayer IDs keep last-4 plus a surrogate token; identity documents
and selfies go from the browser to the vendor and never land here. See
CLAUDE.md, "The standing rule".
