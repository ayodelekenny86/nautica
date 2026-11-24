import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function RevenueFinance({ orders = [], showNotice }) {
  const summary = summarise(orders);
  const hasData = summary.paidCount > 0;
  const sellerShare = summary.sellerReceivesMinor;
  const driverShare = summary.driverReceivesMinor;
  const platformShare = summary.platformCommissionMinor;
  const totalOut = sellerShare + driverShare + platformShare;
  const sellerPct = totalOut > 0 ? Math.round((sellerShare / totalOut) * 100) : 0;
  const driverPct = totalOut > 0 ? Math.round((driverShare / totalOut) * 100) : 0;
  const platformPct = totalOut > 0 ? Math.round((platformShare / totalOut) * 100) : 0;
  return <section className="finance-workspace"><div className="finance-heading"><div><span className="section-kicker">REVENUE CONTROL TOWER</span><h2>Money moving through the network.</h2><p>Marketplace take, outstanding payments and revenue mix, summed from paid orders.</p></div><button className="outline-button" type="button" onClick={() => showNotice(hasData ? `GMV ${formatCedi(summary.chargedMinor)} across ${summary.paidCount} paid order(s).` : 'No paid orders yet, so there is no GMV to report.')}>Generate report</button></div><div className="finance-grid ops-finance"><article><span>GMV COLLECTED</span><strong>{formatCedi(summary.chargedMinor)}</strong><small>{summary.paidCount} paid order(s) confirmed by Paystack</small></article><article><span>SELLER SHARE</span><strong>{formatCedi(sellerShare)}</strong><small>{sellerPct}% of paid-out money</small></article><article><span>DRIVER SHARE</span><strong>{formatCedi(driverShare)}</strong><small>{driverPct}% of paid-out money</small></article><article><span>NAUTICAL SHARE</span><strong>{formatCedi(platformShare)}</strong><small>{platformPct}% of paid-out money</small></article><article className="finance-warning"><span>AWAITING PAYMENT</span><strong>{formatCedi(summary.unpaidMinor)}</strong><small>{summary.unpaidCount} order(s) not yet paid</small></article><article className="finance-warning"><span>NO DISPUTE DATA</span><strong>0</strong><small>Dispute tracking is not connected to this deployment</small></article></div></section>;
}
