import { useState } from 'react';
import { formatCedi } from '../lib/money';
import { validateBusinessName, validateVehicleRegistration } from '../lib/security';

function JobCard({ order, driver, onAccept, onStart, onComplete, onView }) {
  const statusColors = {
    'Awaiting payment': 'status-awaiting',
    'Assigned': 'status-assigned',
    'En Route': 'status-enroute',
    'Delivered': 'status-delivered',
    'Cancelled': 'status-cancelled',
  };

  return (
    <article className="job-card panel">
      <div className="job-header">
        <div>
          <strong>{order.code}</strong>
          <small>{order.location}</small>
        </div>
        <span className={`status ${statusColors[order.status] || ''}`}>{order.status}</span>
      </div>

      <div className="job-details">
        <div><span>Volume:</span> <strong>{order.volume}</strong></div>
        <div><span>Value:</span> <strong>{formatCedi(order.chargedMinor ?? 0)}</strong></div>
        <div><span>Your share:</span> <strong>{formatCedi(order.sellerReceives ?? 0)}</strong></div>
        {driver && (
          <div className="driver-assignment">
            <span>Driver:</span> <strong>{driver.name}</strong>
            <small>({driver.base.split(',')[0]}) · {driver.vehicle}</small>
          </div>
        )}
      </div>

      <div className="job-actions">
        {order.status === 'Awaiting payment' && (
          <button className="primary-button" type="button" onClick={() => onAccept(order.id)}>
            Accept Job
          </button>
        )}
        {order.status === 'Assigned' && (
          <button className="primary-button" type="button" onClick={() => onStart(order.id)}>
            Start Delivery
          </button>
        )}
        {order.status === 'En Route' && (
          <button className="outline-button" type="button" onClick={() => onComplete(order.id)}>
            Issue Delivery Code
          </button>
        )}
        {order.status === 'Delivered' && (
          <button className="text-button" type="button" onClick={() => onView(order.id)}>
            View Receipt
          </button>
        )}
      </div>
    </article>
  );
}

function DriverCard({ driver, location, onUpdateLocation }) {
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState('');
  const [eta, setEta] = useState('');

  function submit(event) {
    event.preventDefault();
    if (!loc.trim()) return;
    onUpdateLocation(driver.id, loc.trim(), eta.trim() || 'ETA unknown');
    setLoc('');
    setEta('');
    setOpen(false);
  }

  return (
    <article className="driver-card panel">
      <div className="driver-header">
        <div>
          <strong>{driver.name}</strong>
          <small>{driver.base.split(',')[0]} · {driver.vehicle}</small>
        </div>
        <span className={`status ${driver.status === 'online' ? 'status-online' : 'status-offline'}`}>
          {driver.status === 'online' ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="driver-stats">
        <div><span>Rating:</span> <strong>{driver.rating}★</strong></div>
        <div><span>Capacity:</span> <strong>{driver.capacityGallons} gal</strong></div>
        <div><span>Active jobs:</span> <strong>{driver.activeJobs}</strong></div>
      </div>

      {location && (
        <div className="driver-location">
          <span>📍</span>
          <strong>{location.location}</strong>
          <small>ETA: {location.eta}</small>
          <small className="last-update">Updated: {new Date(location.updatedAt).toLocaleTimeString()}</small>
        </div>
      )}

      <div className="driver-actions">
        {!open ? (
          <button type="button" onClick={() => setOpen(true)}>Update location</button>
        ) : (
          <form className="driver-location-form" onSubmit={submit}>
            <input
              aria-label={`Current location for ${driver.name}`}
              value={loc}
              onChange={(event) => setLoc(event.target.value)}
              placeholder="e.g. Labone, Accra"
            />
            <input
              aria-label={`ETA for ${driver.name}`}
              value={eta}
              onChange={(event) => setEta(event.target.value)}
              placeholder="ETA (e.g. 12 min)"
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
          </form>
        )}
      </div>
    </article>
  );
}

function PayoutRow({ payout }) {
  return (
    <div className="payout-row">
      <div>
        <strong>{payout.orderId}</strong>
        <small>{new Date(payout.date).toLocaleDateString()}</small>
      </div>
      <strong>{payout.amount}</strong>
      <span className={`payout-status ${payout.status === 'Paid out' ? 'paid' : 'pending'}`}>
        {payout.status}
      </span>
    </div>
  );
}

export function SellerDashboard({
  available,
  setAvailable,
  showNotice,
  orders,
  updateOrderStatus,
  issueDeliveryCode,
  sellerProfile,
  setSellerProfile,
  sellerApproved,
  sellerApplicationId,
  applyForSellerApproval,
  refreshSellerApproval,
  completeSellerApproval,
}) {
  const activeJobs = orders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled');
  const completedJobs = orders.filter((order) => order.status === 'Delivered');
  const totalEarned = completedJobs.reduce((sum, o) => sum + (o.sellerReceives ?? 0), 0);
  const totalVolume = completedJobs.reduce((sum, o) => sum + (parseInt(o.volume) || 0), 0);
  const pendingPayout = activeJobs.reduce((sum, o) => sum + (o.sellerReceives ?? 0), 0);

  const fleetDrivers = [
    { id: 'd1', name: 'Kwame Mensah', base: 'East Legon, Accra', vehicle: 'Tanker TR-204', status: 'online', rating: 4.8, capacityGallons: 5000, activeJobs: 1 },
    { id: 'd2', name: 'Ama Boateng', base: 'Osu, Accra', vehicle: 'Tanker TR-309', status: 'offline', rating: 4.6, capacityGallons: 2000, activeJobs: 0 },
  ];

  const driverLocations = {};

  const [activeTab, setActiveTab] = useState('jobs');

  const acceptJob = async (orderId) => {
    await updateOrderStatus(orderId, 'Assigned', () => {});
    showNotice('Job accepted.');
  };

  const startJob = async (orderId) => {
    await updateOrderStatus(orderId, 'En Route', () => {});
    showNotice('Delivery started.');
  };

  const completeJob = async (orderId) => {
    await updateOrderStatus(orderId, 'Delivered', () => {});
    showNotice('Delivery completed.');
  };

  const getAssignedDriver = (orderId) => fleetDrivers[0];

  const updateDriverLocation = (driverId, location, eta) => {
    showNotice(`Location updated for driver ${driverId}.`);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="section-kicker">SELLER WORKSPACE · {sellerProfile?.business?.split(' ')[0]?.toUpperCase() || 'ACCRA'}</p>
          <h1>Ready for the next job?</h1>
          <p>Keep your status current and turn more deliveries into income.</p>
        </div>
        <button
          className={`availability ${available ? 'online' : ''}`}
          type="button"
          disabled={!sellerApproved}
          onClick={() => {
            setAvailable(!available);
            showNotice(available ? 'You are now offline.' : 'You are back online and visible to buyers.');
          }}
        >
          <i />{available ? 'Online and accepting jobs' : 'Offline'}
        </button>
      </div>

      {!sellerApproved && (
        <div className="pending-gate">
          <div className="gate-content">
            <strong>Approval required</strong>
            <p>You cannot accept jobs until an operator verifies your application.</p>
            <button
              type="button"
              className="outline-button"
              onClick={async () => {
                const result = await refreshSellerApproval();
                if (result?.ok && result.approved) {
                  await completeSellerApproval();
                }
              }}
            >
              Check approval status
            </button>
          </div>
        </div>
      )}

      <div className="seller-tabs">
        <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>Job Queue</button>
        <button className={activeTab === 'drivers' ? 'active' : ''} onClick={() => setActiveTab('drivers')}>Drivers</button>
        <button className={activeTab === 'earnings' ? 'active' : ''} onClick={() => setActiveTab('earnings')}>Earnings</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
      </div>

      {activeTab === 'jobs' && (
        <section className="panel">
          <div className="panel-toolbar">
            <div className="panel-title">
              <span className="section-kicker">JOB QUEUE</span>
              <h2>{activeJobs.length} active · {completedJobs.length} completed</h2>
            </div>
          </div>

        {activeJobs.length === 0 ? (
          <p className="empty-feed">
            {!sellerApproved
              ? 'You cannot accept jobs until your seller application is approved by an operator.'
              : 'No active jobs. New orders will appear here when buyers book.'
            }
          </p>
        ) : (
            <div className="job-list">
              {activeJobs.map((order) => (
                <JobCard
                  key={order.id}
                  order={order}
                  driver={getAssignedDriver(order.id)}
                  onAccept={acceptJob}
                  onStart={startJob}
                  onComplete={completeJob}
                  onView={() => showNotice(`Receipt for ${order.id} ready.`)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'drivers' && (
        <section className="panel">
          <div className="panel-title">
            <span className="section-kicker">ASSIGNED DRIVERS</span>
            <h2>Your fleet</h2>
          </div>
          <p className="panel-copy">Drivers available for your orders. Update their location manually.</p>

          <div className="driver-grid">
            {fleetDrivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                location={driverLocations[driver.id]}
                onUpdateLocation={updateDriverLocation}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === 'earnings' && (
        <section className="panel">
          <div className="earnings-summary">
            <article className="earnings-card highlight">
              <span>TOTAL EARNED</span>
              <strong>{formatCedi(totalEarned)}</strong>
              <small>From {completedJobs.length} completed delivery{completedJobs.length !== 1 ? 's' : ''}</small>
            </article>
            <article className="earnings-card">
              <span>TOTAL VOLUME</span>
              <strong>{totalVolume} gallons</strong>
              <small>Gallons delivered</small>
            </article>
            <article className="earnings-card warning">
              <span>PENDING PAYOUT</span>
              <strong>{formatCedi(pendingPayout)}</strong>
              <small>Awaiting buyer payment</small>
            </article>
          </div>

          <div className="panel-divider" />

          <div className="panel-title">
            <span className="section-kicker">PAYOUT HISTORY</span>
            <h2>Recent payouts</h2>
          </div>

          {completedJobs.length === 0 ? (
            <p className="empty-feed">No payouts yet. Complete deliveries to see history.</p>
          ) : (
            <div className="payout-table">
              <div className="payout-header">
                <span>Order</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {completedJobs.slice(0, 10).map((order) => (
                <PayoutRow key={order.id} payout={{ orderId: order.code, date: order.date, amount: formatCedi(order.sellerReceives ?? 0), status: 'Paid out' }} />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="panel">
          <div className="panel-title">
            <span className="section-kicker">SELLER PROFILE</span>
            <h2>Your business and vehicle details</h2>
          </div>

          <form className="seller-form" onSubmit={(event) => {
            event.preventDefault();
            const businessValidation = validateBusinessName(sellerProfile.business);
            if (!businessValidation.ok) { showNotice(businessValidation.reason); return; }
            const vehicleValidation = validateVehicleRegistration(sellerProfile.vehicle);
            if (!vehicleValidation.ok) { showNotice(vehicleValidation.reason); return; }
            showNotice('Profile updated. Ops will review changes within one business day.');
          }}>
            <div className="form-row">
              <label>Business name<input name="business" value={sellerProfile.business} onChange={(e) => setSellerProfile({ ...sellerProfile, business: e.target.value })} placeholder="Business name" /></label>
              <label>Phone<input name="phone" value={sellerProfile.phone} onChange={(e) => setSellerProfile({ ...sellerProfile, phone: e.target.value })} placeholder="Phone number" inputMode="tel" /></label>
            </div>
            <div className="form-row">
              <label>Vehicle registration<input name="vehicle" value={sellerProfile.vehicle} onChange={(e) => setSellerProfile({ ...sellerProfile, vehicle: e.target.value })} placeholder="Vehicle registration" /></label>
              <label>Tank capacity<select name="capacity" value={sellerProfile.capacity} onChange={(e) => setSellerProfile({ ...sellerProfile, capacity: e.target.value })}>
                <option>1,000 gallons</option>
                <option>2,000 gallons</option>
                <option>5,000 gallons</option>
                <option>10,000 gallons</option>
              </select></label>
            </div>
            <div className="form-row">
              <label>Verification documents<select name="document" value={sellerProfile.document} onChange={(e) => setSellerProfile({ ...sellerProfile, document: e.target.value })}>
                <option>ID document not uploaded</option>
                <option>ID document uploaded</option>
                <option>ID + vehicle documents uploaded</option>
                <option>All documents verified</option>
              </select></label>
            </div>
            <button className="primary-button" type="submit">Save Changes →</button>
          </form>

          <div className="panel-divider" />
          <div className="vehicle-summary">
            <h3>Current Setup</h3>
            <dl>
              <div><dt>Business</dt><dd>{sellerProfile.business}</dd></div>
              <div><dt>Phone</dt><dd>{sellerProfile.phone}</dd></div>
              <div><dt>Vehicle</dt><dd>{sellerProfile.vehicle}</dd></div>
              <div><dt>Capacity</dt><dd>{sellerProfile.capacity}</dd></div>
              <div><dt>Documents</dt><dd>{sellerProfile.document}</dd></div>
            </dl>
          </div>
        </section>
      )}
    </>
  );
}

export default SellerDashboard;
