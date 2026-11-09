import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import adbClient, { AEGIS_PACKAGE, AEGIS_ADMIN_RECEIVER } from '../utils/aegisAdb';
import { parseLicenceToken, getDownloadMeta, apkUrlFor } from '../services/aegisInstallerService';
import SEOWrapper from '../components/SEO/SEOWrapper';

const STEPS = [
  { id: 'licence', title: 'Your licence', blurb: 'Paste the download link from your confirmation email' },
  { id: 'prepare', title: 'Prepare the phone', blurb: 'Enable USB debugging on a fresh GrapheneOS device' },
  { id: 'connect', title: 'Connect', blurb: 'Pair this browser with the phone over USB' },
  { id: 'install', title: 'Install engine', blurb: 'Stream the Aegis APK to the phone' },
  { id: 'provision', title: 'Grant ownership', blurb: 'Make Aegis the device owner and apply hardening' },
  { id: 'arm', title: 'Arm on the phone', blurb: 'Finish guided setup in the Aegis app' }
];

// provision.sh's sequence, verbatim — each entry is one shell command with
// a human label. `|| true` matches the script's tolerance for optional
// grants failing on some OS builds.
const PROVISION_COMMANDS = [
  {
    label: 'Grant device ownership',
    cmd: `dpm set-device-owner ${AEGIS_ADMIN_RECEIVER}`,
    critical: true
  },
  {
    label: 'Exempt from battery optimization',
    cmd: `dumpsys deviceidle whitelist +${AEGIS_PACKAGE} || true`
  },
  {
    label: 'Allow exact alarms',
    cmd: `pm grant ${AEGIS_PACKAGE} android.permission.SCHEDULE_EXACT_ALARM || true`
  },
  {
    label: 'Disable NFC',
    cmd: 'svc nfc disable || true'
  },
  {
    label: 'Disable backup manager',
    cmd: 'bmgr enable false || bmgr enabled false || true'
  }
];

const formatBytes = (n) => {
  if (!n) return '0 MB';
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const AegisInstallerPage = () => {
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState({});

  // Step 1 — licence
  const [licenceInput, setLicenceInput] = useState(searchParams.get('token') || '');
  const [licenceToken, setLicenceToken] = useState(null);
  const [licenceMeta, setLicenceMeta] = useState(null);
  const [licenceBusy, setLicenceBusy] = useState(false);
  const [licenceError, setLicenceError] = useState('');

  // Step 2 — prepare
  const [debuggingEnabled, setDebuggingEnabled] = useState(false);

  // Step 3 — connect
  const [device, setDevice] = useState(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Step 4 — install
  const [installBusy, setInstallBusy] = useState(false);
  const [installError, setInstallError] = useState('');
  const [installProgress, setInstallProgress] = useState({ received: 0, total: 0 });

  // Step 5 — provision
  const [provisionBusy, setProvisionBusy] = useState(false);
  const [provisionError, setProvisionError] = useState('');
  const [provisionResults, setProvisionResults] = useState([]);
  const [dpmFailed, setDpmFailed] = useState(false);

  // Step 6 — arm
  const [armLaunched, setArmLaunched] = useState(false);
  const [armBusy, setArmBusy] = useState(false);

  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);

  const appendLog = useCallback((line) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [...prev.slice(-199), `[${time}] ${line}`]);
  }, []);

  // Auto-scroll the log panel
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Deep-link token: validate immediately
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setLicenceInput(token);
      verifyLicence(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard against leaving mid-write
  useEffect(() => {
    if (!installBusy && !provisionBusy) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [installBusy, provisionBusy]);

  // Wake lock while installing
  const [wakeLock, setWakeLock] = useState(null);
  useEffect(() => {
    if (installBusy && navigator.wakeLock?.request) {
      navigator.wakeLock.request('screen').then(setWakeLock).catch(() => {});
    } else if (!installBusy && wakeLock) {
      wakeLock.release().catch(() => {});
      setWakeLock(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installBusy]);

  const verifyLicence = async (rawInput) => {
    const token = parseLicenceToken(rawInput);
    if (!token) {
      setLicenceError('Paste the download link or token from your confirmation email.');
      return;
    }
    setLicenceBusy(true);
    setLicenceError('');
    try {
      const meta = await getDownloadMeta(token);
      setLicenceToken(token);
      setLicenceMeta(meta);
      appendLog(`Licence verified: order ${meta.orderNumber} (Pixel ${meta.pixelModel})`);
    } catch (err) {
      setLicenceToken(null);
      setLicenceMeta(null);
      setLicenceError(err.message || 'Could not verify this licence link');
    } finally {
      setLicenceBusy(false);
    }
  };

  const next = (id) => {
    setCompleted((prev) => ({ ...prev, [STEPS[stepIndex].id]: true }));
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id) appendLog(`Step complete: ${STEPS.find((s) => s.id === id)?.title || id}`);
  };

  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const canContinue = {
    licence: Boolean(licenceToken),
    prepare: Boolean(debuggingEnabled),
    connect: Boolean(device),
    install: Boolean(completed.install),
    provision: Boolean(completed.provision)
  };

  const handleConnect = async () => {
    setConnectBusy(true);
    setConnectError('');
    try {
      const info = await adbClient.connect({ onLog: appendLog });
      setDevice(info);
      appendLog(info.grapheneosVersion
        ? `GrapheneOS ${info.grapheneosVersion} detected`
        : 'Note: GrapheneOS release property not found — continuing anyway');
    } catch (err) {
      setDevice(null);
      setConnectError(err.message || 'Could not connect to the phone');
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setConnectBusy(false);
    }
  };

  const handleInstall = async () => {
    setInstallBusy(true);
    setInstallError('');
    setInstallProgress({ received: 0, total: 0 });
    try {
      appendLog('Downloading the Aegis engine…');
      await adbClient.installApkFromUrl(apkUrlFor(licenceToken), {
        onProgress: (received, total) => setInstallProgress({ received, total })
      });
      appendLog('Install succeeded — verifying package…');
      const check = await adbClient.runCommand(`pm path ${AEGIS_PACKAGE}`);
      if (check.exitCode !== 0) {
        throw new Error('The package reports installed but pm path cannot find it — contact support.');
      }
      appendLog(`OKAY: ${check.stdout}`);
      next('install');
    } catch (err) {
      setInstallError(err.message || 'Installation failed');
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setInstallBusy(false);
    }
  };

  const handleProvision = async () => {
    setProvisionBusy(true);
    setProvisionError('');
    setProvisionResults([]);
    setDpmFailed(false);
    try {
      const results = [];
      for (const { label, cmd, critical } of PROVISION_COMMANDS) {
        appendLog(`$ ${cmd}`);
        const result = await adbClient.runCommand(cmd);
        // Idempotent retry: on an already-provisioned phone dpm refuses a
        // second set-device-owner with "already set" — that's success.
        const alreadyDone = /already\s+(set|an?\s+device\s+owner|owner)/i.test(
          `${result.stdout} ${result.stderr}`
        );
        const entry = {
          label,
          cmd,
          ok: result.exitCode === 0 || alreadyDone,
          critical: Boolean(critical),
          output: alreadyDone && result.exitCode !== 0
            ? 'Device owner already set — continuing'
            : (result.stdout || result.stderr)
        };
        results.push(entry);
        setProvisionResults([...results]);
        appendLog(`${entry.ok ? 'OKAY' : 'WARN'}${entry.output ? `: ${entry.output}` : ''}`);
        if (critical && !entry.ok) {
          setDpmFailed(true);
          appendLog('ERROR: device ownership was refused. The phone must be freshly set up with no accounts or extra users.');
          break;
        }
      }
      if (!results.some((r) => r.critical && !r.ok)) {
        next('provision');
      }
    } catch (err) {
      setProvisionError(err.message || 'Provisioning failed');
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setProvisionBusy(false);
    }
  };

  const handleLaunchSetup = async () => {
    setArmBusy(true);
    try {
      await adbClient.launchSetupActivity();
      setArmLaunched(true);
      appendLog('OKAY: SetupActivity launched on the phone');
    } catch (err) {
      appendLog(`ERROR: ${err.message}`);
    } finally {
      setArmBusy(false);
    }
  };

  const step = STEPS[stepIndex];
  const webUsbSupported = adbClient.isWebUsbSupported();
  const installFraction = installProgress.total
    ? Math.min(1, installProgress.received / installProgress.total)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title="Aegis Web Installer"
        description="Install the Aegis Hardening Suite on your GrapheneOS Pixel from this browser — no terminal needed. Chrome or Edge required."
        keywords={['Aegis installer', 'web installer', 'GrapheneOS hardening install']}
      />

      <div className="container mx-auto px-4">
        <div className="mb-8" id="installer-top">
          <Link to="/aegis" className="text-sm text-text-secondary hover:text-cyan-400">← Aegis Hardening Suite</Link>
          <h1 className="text-3xl font-display font-bold text-text-primary mt-2 mb-1">
            Aegis Web Installer
          </h1>
          <p className="text-text-secondary text-sm">
            Everything happens between this browser and your phone — your licence never
            installs on anyone else's device.
          </p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Step rail */}
          <ol className="flex lg:flex-col gap-2 overflow-x-auto" data-testid="installer-step-rail">
            {STEPS.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => setStepIndex(i)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left w-full transition-colors ${
                    i === stepIndex
                      ? 'bg-cyan-400/10 border border-cyan-400/30'
                      : i < stepIndex
                        ? 'border border-border-subtle opacity-80 hover:opacity-100'
                        : 'border border-border-subtle opacity-40'
                  }`}
                >
                  <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-heading font-bold ${
                    i < stepIndex ? 'bg-cyan-400 text-text-on-accent' : 'border border-border-subtle text-text-secondary'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </span>
                  <span className="text-sm font-heading font-semibold text-text-primary whitespace-nowrap">
                    {s.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {/* Step card */}
          <div className="bg-bg-card border border-border-subtle rounded-lg p-6 md:p-8" data-testid={`installer-step-${step.id}`}>
            <h2 className="text-xl font-display font-bold text-text-primary mb-1">{step.title}</h2>
            <p className="text-sm text-text-secondary mb-6">{step.blurb}</p>

            {/* 1 — LICENCE */}
            {step.id === 'licence' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="licence-input" className="block text-sm font-heading font-medium text-text-secondary mb-2 uppercase tracking-wider">
                    Download link or token
                  </label>
                  <textarea
                    id="licence-input"
                    rows={2}
                    value={licenceInput}
                    onChange={(e) => setLicenceInput(e.target.value)}
                    placeholder="https://api.graphene-security.com/api/aegis-orders/download/…"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-cyan-400"
                    data-testid="licence-input"
                  />
                </div>

                {licenceError && (
                  <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red" role="alert" data-testid="licence-error">
                    {licenceError}
                  </div>
                )}

                {licenceMeta && (
                  <div className="bg-bg-elevated border border-cyan-400/30 rounded-lg p-4 text-sm space-y-1" data-testid="licence-verified">
                    <div className="flex justify-between"><span className="text-text-secondary">Order</span><span className="font-mono text-text-primary">{licenceMeta.orderNumber}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Licensed device</span><span className="text-text-primary">Pixel {licenceMeta.pixelModel}</span></div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => verifyLicence(licenceInput)}
                  disabled={licenceBusy}
                  className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 hover:shadow-glow-cyan disabled:opacity-50"
                  data-testid="verify-licence-button"
                >
                  {licenceBusy ? 'Checking…' : 'Verify licence'}
                </button>
              </div>
            )}

            {/* 2 — PREPARE */}
            {step.id === 'prepare' && (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 border text-sm ${webUsbSupported ? 'bg-cyan-400/10 border-cyan-400/30' : 'bg-red-subtle border-red'}`} data-testid="webusb-support">
                  {webUsbSupported
                    ? '✓ This browser supports WebUSB.'
                    : '✗ This browser does not support WebUSB. Use Chrome or Edge on a computer (not a phone or tablet).'}
                </div>

                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 text-sm text-text-secondary">
                  <p className="font-heading font-semibold text-yellow-400 uppercase tracking-wider text-xs mb-2">Fresh device required</p>
                  Device ownership can only be granted while the phone has <strong className="text-text-primary">no accounts and no secondary users</strong> —
                  complete the GrapheneOS setup wizard without adding any account. A phone already in daily use must be factory reset first.
                </div>

                <div className="space-y-3 text-sm text-text-secondary">
                  <p className="font-heading font-semibold text-text-primary uppercase tracking-wider text-xs">Enable USB debugging</p>
                  {[
                    'Settings → About phone → tap "Build number" seven times',
                    'Settings → System → Developer options → enable "USB debugging"',
                    'Plug the phone into this computer with a USB cable',
                    'Keep the phone unlocked so you can see prompts on its screen'
                  ].map((instruction, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-xs font-heading font-bold text-cyan-400">{i + 1}</span>
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debuggingEnabled}
                    onChange={(e) => setDebuggingEnabled(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-cyan-400"
                    data-testid="debugging-checkbox"
                  />
                  USB debugging is enabled and the phone is plugged in
                </label>
              </div>
            )}

            {/* 3 — CONNECT */}
            {step.id === 'connect' && (
              <div className="space-y-4">
                {!device ? (
                  <>
                    <p className="text-sm text-text-secondary">
                      Click connect, pick your phone in the browser's device dialog, then
                      accept the <strong className="text-text-primary">"Allow USB debugging?"</strong> prompt
                      that appears on the phone itself. This is a one-time pairing for this browser.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectBusy}
                      className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 hover:shadow-glow-cyan disabled:opacity-50"
                      data-testid="connect-button"
                    >
                      {connectBusy ? 'Connecting…' : 'Connect phone via WebUSB'}
                    </button>
                  </>
                ) : (
                  <div className="bg-bg-elevated border border-cyan-400/30 rounded-lg p-4 text-sm space-y-1" data-testid="device-connected">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="font-heading font-semibold text-text-primary">Connected</span>
                    </div>
                    <div className="flex justify-between"><span className="text-text-secondary">Serial</span><span className="font-mono text-text-primary">{device.serial}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Device</span><span className="font-mono text-text-primary">{device.deviceModel || 'unknown'}</span></div>
                    {!device.grapheneosVersion && (
                      <p className="text-xs text-yellow-400 pt-2">
                        GrapheneOS release property not detected — Aegis is built for GrapheneOS; continuing is at your own risk.
                      </p>
                    )}
                  </div>
                )}

                {connectError && (
                  <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red" role="alert" data-testid="connect-error">
                    {connectError}
                  </div>
                )}
              </div>
            )}

            {/* 4 — INSTALL */}
            {step.id === 'install' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  The engine APK streams from your licence link straight into package
                  install — it is not stored on this computer.
                </p>

                {installBusy && (
                  <div data-testid="install-progress">
                    <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                      <span>{formatBytes(installProgress.received)}{installProgress.total ? ` / ${formatBytes(installProgress.total)}` : ''}</span>
                      <span>{Math.round(installFraction * 100)}%</span>
                    </div>
                    <div className="h-2 bg-bg-elevated rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(installFraction * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-matrix-400 transition-all" style={{ width: `${installFraction * 100}%` }} />
                    </div>
                  </div>
                )}

                {installBusy && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 text-sm text-yellow-400">
                    Do not unplug the phone while the engine is installing.
                  </div>
                )}

                {installError && (
                  <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red" role="alert" data-testid="install-error">
                    {installError}
                  </div>
                )}

                {!installBusy && !completed.install && (
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 hover:shadow-glow-cyan"
                    data-testid="install-button"
                  >
                    Install the Aegis engine
                  </button>
                )}
              </div>
            )}

            {/* 5 — PROVISION */}
            {step.id === 'provision' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  One command makes Aegis the device owner — the grant that powers every
                  defence — followed by the reliability and hardening grants from the
                  provisioning script.
                </p>

                {provisionResults.length > 0 && (
                  <ul className="space-y-2 text-sm" data-testid="provision-results">
                    {provisionResults.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={r.ok ? 'text-green-400' : 'text-red-400'}>{r.ok ? '✓' : '✗'}</span>
                        <div>
                          <div className="text-text-primary">{r.label}</div>
                          {r.output && <div className="font-mono text-xs text-text-muted break-all">{r.output}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {dpmFailed && (
                  <div className="bg-red-subtle border border-red rounded-lg p-4 text-sm text-red" role="alert" data-testid="dpm-failed">
                    <p className="font-heading font-semibold uppercase tracking-wider text-xs mb-2">Device ownership was refused</p>
                    Android only allows this on a phone with <strong>no accounts and no extra users</strong>.
                    Factory reset the phone, complete setup without adding any account, and run the installer again
                    from the Connect step.
                  </div>
                )}

                {provisionError && (
                  <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red" role="alert" data-testid="provision-error">
                    {provisionError}
                  </div>
                )}

                {!provisionBusy && !completed.provision && !dpmFailed && (
                  <button
                    type="button"
                    onClick={handleProvision}
                    className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 hover:shadow-glow-cyan"
                    data-testid="provision-button"
                  >
                    Grant ownership and harden
                  </button>
                )}

                {dpmFailed && (
                  <button type="button" onClick={() => { setProvisionResults([]); setDpmFailed(false); }} className="text-sm text-text-secondary hover:text-cyan-400 underline">
                    Reset and retry after factory reset
                  </button>
                )}
              </div>
            )}

            {/* 6 — ARM */}
            {step.id === 'arm' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Provisioning is complete. The guided arm sequence now runs on the phone —
                  pick it up to finish.
                </p>

                <button
                  type="button"
                  onClick={handleLaunchSetup}
                  disabled={armBusy}
                  className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 hover:shadow-glow-cyan disabled:opacity-50"
                  data-testid="launch-setup-button"
                >
                  {armBusy ? 'Opening…' : armLaunched ? 'Reopen guided setup' : 'Open guided setup on the phone'}
                </button>

                {armLaunched && (
                  <div className="bg-bg-elevated border border-cyan-400/30 rounded-lg p-4 text-sm text-text-secondary space-y-2" data-testid="arm-checklist">
                    <p className="font-heading font-semibold text-text-primary uppercase tracking-wider text-xs">On the phone</p>
                    <p>1. Follow the arm sequence: choose triggers, timers and optional hardening.</p>
                    <p>2. Press <strong className="text-text-primary">ARM AEGIS</strong>.</p>
                    <p>3. <strong className="text-yellow-400">Write down the recovery sheet</strong> — it is displayed exactly once.</p>
                    <p>4. Set a PIN for every duress profile and the private profile (System → Multiple users).</p>
                    <p className="text-xs text-text-muted pt-2 border-t border-border-subtle">
                      Once armed, USB becomes charge-only and developer options are disabled — that is the
                      suite working. Validate at least one wipe path on a sacrificial device before relying on it.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer nav */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-subtle">
              <button
                type="button"
                onClick={back}
                disabled={stepIndex === 0}
                className="text-sm text-text-secondary hover:text-cyan-400 disabled:opacity-40 disabled:pointer-events-none"
              >
                ← Back
              </button>
              {step.id !== 'install' && step.id !== 'provision' && step.id !== 'arm' && (
                <button
                  type="button"
                  onClick={() => next(step.id)}
                  disabled={!canContinue[step.id]}
                  className="bg-cyan-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2 hover:shadow-glow-cyan disabled:opacity-40 disabled:pointer-events-none"
                  data-testid="continue-button"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Log panel */}
        <div className="mt-8">
          <h3 className="text-xs font-heading font-semibold text-text-muted uppercase tracking-wider mb-2">Activity log</h3>
          <div
            ref={logRef}
            role="log"
            aria-label="Installer activity log"
            className="bg-bg-primary border border-border-subtle rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs leading-5 text-text-secondary"
            data-testid="installer-log"
          >
            {logs.length === 0 ? (
              <span className="text-text-muted">Waiting for activity…</span>
            ) : logs.map((line, i) => (
              <div key={i} className={line.includes('ERROR') ? 'text-red-400' : line.includes('OKAY') ? 'text-green-400' : undefined}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AegisInstallerPage;
