/**
 * Aegis — duress & anti-seizure hardening suite sold on top of GrapheneOS.
 *
 * Pure data module (no React imports) ported from the Aegis prototype
 * (workspace-aegis/src/lib/aegis.ts) so any component can consume it safely.
 */

export const AEGIS_META = {
  id: 'aegis',
  name: 'Aegis Hardening Suite',
  shortName: 'Aegis',
  price: '£99',
  priceNote: 'one-off',
  amountGbp: 99.00,
  currency: 'gbp',
  tagline: 'Duress-aware protection that layers on top of GrapheneOS',
  description:
    'Duress and anti-seizure hardening suite for GrapheneOS Pixels: multi-PIN self-wipe, remote SMS wipe, automated timers, anti-tamper countermeasures and a hidden private profile. Lifetime license for one device, 12 months of updates.'
};

export const AEGIS_GROUPS = [
  {
    id: 'self-wipe',
    kicker: '01',
    title: 'Self-wipe triggers',
    subtitle:
      'A wipe starts in seconds — no countdown, no warning, no way to tell it apart from a normal unlock.',
    icon: 'wipe',
    features: [
      {
        id: 'instant-wipe',
        title: 'Trigger a self wipe',
        body: 'Any duress input wipes the phone instantly and silently. There is nothing displayed, nothing logged on screen and nothing an observer can do to interrupt it once triggered.'
      },
      {
        id: 'duress-pins',
        title: 'Multiple duress PINs',
        body: 'Devices come preset with several randomised duress PINs. An adversary can never know which entry is the real one, so brute-forcing the OS lock screen has no safe outcome for them.'
      },
      {
        id: 'quick-wipe',
        title: 'Quick wipe',
        body: 'Press the power button eight times in quick succession to wipe — even with the screen locked. Works from a pocket, in a scuffle, one-handed.'
      },
      {
        id: 'remote-wipe',
        title: 'Remote wipe',
        body: 'Text the phone a secret code from any other phone — a burner, a friend’s handset, anything that can send an SMS — and it wipes on receipt.'
      }
    ]
  },
  {
    id: 'automated-wipes',
    kicker: '02',
    title: 'Automated wipes',
    subtitle: 'Timers watch the device so you don’t have to. Thresholds are set during guided setup and changeable only from the private profile.',
    icon: 'timer',
    features: [
      {
        id: 'lock-timer',
        title: 'Lock timer',
        body: 'Wipes if the phone isn’t unlocked within the time you set — two weeks, two days, two hours. If you are separated from it for longer than that, its data shouldn’t survive.'
      },
      {
        id: 'network-loss',
        title: 'Network-loss timer',
        body: 'Cut off from every network for too long — a signal-blocking bag, a dead-zone holding cell — and the device wipes. Silence is treated as a threat, not as a coincidence.'
      },
      {
        id: 'wrong-pin',
        title: 'Incorrect password wipe',
        body: 'Wipes after the number of wrong PINs you choose. A blank attempt isn’t counted, so pocket dials and accidental taps won’t burn the device.'
      }
    ]
  },
  {
    id: 'anti-adversary',
    kicker: '03',
    title: 'Anti-adversary countermeasures',
    subtitle: 'Every classic move an attacker makes — snatching, probing, pulling power, freezing — has a scripted response.',
    icon: 'adversary',
    features: [
      {
        id: 'anti-snatch',
        title: 'Anti-snatch lock',
        body: 'The instant the phone is grabbed from your hand, the screen turns off and the device locks. What they are holding becomes a locked brick.'
      },
      {
        id: 'vault-decoy',
        title: 'Decoy VAULT app',
        body: 'A fake app called VAULT sits on the everyday profile’s home screen. Anyone who opens it looking for your hidden files wipes the phone instead.'
      },
      {
        id: 'battery-removal',
        title: 'Battery-removal protection',
        body: 'Pulling the battery to stop the timers won’t work: when power returns, the removal is detected and the device wipes on boot.'
      },
      {
        id: 'temp-voltage',
        title: 'Temperature & voltage monitoring',
        body: 'Freezing attacks and voltage tampering trigger a reboot back to the fully locked state, closing the cold-boot window while the hardware is exposed.'
      },
      {
        id: 'attack-window',
        title: 'Attack window reduction',
        body: 'The Owner profile automatically reboots every six minutes — locked or unlocked — preventing ongoing exploit attempts. The hidden user profile is unaffected.'
      },
      {
        id: 'wireless-charge',
        title: 'Wireless charger detection',
        body: 'Reboots the device upon detecting a wireless charger, blocking charger-based injection attempts before they get a session to work with.',
        optional: true
      },
      {
        id: 'high-risk',
        title: 'High-risk mode',
        body: 'Have to hand the phone to someone for a short period? High-risk mode forces a bootloop with a continuous error message for a timeframe you set — then recovers by itself.'
      }
    ]
  },
  {
    id: 'lockdown',
    kicker: '04',
    title: 'Security hardening',
    subtitle: 'The port charges, nothing mounts, nothing calls out. Extraction tooling finds a device with no interfaces left to talk to.',
    icon: 'lockdown',
    features: [
      {
        id: 'safe-boot',
        title: 'Safe boot disabled',
        body: 'Prevents booting a modified state that could be used to bypass wipes — the recovery path an attacker would reach for first is closed.'
      },
      {
        id: 'dev-mode',
        title: 'Developer mode disabled',
        body: 'No developer options and no debugging surface. The most common first step of an on-device attack simply isn’t there to take.'
      },
      {
        id: 'usb-data',
        title: 'USB data disabled',
        body: 'The port only charges. Data-extraction tools connect by cable, so they find nothing to talk to when they do.'
      },
      {
        id: 'screenshots',
        title: 'Screenshots & screen recording disabled',
        body: 'Prevents any screenshots or recordings, on either profile. A session on the device can’t be captured and exfiltrated while it happens.',
        optional: true
      },
      {
        id: 'camera-mic',
        title: 'Camera & microphone disabled',
        body: 'Disables the camera and microphone so nothing can be seen or heard through the device while armed.',
        optional: true
      },
      {
        id: 'media-mount',
        title: 'Physical media mounting disabled',
        body: 'Prevents any fake-media mounting exploits — rogue drives and implants have no mount path into the system.'
      },
      {
        id: 'lte-only',
        title: '2G blocked, LTE forced',
        body: 'Prevents fake cell towers from forcing the device onto weaker 2G connections. LTE only, always, with no downgrade path.'
      },
      {
        id: 'nfc',
        title: 'NFC disabled',
        body: 'Turns off contactless communication so nothing can be read from — or pushed to — the device by tapping it.'
      },
      {
        id: 'backups',
        title: 'Backups disabled',
        body: 'No copy of your data can be kept anywhere a wipe cannot reach. What wipes, wipes everywhere.'
      },
      {
        id: 'admin-installs',
        title: 'App installs blocked on Owner profile',
        body: 'No installations or app updates on the Owner / Admin profile — no malware, no extraction tools. Your private profile is unaffected.'
      }
    ]
  },
  {
    id: 'privacy',
    kicker: '05',
    title: 'Private profile & network',
    subtitle: 'What an adversary sees is not where your life is. The everyday phone is a stage set.',
    icon: 'profile',
    features: [
      {
        id: 'private-profile',
        title: 'Private profile',
        body: 'A separate profile with your real apps and data, opened only by your secret code. It never appears in the app list, the switcher or the settings.'
      },
      {
        id: 'hidden-login',
        title: 'Hidden login',
        body: 'Unlock the private profile through the calculator or another secret method you choose — there is no visible way in.'
      },
      {
        id: 'locked-settings',
        title: 'Locked-down settings',
        body: 'The everyday profile shows no other users or apps, and its settings can’t be changed from that profile.'
      },
      {
        id: 'vpn-kill',
        title: 'VPN kill switch',
        body: 'Mullvad VPN with its kill switch enforced: nothing leaves the phone outside the VPN tunnel, ever — not DNS, not telemetry, nothing.'
      }
    ]
  }
];

export const AEGIS_DEFENSE_COUNT = AEGIS_GROUPS.reduce(
  (sum, group) => sum + group.features.length,
  0
);

/** Independent paths that can each start a wipe */
export const AEGIS_WIPE_PATHS = 9;

export const AEGIS_SCENARIOS = [
  {
    scenario: 'The phone is snatched in the street',
    response:
      'Anti-snatch lock blacks the screen the instant it’s grabbed, and a duress PIN wipes it the moment the lock screen is tried.'
  },
  {
    scenario: 'You’re forced to hand it over for a while',
    response:
      'High-risk mode bootloops the device with a continuous error message for the window you set — then recovers on its own.'
  },
  {
    scenario: 'It disappears into a signal-blocking bag',
    response:
      'The network-loss timer counts down in the dark and wipes at the threshold you configured.'
  },
  {
    scenario: 'Someone hunts around for hidden files',
    response:
      'They find VAULT sitting on the home screen. Opening it wipes the phone — the decoy is the trap.'
  },
  {
    scenario: 'The battery is pulled to stop the timers',
    response:
      'Power-loss detection catches it: the device wipes on next boot, timers or no timers.'
  },
  {
    scenario: 'A cable or charger gets plugged in',
    response:
      'The USB port is charge-only, and wireless charger detection reboots the device before anything can establish a session.'
  }
];

export const AEGIS_FAQ = [
  {
    q: 'Is this legal to use?',
    a: 'Yes. Aegis configures protections on a device you own, against theft, loss and coercion — the same category as remote wipe or Find My Device, just far more thorough. It operates only on your own property and never interferes with anyone else’s device or data. How you use the protections is your responsibility as the owner.'
  },
  {
    q: 'What exactly do I get for £99?',
    a: 'A lifetime license for one Pixel, the installer kit and setup guide delivered by email, all 28 defenses including every optional toggle, 12 months of suite updates tracked against GrapheneOS releases, priority email support, and the 14-day refund policy. No subscription, no renewal fee, no activation server phoning home.'
  },
  {
    q: 'Does Aegis survive GrapheneOS updates?',
    a: 'Generally yes — the suite is versioned against the GrapheneOS release channels and re-arms itself after an OS update. A major version jump may ask you to re-run a short re-arm step; the installer walks you through it, and updates within your first 12 months are covered by the license.'
  },
  {
    q: 'What if I forget my own PINs?',
    a: 'Guided setup generates a recovery sheet for your owner credentials — store it somewhere safe and offline. The duress PINs deliberately have no recovery path: that is the entire point of them. If a duress PIN is entered, the device wipes; that is what you asked it to do.'
  },
  {
    q: 'Can I remove or disable Aegis later?',
    a: 'Yes — from the private profile with your owner code, or by re-flashing the device entirely. What nobody can do is silently disable it from the everyday profile: there is no visible settings surface there to change, and no app list entry to uninstall.'
  },
  {
    q: 'How does remote wipe reach a phone with data off?',
    a: 'The wipe code travels as an ordinary SMS over the cellular network, so mobile data being off doesn’t matter — any phone that can send a text can trigger it. If the device is fully offline, such as inside a Faraday bag, the network-loss timer takes over and wipes after the threshold you set.'
  },
  {
    q: 'Why is checkout through PayPal?',
    a: 'So your payment details never touch our servers — PayPal processes the entire transaction and tells us only that it completed. Where your account and region allow it, PayPal also takes card and bank payments directly.'
  }
];
