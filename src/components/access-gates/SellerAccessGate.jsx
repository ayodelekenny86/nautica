import { useState } from 'react';
import { SocialSignInDivider } from '../layout/common';
import GoogleSignInButton from '../GoogleSignInButton';
import MetaSignInButton from '../MetaSignInButton';

export function SellerAccessGate({ sellerProfile, setSellerProfile, onApply, onRefresh, applicationId, onSignIn, onGoogle, onMeta, showNotice }) {
  const [submitted, setSubmitted] = useState(Boolean(applicationId));
  const [busy, setBusy] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function update(event) {
    setSellerProfile({ ...sellerProfile, [event.target.name]: event.target.value });
  }

  async function handleApply(event) {
    event.preventDefault();
    if (!termsAccepted) {
      showNotice('Please accept the terms and conditions before submitting your application.');
      return;
    }
    setBusy(true);
    const result = await onApply();
    setBusy(false);
    if (result?.ok) setSubmitted(true);
  }

  async function handleRefresh() {
    setBusy(true);
    const result = await onRefresh();
    setBusy(false);
    if (result?.ok && result.approved) await onSignIn();
  }

  if (submitted) {
    return (
      <section className="access-gate panel seller-gate">
        <span className="access-lock">?</span>
        <p className="eyebrow">Seller signup & approval</p>
        <h1>Application awaiting approval.</h1>
        <p>Nautica Ops must verify your identity, vehicle, and water-source documents before you can receive jobs.</p>
        <div className="pending-approval">
          <strong>Pending operator review</strong>
          <small>An operator has to approve this application on the server. There is no code to enter and no way to approve it from this screen, because the previous version generated its own approval code and anyone could have approved themselves.</small>
          <small>Application reference: <span data-testid="seller-application-id">{applicationId || 'submitted'}</span></small>
          <button className="primary-button" type="button" onClick={handleRefresh} disabled={busy}>{busy ? 'Checking…' : 'Check approval status'}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="access-gate panel seller-gate">
      <span className="access-lock">?</span>
      <p className="eyebrow">Seller signup & approval</p>
      <h1>Create your seller account.</h1>
      <p>Complete your business and vehicle details. Your seller workspace stays locked until an operator approves the application.</p>
      <form onSubmit={handleApply}>
        <input aria-label="Business name" name="business" value={sellerProfile.business} onChange={update} placeholder="Business or trading name" />
        <input aria-label="Seller phone" name="phone" value={sellerProfile.phone} onChange={update} placeholder="Registered phone number" />
        <input aria-label="Vehicle registration" name="vehicle" value={sellerProfile.vehicle} onChange={update} placeholder="Vehicle registration" />
        <select aria-label="Tank capacity" name="capacity" value={sellerProfile.capacity} onChange={update}>
          <option>1,000 gallons</option>
          <option>2,000 gallons</option>
          <option>5,000 gallons</option>
        </select>
        <div className="terms-checkbox">
          <label>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required />
            <span>
              I agree to the{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); showNotice('For full terms, please see our LEGAL.md file.'); }}>Terms and Conditions</a>,{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); showNotice('For refund policy details, please see our LEGAL.md file.'); }}>Refund Policy</a>, and{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); showNotice('For privacy details, please see our LEGAL.md file.'); }}>Privacy Policy</a>.
            </span>
          </label>
        </div>
        <button className="primary-button" type="submit" disabled={busy || !termsAccepted}>
          {busy ? 'Submitting…' : 'Submit signup for review'}
        </button>
      </form>
      <SocialSignInDivider />
      <GoogleSignInButton role="seller" onVerified={onGoogle} showNotice={showNotice} />
      <MetaSignInButton role="seller" onVerified={onMeta} showNotice={showNotice} />
      <small>Required controls: ID, vehicle registration, tank capacity, water-source evidence, approval audit trail, and payout verification.</small>
    </section>
  );
}
