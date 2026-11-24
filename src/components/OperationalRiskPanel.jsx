import { summarise } from '../lib/summary';
import { formatCedi } from '../lib/money';

export function OperationalRiskPanel({ orders = [], sellerPerfSummary, sellerRanked }) {
  const summary = summarise(orders);
  const flagged = sellerRanked ? sellerRanked.filter(s => s.score < 60) : [];
  return <section className="operational-risk panel"><div className="section-heading"><div><span className="ai-label">? OPERATIONS</span><h2>Business health signals</h2></div></div><div className="risk-grid"><article><span className="risk-icon warning">!</span><div><strong>Unpaid orders</strong><p>{summary.unpaidCount} order(s) awaiting payment, totalling {formatCedi(summary.unpaidMinor)}.</p></div></article><article><span className="risk-icon good">v</span><div><strong>Collected</strong><p>{formatCedi(summary.chargedMinor)} confirmed by Paystack across {summary.paidCount} paid order(s).</p></div></article><article><span className="risk-icon alert">!</span><div><strong>Sellers at risk</strong><p>{sellerPerfSummary ? `${sellerPerfSummary.flaggedCount} of ${sellerPerfSummary.totalSellers} sellers scored below the watch threshold.` : 'No seller performance data is available yet.'}</p></div></article></div></section>;
}
