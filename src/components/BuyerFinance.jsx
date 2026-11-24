import FinanceEmpty from './FinanceEmpty';
import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function BuyerFinance({ orders, showNotice }) {
  const summary = summarise(orders);
  if (!summary.paidCount) {
    return <FinanceEmpty title="Your money, explained." copy="Fees on every booking, once one is paid." />;
  }
  const lastPaid = orders.find((order) => order.status === 'Paid');
  return <section className="finance-workspace"><div className="finance-heading"><div><span className="section-kicker">BUYER FINANCE</span><h2>Your money, explained.</h2><p>What you paid, and what Nautica charged, across your paid orders.</p></div><button className="outline-button" type="button" onClick={() => showNotice(`${summary.paidCount} paid order(s), ${formatCedi(summary.chargedMinor)} total.`)}>Summarise</button></div><div className="finance-grid buyer-finance"><article><span>LAST PAID ORDER</span><strong>{formatCedi(lastPaid?.chargedMinor ?? 0)}</strong><small>{lastPaid?.code ?? '—'}</small></article><article><span>TOTAL PAID</span><strong>{formatCedi(summary.chargedMinor)}</strong><small>The full amount you were charged</small></article><article><span>STILL TO PAY</span><strong>{formatCedi(summary.unpaidMinor)}</strong><small>{summary.unpaidCount} unpaid order(s)</small></article></div></section>;
}
