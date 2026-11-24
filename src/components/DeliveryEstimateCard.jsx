function DeliveryEstimateCard({ order, estimateForOrder, orders }) {
  if (!order) {
    return <section className="panel delivery-estimate-panel"><div className="section-heading"><div><span className="section-kicker">DELIVERY ESTIMATE</span><h2>When will my water arrive?</h2></div></div><p className="empty-feed">No order is on the way yet. An estimate appears here once a seller accepts and a driver is assigned.</p></section>;
  }
  const estimate = estimateForOrder(orders, order);
  if (!estimate || !estimate.slaMeasured) {
    return <section className="panel delivery-estimate-panel"><div className="section-heading"><div><span className="section-kicker">DELIVERY ESTIMATE</span><h2>When will my water arrive?</h2></div></div><p className="empty-feed">Delivery timing is not recorded for the seller assigned to {order.code} yet, so no delivery window can be estimated. Timing is recorded when an order is marked Assigned and then Delivered.</p></section>;
  }
  const low = Math.max(0, Math.round(estimate.slaHours * 0.7));
  const high = Math.round(estimate.slaHours * 1.4);
  return <section className="panel delivery-estimate-panel"><div className="section-heading"><div><span className="section-kicker">DELIVERY ESTIMATE</span><h2>When will my water arrive?</h2></div></div><p className="estimate-copy"><strong>{order.code}</strong> is with {order.sellerName || 'your seller'}. Based on {estimate.timedDeliveries} timed deliveries, the estimated window is about <strong>{low}–{high} hours</strong>.</p><small className="estimate-note">This is an estimate from the median of real delivery windows, not a guarantee. It will sharpen as more deliveries are timed.</small></section>;
}

export default DeliveryEstimateCard;
