import { PageHeader } from './layout/common';
import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function InstitutionView({ orders = [], showNotice }) {
  const summary = summarise(orders);
  return <>
    <PageHeader
      eyebrow="Institution workspace · Accra"
      title="Your supply, as delivered."
      copy="See the water delivered to this account and what it cost. Subscription plans, scheduled drops, and water-quality certification are not recorded in this app yet."
    />
    <div className="institution-grid">
      <section className="panel schedule-panel">
        <div className="section-heading">
          <div><span className="section-kicker">DELIVERED TO YOU</span><h2>Your orders</h2></div>
        </div>
        {summary.totalCount === 0 ? (
          <p className="empty-feed">No orders have been delivered to this account yet.</p>
        ) : (
          <dl className="pricing-preview">
            <div><dt>Orders</dt><dd>{summary.totalCount}</dd></div>
            <div><dt>Delivered</dt><dd>{summary.deliveredCount}</dd></div>
            <div><dt>Order value</dt><dd>{formatCedi(summary.grossMinor)}</dd></div>
            <div className="highlight"><dt>Total paid</dt><dd>{formatCedi(summary.chargedMinor)}</dd></div>
          </dl>
        )}
      </section>
      <section className="panel quality-panel">
        <span className="section-kicker">WATER QUALITY & COMPLIANCE</span>
        <h2>No quality records</h2>
        <p className="empty-feed">
          This app does not store water-quality certificates, so there is no verified
          quality score for this supply. A seller or operator has to supply test results
          before any quality claim is made.
        </p>
      </section>
    </div>
  </>;
}
