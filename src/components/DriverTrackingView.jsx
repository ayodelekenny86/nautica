import { useState, useMemo, useCallback } from 'react';
import { formatCedi } from '../lib/money';
import useDriverTracking from '../hooks/useDriverTracking';
import { seedFleet } from '../lib/fleet';
import useLoadBalancing from '../hooks/useLoadBalancing';
import useSmartAssignment from '../hooks/useSmartAssignment';
import usePredictiveAnalytics from '../hooks/usePredictiveAnalytics';
import { useDriverRatings } from '../hooks/useRatings';
import useNotifications from '../hooks/useNotifications';

function DriverMarker({ driver, onClick }) {
  const statusColors = {
    online: '#10b981',
    offline: '#6b7280',
    'on-job': '#3b82f6',
  };

  return (
    <button
      className="driver-marker"
      style={{
        left: `${driver.x}%`,
        top: `${driver.y}%`,
        borderColor: statusColors[driver.status] || statusColors.online,
        backgroundColor: statusColors[driver.status] || statusColors.online,
      }}
      onClick={() => onClick(driver)}
      aria-label={`${driver.driverName} - ${driver.status}`}
    >
      <span className="marker-dot" />
      {driver.currentOrder && <span className="marker-pulse" />}
    </button>
  );
}

function RouteLine({ route }) {
  if (!route) return null;

  return (
    <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
      </defs>
      <line
        x1={route.originX}
        y1={route.originY}
        x2={route.destX}
        y2={route.destY}
        stroke="#3b82f6"
        strokeWidth="2"
        strokeDasharray="5,5"
        markerEnd="url(#arrowhead)"
      />
      <circle cx={route.originX} cy={route.originY} r="4" fill="#10b981" />
      <circle cx={route.destX} cy={route.destY} r="4" fill="#ef4444" />
    </svg>
  );
}

function DriverCard({ driver, route, onViewRoute, driverRatings }) {
  const statusLabels = {
    online: 'Available',
    offline: 'Offline',
    'on-job': 'On Delivery',
  };

  const rating = driverRatings?.find((r) => r.driverId === driver.driverId);
  const average = rating ? (rating.overall ?? rating.average) : null;

  return (
    <article className="driver-track-card panel">
      <div className="driver-track-header">
        <div>
          <strong>{driver.driverName}</strong>
          <small>{driver.vehicle} · {driver.location}</small>
          {average != null && (
            <span className="driver-rating-badge">★ {average.toFixed(1)}</span>
          )}
        </div>
        <span className={`status ${driver.status === 'online' ? 'status-online' : driver.status === 'on-job' ? 'status-enroute' : 'status-offline'}`}>
          {statusLabels[driver.status] || driver.status}
        </span>
      </div>

      <div className="driver-track-stats">
        <div><span>Speed:</span> <strong>{driver.speed != null ? `${driver.speed} km/h` : 'Not reported'}</strong></div>
        <div><span>Heading:</span> <strong>{driver.heading ? `${Math.round(driver.heading)}°` : '—'}</strong></div>
        <div><span>Last update:</span> <strong>{driver.lastUpdate ? new Date(driver.lastUpdate).toLocaleTimeString() : 'Never'}</strong></div>
      </div>

      {driver.currentOrder && route && (
        <div className="route-summary">
          <div><span>To:</span> <strong>{route.destination}</strong></div>
          <div><span>Distance:</span> <strong>{route.distance != null ? `${route.distance.toFixed(1)} km` : 'Not estimated'}</strong></div>
          <div><span>ETA:</span> <strong>{route.eta}</strong></div>
          <div><span>Progress:</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${route.progress}%` }} />
            </div>
            <small>{route.progress}%</small>
          </div>
          <button className="outline-button" type="button" onClick={() => onViewRoute(driver.currentOrder)}>
            View Route
          </button>
        </div>
      )}

      {!driver.currentOrder && driver.status === 'online' && (
        <p className="driver-idle">Waiting for assignment...</p>
      )}

      {/* An offline driver has no live position and no job, so there is nothing to
          chart. The card used to end after "Last update", which read as a broken
          panel rather than a driver who is simply off duty. */}
      {!driver.currentOrder && driver.status === 'offline' && (
        <p className="driver-idle">Offline — no live position reported.</p>
      )}
    </article>
  );
}

function OrderTrackingCard({ order, driverPosition, route, onViewRoute }) {
  const statusColors = {
    'Awaiting payment': 'status-awaiting',
    'Assigned': 'status-assigned',
    'En Route': 'status-enroute',
    'Delivered': 'status-delivered',
  };

  return (
    <article className="order-track-card panel">
      <div className="order-track-header">
        <div>
          <strong>{order.code}</strong>
          <small>{order.location}</small>
        </div>
        <span className={`status ${statusColors[order.status] || ''}`}>{order.status}</span>
      </div>

      {driverPosition && (
        <div className="driver-track-mini">
          <div className="driver-mini-info">
            <span>🚛</span>
            <strong>{driverPosition.driverName}</strong>
            <small>{driverPosition.vehicle}</small>
          </div>
          <div className="driver-mini-eta">
            <span>{driverPosition.eta}</span>
            <small>{driverPosition.progress}% complete</small>
          </div>
        </div>
      )}

      <div className="order-track-details">
        <div><span>Volume:</span> <strong>{order.volume}</strong></div>
        <div><span>Value:</span> <strong>{formatCedi(order.chargedMinor ?? 0)}</strong></div>
        {driverPosition && <div><span>Current location:</span> <strong>{driverPosition.location}</strong></div>}
      </div>

      {route && (
        <button className="outline-button" type="button" onClick={() => onViewRoute(order.id)}>
          View Full Route
        </button>
      )}
    </article>
  );
}

function MapView({ drivers, selectedRoute, onCloseRoute }) {
  // Derived from this component's own `drivers` prop. It used to read
  // `allDrivers`, which only exists in the parent's scope, so the first render
  // threw a ReferenceError and the whole tracking page stayed blank.
  const occupied = useMemo(() => {
    const keys = new Set(drivers.map((d) => mapKeyFor(d.location)));
    return keys;
  }, [drivers]);

  return (
    <div className="map-container panel">
      <div className="map-header">
        <h3>Live Driver Map</h3>
        <div className="map-legend">
          <span className="legend-item"><span className="legend-dot online" /> Available</span>
          <span className="legend-item"><span className="legend-dot on-job" /> On Delivery</span>
          <span className="legend-item"><span className="legend-dot offline" /> Offline</span>
        </div>
      </div>

      <div className="map-canvas">
        {/* Simplified map representation - in production would use Mapbox/Leaflet */}
        <div className="map-grid">
          {Object.entries(LOCATION_LABELS).map(([key, label]) => (
            <div
              key={key}
              className={`map-location${occupied.has(key) ? ' occupied' : ''}`}
              style={{ left: `${LOCATION_POSITIONS[key].x}%`, top: `${LOCATION_POSITIONS[key].y}%` }}
            >
              <span className="location-name">{label}</span>
            </div>
          ))}

          {drivers.map((driver) => (
            <DriverMarker
              key={driver.driverId}
              driver={{
                ...driver,
                x: LOCATION_POSITIONS[mapKeyFor(driver.location)]?.x ?? 50,
                y: LOCATION_POSITIONS[mapKeyFor(driver.location)]?.y ?? 50,
              }}
              onClick={() => {}}
            />
          ))}

          {selectedRoute && (
            <RouteLine
              route={{
                originX: LOCATION_POSITIONS[mapKeyFor(selectedRoute.origin)]?.x ?? 50,
                originY: LOCATION_POSITIONS[mapKeyFor(selectedRoute.origin)]?.y ?? 50,
                destX: LOCATION_POSITIONS[mapKeyFor(selectedRoute.destination)]?.x ?? 50,
                destY: LOCATION_POSITIONS[mapKeyFor(selectedRoute.destination)]?.y ?? 50,
              }}
            />
          )}
        </div>
      </div>

      {selectedRoute && (
        <div className="route-detail-panel">
          <div className="route-detail-header">
            <h4>Route: {selectedRoute.origin} → {selectedRoute.destination}</h4>
            <button className="icon-button" onClick={onCloseRoute}>×</button>
          </div>
          <div className="route-detail-stats">
            <div><span>Driver:</span> <strong>{selectedRoute.driver}</strong></div>
            <div><span>Vehicle:</span> <strong>{selectedRoute.vehicle}</strong></div>
            <div><span>Distance:</span> <strong>{selectedRoute.distance != null ? `${selectedRoute.distance.toFixed(1)} km` : 'Not estimated'}</strong></div>
            <div><span>ETA:</span> <strong>{selectedRoute.eta}</strong></div>
            <div><span>Progress:</span> <strong>{selectedRoute.progress}%</strong></div>
            <div><span>Status:</span> <strong>{selectedRoute.status}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified map layout for Accra localities
const LOCATION_LABELS = {
  'east-legon': 'East Legon',
  'cantonments': 'Cantonments',
  'osu': 'Osu',
  'airport': 'Airport Res.',
  'tema': 'Tema',
  'spintex': 'Spintex',
  'madina': 'Madina',
  'abeka': 'Abeka',
  'achimota': 'Achimota',
  'dansoman': 'Dansoman',
  'central': 'Accra Central',
  'labadi': 'Labadi',
  'adenta': 'Adenta',
};

// Percentage positions on the map canvas, for both the labels and the markers.
// The CSS lays the map out absolutely from these same numbers (see
// `.map-location` in App.css), so a label and the dot for the same locality
// cannot drift apart. They previously did: the labels came from a separate
// `grid-template-areas` box whose cells lined up with nothing, so "East Legon"
// sat in one place and every East Legon driver was drawn somewhere else.
//
// The arrangement is schematic, not a survey, but it is not arbitrary either:
// x is roughly west→east and y is roughly north→south, so a dot on the left of
// the canvas is a driver west of one on the right. The previous grid put
// Cantonments, East Legon and Tema on the same row, which drew three drivers
// 20km apart as if they were in a line, and put Labadi below Osu when they are
// neighbours.
const LOCATION_POSITIONS = {
  // northern belt
  'achimota':   { x: 12, y: 14 },
  'abeka':      { x: 30, y: 14 },
  'airport':    { x: 52, y: 16 },
  'madina':     { x: 72, y: 14 },
  'adenta':     { x: 89, y: 20 },
  // central belt
  'dansoman':   { x: 12, y: 46 },
  'central':    { x: 34, y: 44 },
  'cantonments': { x: 52, y: 50 },
  'osu':        { x: 44, y: 62 },
  'labadi':     { x: 60, y: 62 },
  'east-legon': { x: 72, y: 46 },
  // eastern corridor
  'spintex':    { x: 78, y: 66 },
  'tema':       { x: 90, y: 46 },
};

function normalizeLocationKey(location) {
  if (!location) return 'central';
  return location
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The map key for a free-text address.
 *
 * The roster writes bases as "East Legon, Accra", which normalises to
 * `east-legon-accra` and matched none of the keys above — so every marker fell
 * back to the centre of the canvas and the whole fleet stacked on one dot. The
 * place name is what matters, so the first known locality mentioned wins over
 * the trailing city.
 */
function mapKeyFor(location) {
  const normalized = normalizeLocationKey(location);
  if (LOCATION_POSITIONS[normalized]) return normalized;
  return Object.keys(LOCATION_POSITIONS).find((key) => normalized.includes(key)) ?? 'central';
}

export function DriverTrackingView({ orders, onNotice }) {
  // The roster is seeded once, on first mount, the same way the rest of the app
  // seeds its collections. Without it a fresh workspace has an empty fleet list
  // and the map has nothing to place, which reads as "tracking is broken".
  const [roster] = useState(() => seedFleet());

  // Names match what `useDriverTracking` actually returns. The previous
  // destructure invented `driverPositions`, `getActiveDrivers`, `getRoute`,
  // `updateDriverPosition` and `setDriverStatus`, none of which exist, so every
  // one of them was `undefined` and the first call threw. Nothing caught it
  // because nothing rendered this view.
  const {
    drivers,
    driverLocations,
    onJobDrivers,
  } = useDriverTracking({ orders, sellerProfile: {} });

  // There is no tracking on/off switch in the hook — positions are already being
  // read and persisted — so there is nothing for a start/stop button to toggle.
  // The toolbar refreshes instead of pretending to start a feed that is not there.

  // Ratings per driver, so the fleet list shows reputation alongside live
  // position. Ops can see which drivers are well thought of without opening
  // each driver's own dashboard.
  const { summary: fleetRatings } = useDriverRatings(null);

  // Notifications for smart alerts
  const { forRole, unreadCount, markRead } = useNotifications();

  // Smart features. The hook names are used as-is: the previous destructure
  // renamed `fleetStats` to `assignmentFleetStats` and asked for
  // `applyRebalancing`/`lastRebalance`, which the hooks do and do not export
  // respectively — `applyRebalancing` exists but was not returned, so it is
  // now exported from the hook below.
  const { zoneLoads, rebalancingSuggestions, autoRebalanceEnabled, setAutoRebalanceEnabled, surgeMode, activateSurge, fleetSummary, refreshLoads, applyRebalancing, lastUpdated } = useLoadBalancing({ orders, driverPositions: driverLocations, onNotice });
  const { optimizationQueue, autoAssignEnabled, setAutoAssignEnabled, fleetStats, autoAssignAll, optimizeRoutes, applyOptimization } = useSmartAssignment({ orders, driverPositions: driverLocations, onNotice, updateOrderStatus: async (id, status) => (status ? { ok: true } : { ok: false }) });
  const { anomalies, summary: analyticsSummary, loading: analyticsLoading } = usePredictiveAnalytics({ orders, customers: [], driverPositions: driverLocations });

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list' | 'smart'
  const [smartTab, setSmartTab] = useState('loadbalance');

  const activeDrivers = onJobDrivers;

  // Driver records shaped the way this view renders them.
  //
  // The cards below were written for `{ driverId, driverName, vehicle, location,
  // status, speed, heading, lastUpdate, currentOrder }`, but the hook returns
  // `{ id, name, vehicle, currentStatus, liveLocation, lastUpdate, activeJobs }`.
  // Reading the old names off the new records gave every driver an undefined
  // name and an `undefined` status, so the list rendered blank cards. Mapped once
  // here rather than in each card.
  const allDrivers = useMemo(() => {
    const activeOrderByDriver = new Map();
    orders.forEach((order) => {
      if (order.driverId && (order.status === 'Assigned' || order.status === 'En Route')) {
        activeOrderByDriver.set(order.driverId, order);
      }
    });

    return drivers.map((entry) => {
      const currentOrder = activeOrderByDriver.get(entry.id) ?? null;
      const status = entry.status ?? entry.currentStatus;
      // The roster stores `base` (e.g. "East Legon, Accra"); the hook adds
      // `liveLocation`. Reading only `location` left every card saying
      // "Unknown" even though dispatch knew exactly where the driver was based.
      const positional = entry.liveLocation?.location || entry.liveLocation?.zone?.name;
      const location = positional || entry.base || entry.location || 'Unknown';
      // An order in flight is what the driver is actually doing, so it wins over
      // the roster's `online` flag. Without this a driver on a delivery read
      // "Available" while the card below showed the order they were carrying.
      const busy = currentOrder || status === 'en_route';
      return {
        driverId: entry.id,
        driverName: entry.name || entry.id,
        vehicle: entry.vehicle || '—',
        location,
        status: busy ? 'on-job' : status === 'offline' ? 'offline' : 'online',
        // The hook does not record speed or heading. That used to render as
        // "null km/h"; the card now states what is known (last update) and
        // leaves the rest out rather than filling the row with dashes.
        speed: entry.speed ?? null,
        heading: entry.heading ?? null,
        lastUpdate: entry.lastUpdate || entry.liveLocation?.updatedAt || null,
        currentOrder: currentOrder ? currentOrder.id : null,
      };
    });
  }, [drivers, orders]);

  // Routes are derived from the live positions, which is where the zone map is.
  const getRoute = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId || o.code === orderId);
    if (!order || !order.driverId) return null;
    const driver = allDrivers.find((d) => d.driverId === order.driverId);
    if (!driver) return null;

    const started = new Date(order.assignedAt || order.createdAt || 0).getTime();
    // Elapsed share of a one-hour delivery, which is the window the quote is
    // built around. Previously this multiplied hours by 100, so any order older
    // than an hour read 99% complete and a 20-minute-old one read 33%.
    const DELIVERY_WINDOW_MS = 60 * 60 * 1000;
    const progress = started > 0
      ? Math.max(0, Math.min(99, Math.round(((Date.now() - started) / DELIVERY_WINDOW_MS) * 100)))
      : 0;
    return {
      orderId: order.id,
      origin: driver.location,
      destination: order.location,
      driver: driver.driverName,
      vehicle: driver.vehicle,
      // No route engine is connected, so a distance is not estimated here.
      distance: null,
      eta: order.eta || 'Awaiting estimate',
      progress: order.status === 'Delivered' ? 100 : progress,
      status: order.status,
    };
  }, [orders, allDrivers]);

  // Build driver cards with routes
  const driverCards = useMemo(() => {
    return allDrivers.map((driver) => ({
      driver,
      route: driver.currentOrder ? getRoute(driver.currentOrder) : null,
    }));
  }, [allDrivers, getRoute]);

  // Build order tracking cards
  const activeOrders = useMemo(() => orders.filter((o) =>
    o.driverId && (o.status === 'Assigned' || o.status === 'En Route')
  ), [orders]);

  const orderCards = useMemo(() => {
    return activeOrders.map((order) => ({
      order,
      // The driver carrying this order, which is what the mini card shows.
      driverPosition: allDrivers.find((d) => d.driverId === order.driverId) ?? null,
      route: getRoute(order.id),
    }));
  }, [activeOrders, allDrivers, getRoute]);

  const handleViewRoute = (orderId) => {
    const route = getRoute(orderId);
    if (route) setSelectedRoute(route);
    else onNotice?.('Assign a driver to this order before opening its route.');
  };

  const notifications = forRole('ops');
  const opsUnread = unreadCount('ops');
  // The alerts tab below reads `opsNotifications`; the list itself is
  // `notifications`. The mismatch was never caught because nothing imported
  // this view, so opening the tab would have thrown and blanked the page.
  const opsNotifications = notifications;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="section-kicker">DRIVER TRACKING · ACCRA</p>
          <h1>Live fleet monitoring</h1>
          <p>Track driver locations, routes, and ETAs in real time.</p>
        </div>
        <div className="tracking-controls">
          <button
            className="outline-button"
            type="button"
            onClick={() => { refreshLoads(); onNotice?.('Fleet positions, zone load and suggestions refreshed.'); }}
          >
            Refresh positions
          </button>
          <button
            className={viewMode === 'map' ? 'primary-button' : 'outline-button'}
            type="button"
            onClick={() => setViewMode('map')}
          >
            Map
          </button>
          <button
            className={viewMode === 'list' ? 'primary-button' : 'outline-button'}
            type="button"
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button
            className={viewMode === 'smart' ? 'primary-button' : 'outline-button'}
            type="button"
            onClick={() => setViewMode('smart')}
          >
            Smart Hub
          </button>
        </div>
      </div>

      {viewMode === 'map' && (
        <>
          <MapView
            drivers={allDrivers}
            selectedRoute={selectedRoute}
            onCloseRoute={() => setSelectedRoute(null)}
          />
          <section className="panel driver-track-list">
            <div className="panel-title">
              <span className="section-kicker">FLEET</span>
              <h2>{allDrivers.length} driver{allDrivers.length !== 1 ? 's' : ''} · {allDrivers.filter((d) => d.status === 'online').length} available</h2>
            </div>
            {allDrivers.length === 0 ? (
              <p className="empty-feed">No drivers on the fleet roster yet. A driver appears here once their account is on the roster.</p>
            ) : (
              <div className="driver-track-grid">
                {driverCards.map(({ driver, route }) => (
                  <DriverCard
                    key={driver.driverId}
                    driver={driver}
                    route={route}
                    driverRatings={fleetRatings?.ratings ?? []}
                    onViewRoute={handleViewRoute}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {viewMode === 'list' && (
        <>
          <section className="panel">
            <div className="panel-title">
              <span className="section-kicker">ACTIVE DRIVERS</span>
              <h2>{activeDrivers.length} on job · {allDrivers.filter(d => d.status === 'online').length} available</h2>
            </div>
            <div className="driver-track-grid">
{driverCards.map(({ driver, route }) => (
                <DriverCard
                  key={driver.driverId}
                  driver={driver}
                  route={route}
                  driverRatings={fleetRatings?.ratings ?? []}
                  onViewRoute={handleViewRoute}
                />
              ))}
            </div>
            {allDrivers.length === 0 && (
              <p className="empty-feed">No drivers in fleet. Add drivers in the fleet management section.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-title">
              <span className="section-kicker">ACTIVE DELIVERIES</span>
              <h2>{activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} in progress</h2>
            </div>
            {activeOrders.length === 0 ? (
              <p className="empty-feed">No active deliveries. Orders appear here when assigned to a driver.</p>
            ) : (
              <div className="order-track-grid">
                {orderCards.map(({ order, driverPosition, route }) => (
                  <OrderTrackingCard
                    key={order.id}
                    order={order}
                    driverPosition={driverPosition}
                    route={route}
                    onViewRoute={handleViewRoute}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {viewMode === 'smart' && (
        <section className="panel">
          <div className="panel-toolbar">
            <div className="panel-title">
              <span className="section-kicker">SMART HUB</span>
              <h2>AI-Powered Fleet Intelligence</h2>
            </div>
          </div>

          <div className="smart-tabs">
            <button className={smartTab === 'loadbalance' ? 'active' : ''} onClick={() => setSmartTab('loadbalance')}>Load Balancing</button>
            <button className={smartTab === 'assignment' ? 'active' : ''} onClick={() => setSmartTab('assignment')}>Auto-Assignment</button>
            <button className={smartTab === 'analytics' ? 'active' : ''} onClick={() => setSmartTab('analytics')}>Predictive Analytics</button>
            <button className={smartTab === 'notifications' ? 'active' : ''} onClick={() => setSmartTab('notifications')}>Smart Alerts</button>
          </div>

          {smartTab === 'loadbalance' && (
            <div className="smart-panel">
<div className="loadbalance-summary">
              <article className="summary-card">
                <span>Online Drivers</span>
                <strong>{fleetSummary.onlineDrivers}</strong>
              </article>
              <article className="summary-card">
                <span>On Job</span>
                <strong>{fleetSummary.onJobDrivers}</strong>
              </article>
              <article className="summary-card">
                <span>Pending Orders</span>
                <strong>{fleetSummary.totalPendingOrders}</strong>
              </article>
              <article className="summary-card">
                <span>Avg Utilization</span>
                <strong>{fleetSummary.avgZoneUtilization}%</strong>
              </article>
              <article className={fleetSummary.surgeActive ? 'summary-card warning' : 'summary-card'}>
                <span>Surge Mode</span>
                <strong>{fleetSummary.surgeActive ? 'ACTIVE' : 'OFF'}</strong>
              </article>
              <article className="summary-card">
                <span>Last Refresh</span>
                <strong>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</strong>
              </article>
            </div>
              <div className="loadbalance-controls">
                <label className="toggle-label">
                  <input type="checkbox" checked={autoRebalanceEnabled} onChange={e => setAutoRebalanceEnabled(e.target.checked)} />
                  <span>Auto Rebalance</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" checked={surgeMode} onChange={e => activateSurge(e.target.checked)} />
                  <span>Surge Pricing</span>
                </label>
                <button className="outline-button" onClick={refreshLoads}>Refresh Zones</button>
              </div>
              <div className="panel-divider" />
              <h4>Zone Load</h4>
              <div className="zone-grid">
                {zoneLoads.map(zone => (
                  <article key={zone.zoneId} className="zone-card panel">
                    <div className="zone-header">
                      <strong>{zone.zoneName}</strong>
                      <span className={`pressure ${zone.pressure}`}>{zone.pressure.toUpperCase()}</span>
                    </div>
                    <div className="zone-stats">
                      <div><span>Pending:</span> <strong>{zone.pendingOrders}</strong></div>
                      <div><span>Active:</span> <strong>{zone.activeOrders}</strong></div>
                      <div><span>Drivers:</span> <strong>{zone.availableDrivers} avail / {zone.busyDrivers} busy</strong></div>
                      <div><span>Utilization:</span> <strong>{zone.utilization.toFixed(0)}%</strong></div>
                    </div>
                  </article>
                ))}
              </div>
              {rebalancingSuggestions.length > 0 && (
                <>
                  <div className="panel-divider" />
                  <h4>Rebalancing Suggestions</h4>
                  <div className="suggestion-list">
                    {rebalancingSuggestions.map((s, i) => (
                      <div key={i} className="suggestion-item">
                        <span className="suggestion-type">{s.type}</span>
                        <span>{s.reason}</span>
                        <button className="text-button" onClick={() => applyRebalancing(s)}>Apply</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {smartTab === 'assignment' && (
            <div className="smart-panel">
<div className="assignment-stats">
              <article className="summary-card">
                <span>Pending Assignment</span>
                <strong>{fleetStats.unassignedOrders}</strong>
              </article>
              <article className="summary-card">
                <span>Available Drivers</span>
                <strong>{fleetStats.availableDrivers}</strong>
              </article>
              <article className="summary-card">
                <span>Auto-Assign</span>
                <strong>{autoAssignEnabled ? 'ON' : 'OFF'}</strong>
              </article>
              <article className="summary-card">
                <span>Pending Optimizations</span>
                <strong>{fleetStats.pendingOptimizations}</strong>
              </article>
            </div>
              <div className="assignment-controls">
                <label className="toggle-label">
                  <input type="checkbox" checked={autoAssignEnabled} onChange={e => setAutoAssignEnabled(e.target.checked)} />
                  <span>Enable Auto-Assignment</span>
                </label>
                <button className="primary-button" onClick={autoAssignAll} disabled={fleetStats.unassignedOrders === 0 || fleetStats.availableDrivers === 0}>
                  Assign All Now
                </button>
                <button className="outline-button" onClick={optimizeRoutes} disabled={fleetStats.pendingOptimizations === 0}>
                  Optimize Routes
                </button>
              </div>
              {optimizationQueue.length > 0 && (
                <>
                  <div className="panel-divider" />
                  <h4>Route Optimizations</h4>
                  <div className="optimization-list">
                    {optimizationQueue.map((opt, i) => (
                      <div key={i} className="optimization-item">
                        <span>Driver {opt.driverId}</span>
                        <span>{opt.optimizedOrders.length} stops optimized</span>
                        <button className="text-button" onClick={() => applyOptimization(opt.id)}>Apply</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {smartTab === 'analytics' && (
            <div className="smart-panel">
              {analyticsLoading ? <p>Loading analytics…</p> : (
                <>
                  <div className="analytics-summary">
                    <article className="analytics-card">
                      <span>Total Customers</span>
                      <strong>{analyticsSummary.totalCustomers}</strong>
                    </article>
                    <article className="analytics-card warning">
                      <span>At Risk</span>
                      <strong>{analyticsSummary.atRiskCustomers}</strong>
                    </article>
                    <article className="analytics-card highlight">
                      <span>VIP Customers</span>
                      <strong>{analyticsSummary.vipCustomers}</strong>
                    </article>
                    <article className="analytics-card">
                      <span>Predicted LTV</span>
                      <strong>{formatCedi(analyticsSummary.totalPredictedLTV * 100)}</strong>
                    </article>
                    <article className="analytics-card critical">
                      <span>Critical Anomalies</span>
                      <strong>{analyticsSummary.criticalAnomalies}</strong>
                    </article>
                    <article className="analytics-card">
                      <span>30-Day Revenue Forecast</span>
                      <strong>{formatCedi((analyticsSummary.revenueForecast30d || 0) * 100)}</strong>
                    </article>
                  </div>
                  <div className="panel-divider" />
                  <h4>Driver Anomalies</h4>
                  <div className="anomaly-list">
                    {anomalies?.slice(0, 5).map((a, i) => (
                      <div key={i} className="anomaly-item">
                        <span>{a.type}</span>
                        <span>{a.description}</span>
                        <span className={`severity ${a.severity}`}>{a.severity}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {smartTab === 'notifications' && (
            <div className="smart-panel">
              <div className="notification-stats">
                <article className="summary-card">
                  <span>Unread</span>
                  <strong>{opsUnread}</strong>
                </article>
                <article className="summary-card">
                  <span>Total</span>
                  <strong>{opsNotifications.length}</strong>
                </article>
              </div>
              <div className="panel-divider" />
              <h4>Recent Notifications</h4>
              <div className="notification-list">
                {opsNotifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`notification-item ${n.readAt ? 'read' : 'unread'}`}>
                    <div className="notification-content">
                      <strong>{n.title}</strong>
                      <span>{n.body}</span>
                      <small>{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                    {!n.readAt && !n.read && <button className="text-button" onClick={() => markRead(n.id)}>Mark Read</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export default DriverTrackingView;