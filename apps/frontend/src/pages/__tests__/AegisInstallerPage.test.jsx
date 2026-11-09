import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AegisInstallerPage from '../AegisInstallerPage';
import adbClient from '../../utils/aegisAdb';
import * as installerService from '../../services/aegisInstallerService';

vi.mock('../../utils/aegisAdb', () => ({
  default: {
    isWebUsbSupported: vi.fn().mockReturnValue(true),
    connect: vi.fn(),
    runCommand: vi.fn(),
    installApkFromUrl: vi.fn(),
    launchSetupActivity: vi.fn(),
    disconnect: vi.fn()
  },
  AEGIS_PACKAGE: 'com.graphenesecurity.aegis',
  AEGIS_ADMIN_RECEIVER: 'com.graphenesecurity.aegis/.engine.AegisDeviceAdminReceiver'
}));

vi.mock('../../services/aegisInstallerService', async () => {
  const actual = await vi.importActual('../../services/aegisInstallerService');
  return {
    ...actual,
    getDownloadMeta: vi.fn(),
    apkUrlFor: vi.fn((token) => `/api/aegis-orders/download/${token}?file=apk`)
  };
});

const META = { orderNumber: 'AEG-123-001', pixelModel: '7 Pro', amountGbp: 99 };

const advanceThrough = async (upTo) => {
  // Step 1: licence
  fireEvent.click(screen.getByTestId('verify-licence-button'));
  await waitFor(() => expect(screen.getByTestId('licence-verified')).toBeInTheDocument());
  if (upTo === 'licence') return;
  fireEvent.click(screen.getByTestId('continue-button'));

  // Step 2: prepare
  fireEvent.click(screen.getByTestId('debugging-checkbox'));
  if (upTo === 'prepare') return;
  fireEvent.click(screen.getByTestId('continue-button'));
};

describe('AegisInstallerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adbClient.isWebUsbSupported.mockReturnValue(true);
    installerService.getDownloadMeta.mockResolvedValue(META);
  });

  it('auto-validates the licence from the ?token= deep link', async () => {
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });

    await waitFor(() => {
      expect(installerService.getDownloadMeta).toHaveBeenCalledWith('abcdefghij0123456789');
    });
    expect(await screen.findByTestId('licence-verified')).toBeInTheDocument();
    expect(screen.getByText('AEG-123-001')).toBeInTheDocument();
  });

  it('shows an error for an unparseable licence input and gates continue', async () => {
    render(<AegisInstallerPage />);

    fireEvent.change(screen.getByTestId('licence-input'), { target: { value: 'garbage' } });
    fireEvent.click(screen.getByTestId('verify-licence-button'));

    await waitFor(() => {
      expect(screen.getByTestId('licence-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('continue-button')).toBeDisabled();
  });

  it('shows the unsupported-browser card when WebUSB is unavailable', async () => {
    adbClient.isWebUsbSupported.mockReturnValue(false);
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });

    await waitFor(() => expect(screen.getByTestId('licence-verified')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('continue-button'));

    expect(screen.getByTestId('webusb-support')).toHaveTextContent(/does not support WebUSB/i);
  });

  it('connects to the phone and shows the device card', async () => {
    adbClient.connect.mockResolvedValue({ serial: 'TESTSERIAL', deviceModel: 'shiba', grapheneosVersion: '2026110500' });
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });
    await advanceThrough('prepare');
    fireEvent.click(screen.getByTestId('continue-button'));

    fireEvent.click(screen.getByTestId('connect-button'));
    expect(await screen.findByTestId('device-connected')).toBeInTheDocument();
    expect(screen.getByText('TESTSERIAL')).toBeInTheDocument();
  });

  it('surfaces a connect error without leaving the step', async () => {
    adbClient.connect.mockRejectedValue(new Error('No phone selected.'));
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });
    await advanceThrough('prepare');
    fireEvent.click(screen.getByTestId('continue-button'));

    fireEvent.click(screen.getByTestId('connect-button'));

    await waitFor(() => {
      expect(screen.getByTestId('connect-error')).toHaveTextContent('No phone selected.');
    });
  });

  it('streams the APK, verifies the package and advances to provision', async () => {
    adbClient.installApkFromUrl.mockResolvedValue();
    adbClient.runCommand.mockResolvedValue({ exitCode: 0, stdout: 'package:/base.apk', stderr: '' });
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });
    await advanceThrough('prepare');
    fireEvent.click(screen.getByTestId('continue-button')); // connect step
    adbClient.connect.mockResolvedValue({ serial: 'S', deviceModel: 'shiba', grapheneosVersion: '1' });
    fireEvent.click(screen.getByTestId('connect-button'));
    await screen.findByTestId('device-connected');
    fireEvent.click(screen.getByTestId('continue-button'));

    fireEvent.click(screen.getByTestId('install-button'));

    await waitFor(() => {
      expect(screen.getByTestId('installer-step-provision')).toBeInTheDocument();
    });
    expect(adbClient.installApkFromUrl).toHaveBeenCalledWith(
      '/api/aegis-orders/download/abcdefghij0123456789?file=apk',
      expect.objectContaining({ onProgress: expect.any(Function) })
    );
  });

  it('blocks provisioning and explains factory reset when dpm refuses ownership', async () => {
    adbClient.installApkFromUrl.mockResolvedValue();
    adbClient.runCommand.mockImplementation(async (cmd) => {
      if (cmd.startsWith('pm path')) return { exitCode: 0, stdout: 'package:/base.apk', stderr: '' };
      if (cmd.startsWith('dpm set-device-owner')) return { exitCode: 1, stdout: '', stderr: 'Not allowed' };
      return { exitCode: 0, stdout: '', stderr: '' };
    });

    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });
    await advanceThrough('prepare');
    fireEvent.click(screen.getByTestId('continue-button'));
    adbClient.connect.mockResolvedValue({ serial: 'S', deviceModel: 'shiba', grapheneosVersion: '1' });
    fireEvent.click(screen.getByTestId('connect-button'));
    await screen.findByTestId('device-connected');
    fireEvent.click(screen.getByTestId('continue-button'));
    fireEvent.click(screen.getByTestId('install-button'));
    await screen.findByTestId('installer-step-provision');

    fireEvent.click(screen.getByTestId('provision-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dpm-failed')).toHaveTextContent(/Factory reset/i);
    });
    // Stays on the provision step — no auto-advance on critical failure
    expect(screen.getByTestId('installer-step-provision')).toBeInTheDocument();
  });

  it('provisions cleanly and launches the arm sequence', async () => {
    adbClient.installApkFromUrl.mockResolvedValue();
    adbClient.runCommand.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
    adbClient.launchSetupActivity.mockResolvedValue();

    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });
    await advanceThrough('prepare');
    fireEvent.click(screen.getByTestId('continue-button'));
    adbClient.connect.mockResolvedValue({ serial: 'S', deviceModel: 'shiba', grapheneosVersion: '1' });
    fireEvent.click(screen.getByTestId('connect-button'));
    await screen.findByTestId('device-connected');
    fireEvent.click(screen.getByTestId('continue-button'));
    fireEvent.click(screen.getByTestId('install-button'));
    await screen.findByTestId('installer-step-provision');

    fireEvent.click(screen.getByTestId('provision-button'));

    await waitFor(() => {
      expect(screen.getByTestId('installer-step-arm')).toBeInTheDocument();
    });
    expect(adbClient.runCommand).toHaveBeenCalledWith(expect.stringContaining('dpm set-device-owner com.graphenesecurity.aegis'));

    fireEvent.click(screen.getByTestId('launch-setup-button'));
    await waitFor(() => {
      expect(screen.getByTestId('arm-checklist')).toBeInTheDocument();
    });
    expect(adbClient.launchSetupActivity).toHaveBeenCalled();
  });

  it('writes activity to the log panel', async () => {
    render(<AegisInstallerPage />, { initialEntries: ['/aegis/installer?token=abcdefghij0123456789'] });

    await waitFor(() => {
      expect(screen.getByTestId('installer-log')).toHaveTextContent(/Licence verified: order AEG-123-001/);
    });
  });
});
