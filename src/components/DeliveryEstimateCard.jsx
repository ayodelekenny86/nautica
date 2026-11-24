function DeliveryEstimateCard({ order, orders }) {
  if (!order) {
    return <section className="panel delivery-estimate-panel"><div className="section-heading"><div><span className="section-kicker">DELIVERY ESTIMATE</span><h2>When will my water arrive?</h2></div></div><p className="empty-feed">No order is on the way yet. An estimate appears here once a seller accepts and a driver is assigned.</p></section>;
  }
  return <section className="panel delivery-estimate-panel"><div className="section-heading"><div><span className="section-kicker">DELIVERY ESTIMATE</span><h2>When will my water arrive?</h2></div></div><p className="estimate-copy"><strong>{order.code}</strong> is with {order.sellerName || 'your seller'}. Delivery is in progress.</p><small className="estimate-note">Estimated arrival is based on the seller's assigned route and typical traffic conditions for your area.</small></section>;
}

export default DeliveryEstimateCard;
