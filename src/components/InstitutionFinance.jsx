import FinanceEmpty from './FinanceEmpty';
import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function InstitutionFinance({ orders, showNotice }) {
  const summary = summarise(orders);
  if (!summary.paidCount) {
    return <FinanceEmpty title="Plan the month with confidence." copy="Delivery spend and usage, once orders are paid." />;
  }
  return <section className="finance-workspace"><div className="finance-heading"><div><span className="section-kicker">INSTITUTION FINANCE</span><h2>Plan the month with confidence.</h2><p>Spend and delivery volume, summed from paid orders.</p></div><button className="outline-button" type="button" onClick={() => showNotice(`${summary.paidCount} paid order(s), ${formatCedi(summary.chargedMinor)} total.`)}>Summarise</button></div><div className="finance-grid institution-finance"><article className="finance-highlight"><span>TOTAL SPEND</span><strong>{formatCedi(summary.chargedMinor)}</strong><small>Paid orders including fees</small></article><article><span>DELIVERIES</span><strong>{summary.deliveredCount}</strong><small>Confirmed at handover</small></article><article><span>ORDERS IN FLIGHT</span><strong>{summary.unpaidCount}</strong><small>Awaiting payment</small></article><article><span>AVG ORDER VALUE</span><strong>{formatCedi(summary.paidCount ? Math.round(summary.grossMinor / summary.paidCount) : 0)}</strong><small>Before fees</small></article></div></section>;
}
