// Browser ADB client for the Aegis web installer, built on Tango ADB
// (ya-webadb, MIT). This is the ONLY file that imports the @yume-chan
// packages, and it does so dynamically so the ADB code stays out of the
// main bundle until the user reaches the connect step.
//
// Exported as a class instance so tests can mock the whole client wholesale.

export const AEGIS_PACKAGE = 'com.graphenesecurity.aegis';
export const AEGIS_ADMIN_RECEIVER = `${AEGIS_PACKAGE}/.engine.AegisDeviceAdminReceiver`;
export const AEGIS_SETUP_ACTIVITY = `${AEGIS_PACKAGE}/.ui.SetupActivity`;

export class AegisAdbClient {
  constructor() {
    this.adb = null;
    this.device = null;
  }

  // Synchronous capability check (WebUSB exists at all)
  isWebUsbSupported() {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  isConnected() {
    return this.adb !== null;
  }

  /**
   * Open the browser device picker, pair (RSA prompt on the phone) and
   * connect. Resolves with { serial, deviceModel, grapheneos }.
   * Throws Error with a friendly message on every failure path.
   */
  async connect({ onLog } = {}) {
    if (this.adb) return this.describeDevice();

    const log = onLog || (() => {});
    const [{ Adb, AdbDaemonTransport }, { AdbDaemonWebUsbDeviceManager }, { default: AdbWebCredentialStore }] =
      await Promise.all([
        import('@yume-chan/adb'),
        import('@yume-chan/adb-daemon-webusb'),
        import('@yume-chan/adb-credential-web')
      ]);

    const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    if (!manager) {
      throw new Error('This browser does not support WebUSB. Use Chrome or Edge on a computer.');
    }

    log('Waiting for you to pick the phone in the browser dialog…');
    const device = await manager.requestDevice();
    if (!device) {
      throw new Error('No phone selected.');
    }

    log(`Connecting to ${device.serial}…`);
    const connection = await device.connect();

    log('Authenticating — accept the "Allow USB debugging?" prompt ON THE PHONE…');
    const credentialStore = new AdbWebCredentialStore('aegis-installer');
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore
    });
    const adb = new Adb(transport);

    this.adb = adb;
    this.device = device;

    const [deviceModel, grapheneosProp, incremental] = await Promise.all([
      this.getProperty('ro.product.device'),
      this.getProperty('ro.grapheneos.version'),
      this.getProperty('ro.build.version.incremental')
    ]);
    this.deviceModel = deviceModel;
    // GrapheneOS detection (warning-only): most builds expose
    // ro.grapheneos.version; some expose no graphene-named property at all
    // and carry the release date-stamp only in the incremental
    // (2026110200 = YYYYMMDDNN — stock Pixel incrementals are short random
    // digit strings, never this shape).
    this.grapheneosVersion = grapheneosProp ||
      (/^20\d{8}$/.test(incremental || '') ? incremental : '');

    log(`Connected: ${device.serial} (ro.product.device: ${deviceModel || 'unknown'})`);
    return this.describeDevice();
  }

  describeDevice() {
    return {
      serial: this.device?.serial,
      deviceModel: this.deviceModel,
      grapheneosVersion: this.grapheneosVersion
    };
  }

  async getProperty(key) {
    if (!this.adb) throw new Error('Not connected');
    return this.adb.getProp(key);
  }

  /**
   * Run a shell command and wait for it to finish.
   * Resolves { exitCode, stdout, stderr } (exitCode 0–255).
   */
  async runCommand(command) {
    if (!this.adb) throw new Error('Not connected');
    const shell = this.adb.subprocess.shellProtocol;
    if (!shell) {
      throw new Error('This device does not support the ADB shell protocol.');
    }
    const result = await shell.spawnWaitText(command);
    return {
      exitCode: result.exitCode,
      stdout: (result.stdout || '').trim(),
      stderr: (result.stderr || '').trim()
    };
  }

  /**
   * Download the APK from the licence link and stream it straight into
   * package install (no device-side temp file on modern Android).
   * onProgress(receivedBytes, totalBytes) fires during download.
   */
  async installApkFromUrl(url, { onProgress } = {}) {
    if (!this.adb) throw new Error('Not connected');
    const [{ PackageManager }] = await Promise.all([import('@yume-chan/android-bin')]);

    const response = await fetch(url);
    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body.error ? `: ${body.error}` : '';
      } catch { /* binary or empty body */ }
      throw new Error(`Could not download the Aegis engine (HTTP ${response.status})${detail}`);
    }

    const totalHeader = Number(response.headers.get('content-length')) || 0;
    let bodyStream = response.body;
    if (onProgress) {
      let received = 0;
      bodyStream = response.body.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            received += chunk.byteLength;
            onProgress(received, totalHeader);
            controller.enqueue(chunk);
          }
        })
      );
    }

    // installStream needs the exact size up front; buffer only when the
    // server didn't tell us.
    let size = totalHeader;
    if (!size) {
      const blob = await new Response(bodyStream).blob();
      size = blob.size;
      bodyStream = blob.stream();
      if (onProgress) onProgress(size, size);
    }

    const pm = new PackageManager(this.adb);
    await pm.installStream(size, bodyStream);
  }

  async launchSetupActivity() {
    return this.runCommand(`am start -n ${AEGIS_SETUP_ACTIVITY}`);
  }

  async disconnect() {
    if (this.adb) {
      try {
        await this.adb.close();
      } catch { /* best effort */ }
    }
    this.adb = null;
    this.device = null;
    this.deviceModel = undefined;
    this.grapheneosVersion = undefined;
  }
}

export default new AegisAdbClient();
