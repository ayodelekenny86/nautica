import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import { languages, translations } from './data/translations';
import useAuth from './hooks/useAuth';
import useBooking from './hooks/useBooking';
import useReports from './hooks/useReports';
import useNautAi, { aiQuickActions } from './hooks/useNautAi';
import { aiFallbackMessage } from './lib/ai';
import useNotifications from './hooks/useNotifications';
import { usePushNotifications, useFCMTokenSync } from './hooks/usePushNotifications';
import useLoyalty from './hooks/useLoyalty';
import useSellerPerformance from './hooks/useSellerPerformance';
import useAdminPricing from './hooks/useAdminPricing';
import { formatPhoneForDisplay, normalizePhone } from './lib/accounts';
import { seedProducts } from './lib/collections';
import { referenceFromLocation } from './lib/payments';
import { rankReliability, reliabilitySummary, estimateForOrder } from './lib/reliability';
import GoogleSignInButton from './components/GoogleSignInButton';
import MetaSignInButton from './components/MetaSignInButton';
import { PWASetup, PWADetectOffline } from './components/PWASetup';
import SellerDashboard from './components/SellerDashboard';
import DriverDashboard from './components/DriverDashboard';
import DeliveryCodeDialog from './components/DeliveryCodeDialog';
import InstitutionDashboard from './components/InstitutionDashboard';
import MessagingPanel from './components/MessagingPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { list, replaceAll } from './lib/collections';
import { initWebVitals, trackEvent, EVENTS } from './lib/analytics';
import RatingModal from './components/RatingModal';
import BuyerRatingsHistory from './components/BuyerRatingsHistory';
import { useRatings, useRatedOrders, useDriverRatings } from './hooks/useRatings';
import { SocialSignInDivider, PageHeader, ReportActions } from './components/layout/common';
import { BuyerAccessGate } from './components/access-gates/BuyerAccessGate';
import { DriverAccessGate } from './components/access-gates/DriverAccessGate';
import { SellerAccessGate } from './components/access-gates/SellerAccessGate';
import { AdminAccessGate } from './components/access-gates/AdminAccessGate';
import { BuyerView } from './components/BuyerView';
import { SellerView } from './components/SellerView';
import { InstitutionView } from './components/InstitutionView';
import { OpsView } from './components/OpsView';
import { BuyerFinance } from './components/BuyerFinance';
import { SellerFinance } from './components/SellerFinance';
import { InstitutionFinance } from './components/InstitutionFinance';
import { RevenueFinance } from './components/RevenueFinance';
import { OperationalRiskPanel } from './components/OperationalRiskPanel';
import LiveAgentCard from './components/LiveAgentCard';
import DeliveryEstimateCard from './components/DeliveryEstimateCard';
import InstitutionAgentCard from './components/InstitutionAgentCard';

// Admin-only and overlay surfaces load on demand.
const AdminPricingConsole = lazy(() => import('./components/AdminPricingConsole'));
const SellerApprovalQueue = lazy(() => import('./components/SellerApprovalQueue'));
const PaymentPanel = lazy(() => import('./components/PaymentPanel'));
const OrderDetailModal = lazy(() => import('./components/OrderDetailModal'));
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel'));
const SmartDispatchView = lazy(() => import('./components/SmartDispatchView'));
// Ops-only monitoring surfaces.
const DriverTrackingView = lazy(() => import('./components/DriverTrackingView'));

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
  const t = translations[language] ?? translations.en;
  seedProducts();

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

  const { split, apply } = useAdminPricing({ onNotice: showNotice });

  const {
    forRole, unreadCount, notify, markRead, markAllRead, sync: notificationSync,
  } = useNotifications();

  const { requestPermission } = usePushNotifications();
  const userIdentifier = session?.identifier || email;
  useFCMTokenSync(userIdentifier);

  const {
    orders, booking, updateBooking, requestDelivery, repeatBooking,
    savedAddresses, setSavedAddresses, driverUpdate, refreshDriverUpdate,
    updateOrderStatus, issueDeliveryCode, confirmDelivery, requestRefund,
    acceptDriverJob, releaseDriverJob,
  } = useBooking({ email, buyerPhone: session?.identifier ?? '', onNotice: showNotice, notify });

  const { downloadReport } = useReports({ region, orders, onNotice: showNotice });

  const { ratings, submitRating, checkHasRated } = useRatings();

  const buyerIdentifier = session?.identifier || email;
  const { summary: loyaltySummary, profile: loyaltyProfile } = useLoyalty({
    orders,
    buyerId: buyerIdentifier,
    onNotice: showNotice,
  });

  const [ratingOrder, setRatingOrder] = useState(null);
  const { orders: ratedOrders } = useRatedOrders(orders, session?.identifier ?? email);

  const { summary: sellerPerfSummary, ranked: sellerRanked } = useSellerPerformance({ orders, ratings });

  const { summary: driverRatingsSummary } = useDriverRatings(null);

  const fleetDrivers = useMemo(() => list('drivers'), []);

  const reliabilityRanked = rankReliability(orders);
  const reliabilitySummaryData = reliabilitySummary(orders);

  const { aiOpen, toggleAi, closeAi, aiInput, setAiInput, aiMessages, askAi, aiLoading, aiSource, aiFallbackReason } = useNautAi({
    language,
    role,
    orders,
    split,
    sellerScores: sellerRanked,
    reliabilityScores: reliabilityRanked,
    buyerId: buyerIdentifier,
  });

  const roleNotifications = forRole(role);
  const roleUnread = unreadCount(role);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const [driverCodeOrderId, setDriverCodeOrderId] = useState(null);
  const [busyDriverOrderId, setBusyDriverOrderId] = useState(null);
  const driverCodeOrder = driverCodeOrderId
    ? orders.find((order) => order.id === driverCodeOrderId) ?? null
    : null;

  useEffect(() => {
    if (ready && (buyerAuthenticated || sellerAuthenticated || driverAuthenticated || adminAuthenticated)) {
      if (!requestPermission) return;
      const requested = requestPermission();
      if (requested && typeof requested.catch === 'function') requested.catch(() => {});
    }
  }, [ready, buyerAuthenticated, sellerAuthenticated, driverAuthenticated, adminAuthenticated, requestPermission]);

  const driverAccept = async (orderId) => {
    setBusyDriverOrderId(orderId);
    await acceptDriverJob(orderId, notify);
    trackEvent(EVENTS.DRIVER_JOB_ACCEPTED, { orderId });
    setBusyDriverOrderId(null);
  };

  const driverAdvance = async (orderId, status) => {
    setBusyDriverOrderId(orderId);
    await updateOrderStatus(orderId, status, notify);
    trackEvent(EVENTS.DRIVER_JOB_COMPLETED, { orderId, status });
    setBusyDriverOrderId(null);
  };

  const driverRelease = async (orderId) => {
    setBusyDriverOrderId(orderId);
    await releaseDriverJob(orderId, notify);
    trackEvent(EVENTS.DRIVER_JOB_ACCEPTED, { orderId, released: true });
    setBusyDriverOrderId(null);
  };

  const confirmDeliveryWithRating = useCallback(async (orderId, code) => {
    const result = await confirmDelivery(orderId, code);
    if (result?.ok && buyerAuthenticated) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        const hasRated = await checkHasRated(session?.identifier ?? email, orderId);
        if (!hasRated) setRatingOrder(order);
      }
    }
    return result;
  }, [confirmDelivery, buyerAuthenticated, orders, session, email, checkHasRated]);

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
            {key === role && roleUnread > 0 && <em>{roleUnread}</em>}
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
        <div className="sidebar-bottom"><button className="sidebar-link" type="button" onClick={() => showNotice('Help request received. Our support team will call you back shortly.')}><span>?</span>Help & support</button><div className="profile"><span className="avatar">{identity.initials}</span><span><b>{identity.name}</b><small>{identity.detail}</small></span><span className="more">•••</span></div></div>
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
            <button className={`ai-trigger ${aiOpen ? 'active' : ''}`} type="button" onClick={toggleAi}>
              <span>?</span> Naut AI
            </button>
            <button className="icon-button" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <span>?</span>
              {roleUnread > 0 && <em>{roleUnread}</em>}
            </button>
            <button className="icon-button" type="button" aria-label="Messages" aria-expanded={messagesOpen} onClick={() => setMessagesOpen(!messagesOpen)}>
              <span>?</span>
            </button>
            {canSignOut && <button className="icon-button topbar-signout" type="button" aria-label="Sign out" title="Sign out" onClick={() => signOut()}><span>?</span></button>}
            <button className="profile mobile-profile" type="button" aria-label={`Signed in as ${identity.name}`}><span className="avatar">{identity.initials}</span></button>
          </div>
        </header>
        <PWASetup />
        <PWADetectOffline onOfflineChange={(offline) => showNotice(offline ? 'You are offline. Changes will sync when reconnected.' : 'Back online. Syncing...')} />
        {notice && <div className="notice" role="status"><span>?</span>{notice}<button type="button" aria-label="Dismiss notification" onClick={dismissNotice}>×</button></div>}
        {aiOpen && <AiPanel role={role} input={aiInput} setInput={setAiInput} messages={aiMessages} askAi={askAi} close={closeAi} aiLoading={aiLoading} aiSource={aiSource} aiFallbackReason={aiFallbackReason} />}
        {!ready && <section className="access-gate panel"><span className="access-lock">?</span><p className="eyebrow">Preparing secure workspace</p><h1>Setting up your accounts.</h1><p>Nautica is generating the local account registry and its credentials on this device. This takes a moment and needs no network access.</p></section>}
        {notificationsOpen && (
          <Suspense fallback={null}>
            <NotificationsPanel
              notifications={roleNotifications}
              unreadCount={roleUnread}
              onMarkAllRead={() => markAllRead(role)}
              onMarkRead={markRead}
              onClose={() => setNotificationsOpen(false)}
              onOrderClick={setDetailOrderId}
              sync={notificationSync}
              supportPhone={SUPPORT_PHONE}
            />
          </Suspense>
        )}
        {messagesOpen && ready && session && (
          <Suspense fallback={null}>
            <MessagingPanel
              currentUserId={session.identifier}
              currentUserRole={role}
              currentUserName={session.displayName || session.identifier}
              onClose={() => setMessagesOpen(false)}
            />
          </Suspense>
        )}
        {ready && role === 'buyer' && (buyerAuthenticated ? <><BuyerView booking={booking} updateBooking={updateBooking} requestDelivery={requestDelivery} orders={orders} showNotice={showNotice} authStep={authStep} email={email} setEmail={setEmail} emailCode={emailCode} sendOtp={sendOtp} confirmEmailCode={confirmEmailCode} confirmDelivery={confirmDeliveryWithRating} requestRefund={requestRefund} savedAddresses={savedAddresses} repeatBooking={repeatBooking} setSavedAddresses={setSavedAddresses} t={t} driverUpdate={driverUpdate} refreshDriverUpdate={refreshDriverUpdate} loyalty={loyaltySummary} loyaltyProfile={loyaltyProfile} estimateForOrder={estimateForOrder} onRateOrder={handleRateOrder} ratedOrders={ratedOrders} buyerId={buyerIdentifier} /><BuyerFinance orders={orders} showNotice={showNotice} /></> : <BuyerAccessGate onSignedIn={() => {}} startSignIn={startPhoneSignIn} confirmCode={confirmPhoneCode} generatedCode={phoneCode} identifier={phoneIdentifier} error={signInError} onRegister={(value) => registerAccount({ identifier: value, role: 'buyer', displayName: 'Buyer' })} accountExists={accountExists} onGoogle={signInWithGoogleIdentity} onMeta={signInWithMetaIdentity} showNotice={showNotice} />)}
        {detailOrder && (
          <Suspense fallback={null}>
            <OrderDetailModal
              order={detailOrder}
              onClose={() => setDetailOrderId(null)}
              onShowNotice={showNotice}
              viewerRole={role}
              rating={ratedOrders.find((r) => r.id === detailOrder.id) ?? null}
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
                { ...ratingData, sellerName: ratingOrder.sellerName, driverName: ratingOrder.driverName },
                notify
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
        {ready && role === 'ops' && adminAuthenticated && (
          <Suspense fallback={<div className="panel lazy-fallback" aria-hidden="true" />}>
            <DriverTrackingView orders={orders} onNotice={showNotice} />
          </Suspense>
        )}
        {ready && role === 'ops' && adminAuthenticated && (
          <Suspense fallback={null}>
            <SmartDispatchView
              orders={orders}
              sellerRanked={sellerRanked}
              reliabilityRanked={reliabilityRanked}
              fleetDrivers={fleetDrivers}
              onNotice={showNotice}
            />
          </Suspense>
        )}
        {role === 'institution' && (
          <InstitutionView 
            orders={orders} 
            showNotice={showNotice}
          />
        )}
        {ready && role === 'ops' && (adminAuthenticated ? <Suspense fallback={null}><OpsView orders={orders} downloadReport={downloadReport} opsToken={opsToken} showNotice={showNotice} sellerPerfSummary={sellerPerfSummary} sellerRanked={sellerRanked} reliabilitySummary={reliabilitySummaryData} reliabilityRanked={reliabilityRanked} driverRatingsSummary={driverRatingsSummary} /></Suspense> : <AdminAccessGate onSignIn={signInWithPassword} error={signInError} onGoogle={signInWithGoogleIdentity} onMeta={signInWithMetaIdentity} showNotice={showNotice} />)}
        {ready && role === 'ops' && adminAuthenticated && <ReportActions downloadReport={downloadReport} />}
        {ready && role === 'ops' && adminAuthenticated && <OperationalRiskPanel orders={orders} sellerPerfSummary={sellerPerfSummary} sellerRanked={sellerRanked} />}
        {ready && role === 'ops' && adminAuthenticated && <RevenueFinance orders={orders} showNotice={showNotice} />}
        {ready && role === 'ops' && adminAuthenticated && <Suspense fallback={null}><AdminPricingConsole onNotice={showNotice} opsToken={opsToken} /></Suspense>}
        </main>
      </ErrorBoundary>
    </div>
  );
}

export function AiPanel({ role, input, setInput, messages, askAi, close, aiLoading, aiSource, aiFallbackReason }) {
  const quickActions = aiQuickActions(role);
  const sourceBadge = (() => {
    if (!aiSource) return null;
    const label = aiSource === 'gemini' ? 'Gemini' : 'Local rules';
    return <span className={`ai-source ${aiSource}`}>{label}</span>;
  })();
  return <section className="ai-panel" aria-label="Naut AI assistant"><div className="ai-panel-head"><div><span className="ai-label">? NAUT AI</span><strong>{role === 'ops' ? 'Operations copilot' : 'Your water-delivery copilot'}</strong>{sourceBadge}</div><button type="button" aria-label="Close Naut AI" onClick={close}>×</button></div><div className="ai-messages">{messages.slice(-4).map((message, index) => <p className={message.from + (message.from === 'ai' && aiLoading && index === messages.length - 1 ? ' loading' : '')} key={`${message.from}-${index}`}>{message.text}</p>)}{aiLoading && <p className="ai loading">?</p>}</div>{aiSource === 'fallback' && <p className="ai-fallback-note" role="status">{aiFallbackMessage(aiFallbackReason)}</p>}<div className="ai-quick-actions">{quickActions.map((action) => <button type="button" key={action} onClick={() => setInput(action)}>{action}</button>)}</div><form className="ai-form" onSubmit={askAi}><input aria-label="Ask Naut AI" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about orders, pricing, or demand..." disabled={aiLoading} /><button type="submit" disabled={aiLoading}>Ask <span>?</span></button></form><small className="ai-disclaimer">Answers come from Gemini when this server can reach it. When it cannot, the assistant reads your real orders on this device and says so above. Confirm payment, quality, and dispatch actions in the workspace.</small></section>;
}

export default App;
