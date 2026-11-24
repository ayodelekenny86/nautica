import { useEffect, useState } from "react";
import { trackEvent, EVENTS } from "../lib/analytics";

/**
 * Service-worker registration for the installable, offline-capable build.
 *
 * Two rules matter here:
 *
 *   1. Hooks are never called conditionally. The test-environment guard used to
 *      sit above `useState`, so a module evaluated in one environment and
 *      rendered in another changed the hook order between renders — React's
 *      "rendered more hooks than during the previous render" crash. The guard is
 *      now inside the effect, where it only decides whether to register.
 *   2. There is one registration path. The previous version had a hook and a
 *      component that each registered the worker with their own copy of this
 *      logic; only the component was mounted, so the hook was dead code that
 *      still ran a full registration if anything ever imported it.
 */

const isTestEnvironment =
  typeof process !== "undefined" &&
  (process.env.VITEST === "1" || process.env.NODE_ENV === "test");

let registerModule = null;
let loadPromise = null;

async function loadRegisterSW() {
  if (registerModule) return registerModule;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        registerModule = await import("virtual:pwa-register/react");
      } catch {
        // The virtual module only exists when the PWA plugin is active (a
        // plain `vite build --mode test`, or a consumer importing this file).
        registerModule = { registerSW: null };
      }
      return registerModule;
    })();
  }
  return loadPromise;
}

/** Registers the service worker and reports its update/offline state. */
export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState(
    () => () => {},
  );

  useEffect(() => {
    if (isTestEnvironment) return undefined;

    let mounted = true;
    let stopSyncing = () => {};

    loadRegisterSW().then((mod) => {
      if (!mounted || !mod.registerSW) return;
      const {
        needRefresh: refresh,
        offlineReady: ready,
        updateServiceWorker: update,
      } = mod.registerSW({
        onNeedRefresh() {
          if (mounted) setNeedRefresh(true);
        },
        onOfflineReady() {
          if (mounted) setOfflineReady(true);
        },
      });

      // The register helper exposes refs, not React state, so poll them until
      // the effect is torn down. Polling stops rather than leaking a timer.
      const timer = setInterval(() => {
        if (!mounted) return;
        setNeedRefresh(Boolean(refresh.value));
        setOfflineReady(Boolean(ready.value));
      }, 1000);
      stopSyncing = () => clearInterval(timer);
      setUpdateServiceWorker(() => update);
    });

    return () => {
      mounted = false;
      stopSyncing();
    };
  }, []);

  return { needRefresh, offlineReady, updateServiceWorker };
}

/**
 * The "new version available" strip. Renders nothing until there is one.
 *
 * Dismissing must not reload the page: the old bundle would come back from the
 * service-worker cache and the prompt would return immediately. It hides the
 * strip until this mount ends and leaves the waiting worker alone.
 */
export function PWAUpdatePrompt({ needRefresh, updateServiceWorker }) {
  const [dismissed, setDismissed] = useState(false);
  if (!needRefresh || dismissed) return null;

  return (
    <div className="pwa-update-prompt" role="alert">
      <span>New version available</span>
      <button type="button" onClick={() => updateServiceWorker(true)}>
        Refresh
      </button>
      <button type="button" onClick={() => setDismissed(true)}>
        Later
      </button>
    </div>
  );
}

/** Reports connectivity changes so the app can tell the user what is happening. */
export function PWADetectOffline({ onOfflineChange }) {
  useEffect(() => {
    const handleOnline = () => {
      onOfflineChange?.(false);
      trackEvent(EVENTS.ONLINE_RESTORED);
    };
    const handleOffline = () => {
      onOfflineChange?.(true);
      trackEvent(EVENTS.OFFLINE_DETECTED);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onOfflineChange]);

  return null;
}

/** Mounted once by App: the update prompt plus the "ready offline" toast. */
export function PWASetup() {
  const { needRefresh, offlineReady, updateServiceWorker } = usePWAUpdate();

  return (
    <>
      <PWAUpdatePrompt
        needRefresh={needRefresh}
        updateServiceWorker={updateServiceWorker}
      />
      {offlineReady && (
        <div className="pwa-offline-ready" role="status">
          <span>✓ Ready for offline use</span>
        </div>
      )}
    </>
  );
}
