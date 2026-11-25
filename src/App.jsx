import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { languages, translations } from './data/translations';
import useAuth from './hooks/useAuth';
import useBooking from './hooks/useBooking';
import { formatPhoneForDisplay } from './lib/accounts';
import { seedProducts } from './lib/collections';
import { referenceFromLocation } from './lib/payments';
import { initWebVitals, trackEvent, EVENTS } from './lib/analytics';
import { requireSecureContext, storeSession, readSession, clearSession, logSecurityEvent, SESSION_TTL_MS, INACTIVITY_WARN_MS } from './lib/security';
import GoogleSignInButton from './components/GoogleSignInButton';
import MetaSignInButton from './components/MetaSignInButton';
import { PWASetup, PWADetectOffline } from './components/PWASetup';
import SellerDashboard from './components/SellerDashboard';
import DriverDashboard from './components/DriverDashboard';
import DeliveryCodeDialog from './components/DeliveryCodeDialog';
import ErrorBoundary from './components/ErrorBoundary';
import { list, replaceAll } from './lib/collections';
import RatingModal from './components/RatingModal';
import { useRatings } from './hooks/useRatings';
import { SocialSignInDivider, PageHeader } from './components/layout/common';
import { BuyerAccessGate } from './components/access-gates/BuyerAccessGate';
import { DriverAccessGate } from './components/access-gates/DriverAccessGate';
import { SellerAccessGate } from './components/access-gates/SellerAccessGate';
import { AdminAccessGate } from './components/access-gates/AdminAccessGate';
import { BuyerView } from './components/BuyerView';
import { SellerView } from './components/SellerView';
import { InstitutionView } from './components/InstitutionView';
import { OpsView } from './components/OpsView';
import { BuyerFinance } from './components/BuyerFinance';
import LiveAgentCard from './components/LiveAgentCard';
import DeliveryEstimateCard from './components/DeliveryEstimateCard';
import InstitutionAgentCard from './components/InstitutionAgentCard';
import { LegalPage } from './components/LegalPage';

// Admin-only and overlay surfaces load on demand.
const SellerApprovalQueue = lazy(() => import('./components/SellerApprovalQueue'));
const PaymentPanel = lazy(() => import('./components/PaymentPanel'));
const OrderDetailModal = lazy(() => import('./components/OrderDetailModal'));

const roles = [
  ['buyer', 'Buyer app', 'Book reliable water'],
  ['seller', 'Seller app', 'Manage your fleet'],
  ['driver', 'Driver app', 'Deliveries and earnings'],
  ['institution', 'Institution', 'Plan your supply'],
  ['ops', 'Admin', 'Authorized operations access'],
];

const ROLE_ICONS = { buyer: '¦', seller: '?', driver: '?', institution: '?', ops: '?' };

const SUPPORT_PHONE = '0545009046';

const PLACEHOLDER_NAMES = { buyer: 'Buyer', seller: 'Seller', driver: 'Driver', institution: 'Institution', ops: 'Admin' };

function identityFor(session, region) {
  if (!session) {
    return { initials: '—', name: 'Signed out', detail: 'Choose a workspace to continue', signedIn: false };
  }

  const displayName = session.displayName?.trim() ?? '';
  const placeholder = PLACEHOLDER_NAMES[session.role];
  const hasName = Boolean(displayName) && displayName.toLowerCase() !== placeholder?.toLowerCase();

  const identifier = session.identifierType === 'phone'
    ? formatPhoneForDisplay(session.identifier)
    : session.identifier;
  const name = hasName ? displayName : identifier;
  const detail = hasName ? `${identifier} · ${region}` : region;

  const words = name.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1
    ? words.slice(0, 2).map((word) => word[0]).join('')
    : name.replace(/\D/g, '').slice(0, 2) || name.slice(0, 2);

  return { initials: letters.toUpperCase(), name, detail, signedIn: true };
}

function App() {
  const [language, setLanguage] = useState('en');
  const [region, setRegion] = useState('Accra');
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [securityBlocked, setSecurityBlocked] = useState(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [sessionWarning, setSessionWarning] = useState(null);
  const t = translations[language] ?? translations.en;
  seedProducts();

  // Refuse to render on an insecure context (HTTP, non-localhost).
  useEffect(() => {
    if (!requireSecureContext()) {
      setSecurityBlocked('This app requires a secure HTTPS connection. Please open it over HTTPS.');
      logSecurityEvent('insecure-context-blocked', { url: typeof window !== 'undefined' ? window.location.href : 'unknown' });
    }
  }, []);

  // Restore session from encrypted localStorage on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await readSession();
      if (!cancelled) {
        setSessionRestored(true);
        if (restored) {
          logSecurityEvent('session-restored', { role: restored.role, identifier: restored.identifier });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Track user activity for session timeout.
  useEffect(() => {
    const handlers = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const onActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      if (sessionWarning) setSessionWarning(null);
    };
    handlers.forEach((event) => window.addEventListener(event, onActivity, true));
    return () => handlers.forEach((event) => window.removeEventListener(event, onActivity, true));
  }, [sessionWarning]);

  useEffect(() => {
    initWebVitals();
    trackEvent(EVENTS.BOOKING_STARTED);
  }, []);

  const {
    role, selectRole, notice, showNotice, dismissNotice,
    session, signOut, accountExists,
    buyerAuthenticated, driverAuthenticated, adminAuthenticated, sellerAuthenticated,
    startPhoneSignIn, confirmPhoneCode, signInWithPassword, signInWithGoogleIdentity, signInWithMetaIdentity, registerAccount, linkDriverPhone,
    phoneCode, phoneIdentifier, signInError, opsToken,
    authStep, email, setEmail, emailCode, sendOtp, confirmEmailCode,
    sellerProfile, setSellerProfile, sellerApproved, sellerApplicationId,
    applyForSellerApproval, refreshSellerApproval, completeSellerApproval,
    available, setAvailable,
    ready,
  } = useAuth();

  // Session timeout: warn at INACTIVITY_WARN_MS, sign out at SESSION_TTL_MS.
  useEffect(() => {
    if (!sessionRestored || !session) return;
    const now = Date.now();
    const idleMs = now - lastActivity;
    if (idleMs > SESSION_TTL_MS) {
      signOut();
      clearSession();
      setSessionWarning('session-expired');
      logSecurityEvent('session-expired-inactivity', { role: session.role });
      return;
    }
    if (idleMs > SESSION_TTL_MS - INACTIVITY_WARN_MS) {
      setSessionWarning('session-expiring');
    }
  }, [sessionRestored, session, lastActivity, signOut]);

  const {
    orders, booking, updateBooking, requestDelivery, repeatBooking,
    savedAddresses, setSavedAddresses, driverUpdate, refreshDriverUpdate,
    updateOrderStatus, issueDeliveryCode, confirmDelivery, requestRefund,
    acceptDriverJob, releaseDriverJob,
  } = useBooking({ email, buyerPhone: session?.identifier ?? '', onNotice: showNotice });

  const buyerIdentifier = session?.identifier || email;

  const { submitRating } = useRatings();

  const [ratingOrder, setRatingOrder] = useState(null);

  const fleetDrivers = useMemo(() => list('drivers'), []);

  const [driverCodeOrderId, setDriverCodeOrderId] = useState(null);
  const [busyDriverOrderId, setBusyDriverOrderId] = useState(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const driverCodeOrder = driverCodeOrderId
    ? orders.find((order) => order.id === driverCodeOrderId) ?? null
    : null;

  const driverAccept = async (orderId) => {
    setBusyDriverOrderId(orderId);
    await acceptDriverJob(orderId);
    setBusyDriverOrderId(null);
  };

  const driverAdvance = async (orderId, status) => {
    setBusyDriverOrderId(orderId);
    await updateOrderStatus(orderId, status);
    setBusyDriverOrderId(null);
  };

  const driverRelease = async (orderId) => {
    setBusyDriverOrderId(orderId);
    await releaseDriverJob(orderId);
    setBusyDriverOrderId(null);
  };

  const confirmDeliveryWithRating = useCallback(async (orderId, code) => {
    const result = await confirmDelivery(orderId, code);
    if (result?.ok && buyerAuthenticated) {
      const order = orders.find((o) => o.id === orderId);
      if (order) setRatingOrder(order);
    }
    return result;
  }, [confirmDelivery, buyerAuthenticated, orders]);

  const handleRateOrder = useCallback((order) => {
    setRatingOrder(order);
  }, []);

  const driverRefresh = useCallback(() => {
    replaceAll('orders', list('orders'));
  }, []);

  const detailOrder = orders.find((order) => order.id === detailOrderId) ?? null;

  const canSignOut = Boolean(session);

  const identity = useMemo(() => identityFor(session, region), [session, region]);

  const returnReference = useMemo(() => referenceFromLocation(), []);
  const payableOrder = useMemo(() => {
    if (returnReference) {
      const matched = orders.find((order) => order.paystackReference === returnReference);
      if (matched) return matched;
    }
    return orders.find((order) => order.status !== 'Paid') ?? orders[0] ?? null;
  }, [orders, returnReference]);

  const switcherRoles = useMemo(() => {
    if (adminAuthenticated || driverAuthenticated || !session) return roles;
    return roles.filter(([key]) => key !== 'driver');
  }, [adminAuthenticated, driverAuthenticated, session]);

  return (
    <div className={`app-shell ${role === 'driver' ? 'is-driver' : ''}`}>
      {securityBlocked && (
        <div className="access-gate panel" style={{ maxWidth: '600px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
          <div className="error-icon" style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>?</div>
          <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Secure connection required</h1>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '24px' }}>{securityBlocked}</p>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '24px' }}>Nautica runs only over HTTPS so your orders, payments, and account data cannot be intercepted.</p>
          <button className="primary-button full" onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}>Try again</button>
        </div>
      )}
      {!securityBlocked && (
        <>
        <ErrorBoundary fallback={(error, reset) => (
        <div className="access-gate panel" style={{ maxWidth: '600px', margin: '60px auto', padding: '32px' }}>
          <div className="error-icon" style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>?</div>
          <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Something went wrong</h1>
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '24px' }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button className="primary-button full" onClick={reset}>Try again</button>
        </div>
      )}>
      <nav className="mobile-tabs" aria-label="Workspaces">
        {switcherRoles.map(([key, label]) => (
          <button
            className={`mobile-tab ${role === key ? 'active' : ''}`}
            key={key}
            type="button"
            aria-current={role === key ? 'page' : undefined}
            onClick={() => selectRole(key)}
          >
            <span className={`role-icon ${key}`} aria-hidden="true">{ROLE_ICONS[key]}</span>
            <span className="mobile-tab-label">{key === 'ops' ? 'Admin' : key === 'institution' ? 'Org' : label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
      <aside className="sidebar">
        <a className="app-logo" href="#main" aria-label="Nautica dashboard"><span>N</span>auti<strong>cal</strong></a>
        <div className="workspace-label">WORKSPACE</div>
        <div className="role-list">
          {switcherRoles.map(([key, label, description]) => (
            <button className={`role-button ${role === key ? 'active' : ''}`} key={key} type="button" onClick={() => selectRole(key)}>
              <span className={`role-icon ${key}`} aria-hidden="true">{ROLE_ICONS[key]}</span>
              <span><b>{label}</b><small>{description}</small></span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom"><button className="sidebar-link" type="button" onClick={() => showNotice('Help request received. Our support team will call you back shortly.')}><span>?</span>Help & support</button><button className="sidebar-link" type="button" onClick={() => setLegalOpen(true)}><span>?</span>Legal</button><div className="profile"><span className="avatar">{identity.initials}</span><span><b>{identity.name}</b><small>{identity.detail}</small></span><span className="more">•••</span></div></div>
      </aside>

      <main className="main-content" id="main">
         <header className="topbar">
            <div className="breadcrumb">
              <span>Nautica</span><i>/</i><strong>{t[role]}</strong>
              <select aria-label="Operating region" value={region} onChange={(event) => { setRegion(event.target.value); showNotice(`Workspace switched to ${event.target.value}.`); }}>
                <option>Accra</option><option>Kumasi</option><option>Takoradi</option><option>Tema</option><option>Lagos</option><option>Abidjan</option>
              </select>
            </div>
          <div className="topbar-actions">
            <label className="language-picker"><span>?</span>
              <select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
              </select>
            </label>
            {canSignOut && <button className="icon-button topbar-signout" type="button" aria-label="Sign out" title="Sign out" onClick={() => signOut()}><span>?</span></button>}
            <button className="profile mobile-profile" type="button" aria-label={`Signed in as ${identity.name}`}><span className="avatar">{identity.initials}</span></button>
          </div>
        </header>
        <PWASetup />
        <PWADetectOffline onOfflineChange={(offline) => showNotice(offline ? 'You are offline. Changes will sync when reconnected.' : 'Back online. Syncing...')} />
        {notice && <div className="notice" role="status"><span>?</span>{notice}<button type="button" aria-label="Dismiss notification" onClick={dismissNotice}>×</button></div>}
        {!ready && <section className="access-gate panel"><span className="access-lock">?</span><p className="eyebrow">Preparing secure workspace</p><h1>Setting up your accounts.</h1><p>Nautica is generating the local account registry and its credentials on this device. This takes a moment and needs no network access.</p></section>}
        {ready && role === 'buyer' && (buyerAuthenticated ? <><BuyerView booking={booking} updateBooking={updateBooking} requestDelivery={requestDelivery} orders={orders} showNotice={showNotice} authStep={authStep} email={email} setEmail={setEmail} emailCode={emailCode} sendOtp={sendOtp} confirmEmailCode={confirmEmailCode} confirmDelivery={confirmDeliveryWithRating} requestRefund={requestRefund} savedAddresses={savedAddresses} repeatBooking={repeatBooking} setSavedAddresses={setSavedAddresses} t={t} driverUpdate={driverUpdate} refreshDriverUpdate={refreshDriverUpdate} onRateOrder={handleRateOrder} buyerId={buyerIdentifier} /><BuyerFinance orders={orders} showNotice={showNotice} /></> : <BuyerAccessGate onSignedIn={() => {}} startSignIn={startPhoneSignIn} confirmCode={confirmPhoneCode} generatedCode={phoneCode} identifier={phoneIdentifier} error={signInError} onRegister={(value) => registerAccount({ identifier: value, role: 'buyer', displayName: 'Buyer' })} accountExists={accountExists} onGoogle={signInWithGoogleIdentity} onMeta={signInWithMetaIdentity} showNotice={showNotice} />)}
        {detailOrder && (
          <Suspense fallback={null}>
            <OrderDetailModal
              order={detailOrder}
              onClose={() => setDetailOrderId(null)}
              onShowNotice={showNotice}
              viewerRole={role}
              onRate={handleRateOrder}
            />
          </Suspense>
        )}
        {ratingOrder && (
          <RatingModal
            isOpen={true}
            onClose={() => setRatingOrder(null)}
            onSubmit={async (ratingData) => {
              const result = await submitRating(
                ratingOrder.id,
                session?.identifier ?? email,
                ratingOrder.sellerId ?? 'unknown',
                ratingOrder.driverId ?? 'unknown',
                { ...ratingData, sellerName: ratingOrder.sellerName, driverName: ratingOrder.driverName }
              );
              if (result?.ok) {
                setRatingOrder(null);
                showNotice('Thank you for your feedback!');
              }
              return result;
            }}
            order={ratingOrder}
            sellerName={ratingOrder.sellerName}
            driverName={ratingOrder.driverName}
          />
        )}
        {ready && role === 'buyer' && buyerAuthenticated && (
          <Suspense fallback={<div className="panel lazy-fallback" aria-hidden="true" />}>
            <PaymentPanel
              order={payableOrder}
              onPaid={(orderId) => { updateOrderStatus(orderId, 'Paid', () => {}); }}
              showNotice={showNotice}
            />
          </Suspense>
        )}
        {ready && role === 'seller' && (sellerAuthenticated || sellerApplicationId ? (
          <SellerDashboard
            available={available}
            setAvailable={setAvailable}
            showNotice={showNotice}
            orders={orders}
            updateOrderStatus={(id, status) => updateOrderStatus(id, status, () => {})}
            issueDeliveryCode={issueDeliveryCode}
            sellerProfile={sellerProfile}
            setSellerProfile={setSellerProfile}
            sellerApproved={sellerApproved}
            sellerApplicationId={sellerApplicationId}
            applyForSellerApproval={applyForSellerApproval}
            refreshSellerApproval={refreshSellerApproval}
            completeSellerApproval={completeSellerApproval}
          />
        ) : (
          <SellerAccessGate
            sellerProfile={sellerProfile}
            setSellerProfile={setSellerProfile}
            onApply={applyForSellerApproval}
            onRefresh={refreshSellerApproval}
            applicationId={sellerApplicationId}
            onSignIn={completeSellerApproval}
            onGoogle={signInWithGoogleIdentity}
            onMeta={signInWithMetaIdentity}
            showNotice={showNotice}
          />
        ))}
        {driverCodeOrder && (
          <DeliveryCodeDialog
            order={driverCodeOrder}
            onCancel={() => setDriverCodeOrderId(null)}
            onSubmit={async (orderId, code) => {
              const result = await confirmDelivery(orderId, code);
              if (result?.ok) {
                setDriverCodeOrderId(null);
                setDetailOrderId(orderId);
              }
              return result;
            }}
          />
        )}
        {ready && role === 'driver' && (driverAuthenticated || !session ? (
          <DriverDashboard
            orders={orders}
            fleetDrivers={fleetDrivers}
            driverIdentifier={session?.phone || (session?.identifier ?? '')}
            driverName={session?.displayName ?? ''}
            onAccept={driverAccept}
            onAdvance={driverAdvance}
            onComplete={setDriverCodeOrderId}
            onReject={driverRelease}
            showNotice={showNotice}
            busyOrderId={busyDriverOrderId}
            linkDriverPhone={linkDriverPhone}
            onRefresh={driverRefresh}
          />
        ) : (
          <DriverAccessGate
            startSignIn={startPhoneSignIn}
            confirmCode={confirmPhoneCode}
            generatedCode={phoneCode}
            identifier={phoneIdentifier}
            error={signInError}
            onRegister={(value) => registerAccount({ identifier: value, role: 'driver', displayName: 'Driver' })}
            accountExists={accountExists}
            onGoogle={signInWithGoogleIdentity}
            onMeta={signInWithMetaIdentity}
            showNotice={showNotice}
          />
        ))}
        {role === 'institution' && (
          <InstitutionView 
            orders={orders} 
            showNotice={showNotice}
          />
        )}
        {ready && role === 'ops' && (adminAuthenticated ? <Suspense fallback={null}><OpsView orders={orders} showNotice={showNotice} /></Suspense> : <AdminAccessGate onSignIn={signInWithPassword} error={signInError} onGoogle={signInWithGoogleIdentity} onMeta={signInWithMetaIdentity} showNotice={showNotice} />)}
        {legalOpen && <LegalPage onClose={() => setLegalOpen(false)} />}
        {sessionWarning === 'session-expiring' && (
          <div className="notice" role="alert" style={{ background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '12px', margin: '12px 0', borderRadius: '4px' }}>
            <strong>Your session will expire soon due to inactivity.</strong> Interact with the page to stay signed in.
          </div>
        )}
        {sessionWarning === 'session-expired' && (
          <div className="access-gate panel" style={{ maxWidth: '600px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
            <div className="error-icon" style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>?</div>
            <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Session expired</h1>
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '24px' }}>Your session expired after inactivity. Please sign in again.</p>
            <button className="primary-button full" onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}>Sign in again</button>
          </div>
        )}
        </main>
      </ErrorBoundary>
      </>
      )}
    </div>
  );
}

export default App;
