import FinanceEmpty from './FinanceEmpty';
import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function SellerFinance({ orders, showNotice }) {
  const summary = summarise(orders);
  if (!summary.paidCount) {
    return <FinanceEmpty title="Know what you take home." copy="Your share of each paid delivery, once there is one." />;
  }
  return <section className="finance-workspace"><div className="finance-heading"><div><span className="section-kicker">SELLER FINANCE</span><h2>Know what you take home.</h2><p>Your allocated share of orders that have been paid.</p></div><button className="outline-button" type="button" onClick={() => showNotice(`Seller share across ${summary.paidCount} paid order(s): ${formatCedi(summary.sellerReceivesMinor)}.`)}>Summarise</button></div><div className="finance-grid seller-finance"><article><span>YOUR SHARE</span><strong>{formatCedi(summary.sellerReceivesMinor)}</strong><small>Water seller allocation</small></article><article><span>ORDER VALUE</span><strong>{formatCedi(summary.grossMinor)}</strong><small>Before fees, {summary.paidCount} paid order(s)</small></article><article><span>NAUTICAL COMMISSION</span><strong>-{formatCedi(summary.platformCommissionMinor)}</strong><small>Platform allocation</small></article><article className="finance-highlight"><span>NOT PAID OUT</span><strong>{formatCedi(summary.unpaidMinor)}</strong><small>Orders that have not been paid, so nothing is owed yet</small></article></div></section>;
}
