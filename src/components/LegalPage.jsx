export function LegalPage({ onClose }) {
  return (
    <section className="legal-page panel" aria-label="Legal terms">
      <div className="panel-title">
        <div>
          <span className="section-kicker">LEGAL</span>
          <h2>Terms &amp; Conditions</h2>
        </div>
        {onClose && <button type="button" aria-label="Close" onClick={onClose}>×</button>}
      </div>
      <article className="legal-section">
        <h3>1. Terms and Conditions</h3>
        <p>Welcome to Nautica. These terms govern your use of the Nautica water-delivery platform (the "Service"). By placing an order you agree to these terms, our Refund Policy, and our Privacy Policy.</p>
        <p><strong>Eligibility.</strong> You must be at least 18 years old to place an order. Sellers and drivers must complete identity and vehicle verification before receiving paid jobs.</p>
        <p><strong>Orders.</strong> All orders are subject to seller availability and driver capacity. Prices shown at checkout include all applicable charges. An order is confirmed only when payment is verified by the payment provider.</p>
        <p><strong>Payments.</strong> Payments are processed through Paystack, Flutterwave, or Hubtel. Nautica does not handle your card or mobile-money credentials directly. You are responsible for keeping your receipt email accurate.</p>
        <p><strong>Conduct.</strong> You may not place fraudulent orders, abuse support staff, or attempt to bypass payment. Nautica may suspend accounts that violate these terms.</p>
        <p><strong>Limitation of liability.</strong> Nautica facilitates connections between buyers, sellers, and drivers. Delivery times are estimates only. Nautica is not liable for delays caused by weather, traffic, seller stock, or provider outages beyond its reasonable control.</p>
        <p><strong>Governing law.</strong> These terms are governed by the laws of Ghana. Disputes will be resolved in the competent courts of Accra.</p>
      </article>

      <article className="legal-section">
        <h3>2. Refund Policy</h3>
        <p><strong>Eligible for refund.</strong> You may request a refund if:</p>
        <ul>
          <li>The order was cancelled by the seller or driver before delivery, or</li>
          <li>Payment was taken but no delivery was attempted, or</li>
          <li>The delivered quantity was materially short of the ordered amount.</li>
        </ul>
        <p><strong>Not eligible for refund.</strong> Refunds are not available for:</p>
        <ul>
          <li>Orders already delivered in full, or</li>
          <li>Cancellations requested after a driver has been dispatched, or</li>
          <li>Change of mind after payment confirmation.</li>
        </ul>
        <p><strong>How to request.</strong> Contact support at 0545009046 or use Help &amp; support in the app. Refunds are reviewed within one business day and credited to the original payment method when approved.</p>
      </article>

      <article className="legal-section">
        <h3>3. Data Privacy Policy</h3>
        <p><strong>What we collect.</strong> Account details: name, phone, email, role. Order details: delivery address, products, quantities, payment reference. Device and connection data for fraud prevention.</p>
        <p><strong>How we use it.</strong> To process and deliver your orders. To match you with sellers and drivers. To send receipts and order status updates. To prevent fraud and abuse.</p>
        <p><strong>Sharing.</strong> We do not sell your data. Order details are shared only with the seller and driver fulfilling your order. Payment data is handled by Paystack, Flutterwave, or Hubtel under their own privacy policies.</p>
        <p><strong>Your rights.</strong> You may request access to, correction of, or deletion of your account data by contacting support. Deletion may not be possible for orders needed for tax or legal records.</p>
        <p><strong>Security.</strong> Data is stored on this device and in your browser's local storage. Use a passcode-protected device and sign out when finished.</p>
      </article>

      <p className="legal-effective">Effective date: November 2026</p>
    </section>
  );
}
