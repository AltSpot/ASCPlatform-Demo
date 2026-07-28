/** Docs — signed agreements, verification records, and the Tax Center. */
import Link from 'next/link';

import DocRow from '@/components/DocRow';
import { requireUser } from '@/lib/auth';
import { dateStr, EMPTY } from '@/lib/format';
import { getDealsByIds } from '@/lib/repositories/deals';
import { listDocuments } from '@/lib/repositories/documents';
import { getVault, getWizardView } from '@/lib/repositories/investor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Docs · AltSpot Capital' };

export default async function DocsPage() {
  const user = await requireUser();

  const [documents, wizard, vault] = await Promise.all([
    listDocuments(user.id),
    getWizardView(user.id),
    getVault(user.id),
  ]);

  const deals = await getDealsByIds(
    [...new Set(documents.map((d) => d.dealId).filter((id): id is string => Boolean(id)))],
  );

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Docs</div>
          <h1 className="display">Every document, one place.</h1>
          <p className="sub">
            Signed agreements save here automatically the moment you sign. Tax forms are
            delivered here each season, per investment profile, per deal.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ marginBottom: 14 }}>Signed agreements</h3>

        {documents.length === 0 ? (
          <div className="dz" style={{ cursor: 'default' }}>
            <b style={{ color: 'var(--paper)' }}>Nothing signed yet</b>
            <br />
            <span className="tiny">
              Your first subscription agreement will appear here automatically.
            </span>
            <br />
            <br />
            <Link className="btn btn-gold btn-sm" href="/marketplace">
              Open the marketplace
            </Link>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Document</th>
                <th>Deal</th>
                <th>Saved</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <b>{doc.name}</b>
                  </td>
                  <td>{doc.dealId ? (deals.get(doc.dealId)?.name ?? EMPTY) : EMPTY}</td>
                  <td className="num">{dateStr(doc.savedAt)}</td>
                  <td>
                    <span className="chip neutral">{doc.note ?? 'Saved'}</span>
                  </td>
                  <td>
                    <DocRow />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid c2">
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Verification records</h3>
          <p className="small" style={{ marginBottom: 14 }}>
            Your standing compliance documents.
          </p>

          <div className="fee-row">
            <span
              className="l"
              style={
                wizard.accreditation.status === 'verified'
                  ? { color: 'var(--paper)' }
                  : undefined
              }
            >
              Accreditation certification
            </span>
            {wizard.accreditation.status === 'verified' ? (
              <span className="chip good">
                <span className="dot" />
                Valid to {dateStr(wizard.accreditation.expiresAt)}
              </span>
            ) : (
              <Link className="small" href="/wizard?step=1">
                Complete →
              </Link>
            )}
          </div>

          <div className="fee-row">
            <span className="l" style={wizard.info.complete ? { color: 'var(--paper)' } : undefined}>
              {wizard.info.complete
                ? `W-9 · ${vault.first ?? ''} ${vault.last ?? ''}`.trim()
                : 'W-9 information'}
            </span>
            {wizard.info.complete ? (
              <span className="chip good">
                <span className="dot" />
                On file
              </span>
            ) : (
              <Link className="small" href="/wizard?step=2">
                Complete →
              </Link>
            )}
          </div>

          <div className="fee-row">
            <span className="l" style={wizard.kyc.complete ? { color: 'var(--paper)' } : undefined}>
              Identity verification (KYC)
            </span>
            {wizard.kyc.complete ? (
              <span className="chip good">
                <span className="dot" />
                Cleared
              </span>
            ) : (
              <Link className="small" href="/wizard?step=3">
                Complete →
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Tax Center</h3>
          <p className="small" style={{ marginBottom: 14 }}>
            K-1s arrive here for each deal you hold, each season.
          </p>
          <div className="dz" style={{ cursor: 'default' }}>
            <b style={{ color: 'var(--paper)' }}>No tax documents yet</b>
            <br />
            <span className="tiny">
              Your first K-1 will be delivered after your first full tax year in a deal.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
