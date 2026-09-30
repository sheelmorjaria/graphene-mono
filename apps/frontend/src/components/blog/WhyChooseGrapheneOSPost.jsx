import { SectionHeading, Paragraph, Bullet, BlogPostCTA } from './postTypography';

// Big Tech app → privacy app swap table. Horizontally scrollable on phones
// rather than collapsing — the four columns only make sense side by side.
const APP_SWAPS = [
  {
    category: 'Search',
    insteadOf: 'Google Search',
    use: 'Brave Search / DuckDuckGo',
    why: 'Results without the profile-building. Your search history isn’t tied to your identity.'
  },
  {
    category: 'Browser',
    insteadOf: 'Google Chrome',
    use: 'Brave / Vanadium',
    why: 'Private by default, no Google sign-in. Vanadium is the hardened default browser on GrapheneOS.'
  },
  {
    category: 'Email',
    insteadOf: 'Gmail',
    use: 'Proton Mail',
    why: 'Encrypted, Swiss-based, and doesn’t read your post. End-to-end encryption for sensitive communications.'
  },
  {
    category: 'Messaging',
    insteadOf: 'WhatsApp / Messenger',
    use: 'Signal',
    why: 'End-to-end encrypted and owned by a non-profit. It is free, secure, and we earn nothing by recommending it — just pure privacy.'
  },
  {
    category: 'Maps',
    insteadOf: 'Google Maps',
    use: 'Organic Maps / OsmAnd',
    why: 'Offline maps that don’t log every journey. Based on OpenStreetMap data, keeping your location off commercial servers.'
  },
  {
    category: 'App Store',
    insteadOf: 'Google Play Store',
    use: 'Aurora Store / F-Droid',
    why: 'Apps without a Google account. Aurora gives access to Play Store apps anonymously; F-Droid is 100% open-source.'
  },
  {
    category: 'Photos',
    insteadOf: 'Google Photos',
    use: 'Ente',
    why: 'Encrypted photo backup that isn’t mining your library. Your memories stay private and strictly yours.'
  },
  {
    category: 'Passwords',
    insteadOf: 'Saved in Chrome',
    use: 'Proton Pass / Bitwarden',
    why: 'One encrypted vault, not your browser. Cross-platform, open-source, and zero-knowledge.'
  }
];

const WhyChooseGrapheneOSPost = () => (
  <article data-testid="blog-post-content">
    {/* Introduction */}
    <Paragraph>
      In an era where our smartphones act as pocket-sized tracking devices, taking back control of
      your digital footprint is more important than ever. Google Android and Apple iOS, while
      convenient, are built on telemetry, data harvesting, and ecosystem lock-in.
    </Paragraph>
    <Paragraph>
      If you value your digital autonomy, GrapheneOS is the gold standard for mobile privacy. But
      what makes it the premier choice for security professionals and privacy advocates alike?
    </Paragraph>
    <Paragraph>
      Here is a breakdown of why GrapheneOS is the ultimate operating system for taking back your
      data.
    </Paragraph>

    {/* 01 — Zero telemetry */}
    <SectionHeading id="zero-telemetry" index="01">Zero Telemetry: Your Data Stays Yours</SectionHeading>
    <Paragraph>
      Unlike stock Android, which constantly sends diagnostic data, location history, and usage
      statistics back to Google, GrapheneOS operates on a strict zero-telemetry policy. The
      operating system does not phone home. There are no background services profiling your app
      usage, no cloud syncing of your personal habits, and no hidden analytics running in the
      background. What happens on your phone, stays on your phone.
    </Paragraph>

    {/* 02 — Hardened security */}
    <SectionHeading id="security-hardened" index="02">Security Hardened: Beyond Standard Android</SectionHeading>
    <Paragraph>
      GrapheneOS is not just a &ldquo;de-Googled&rdquo; skin. It is an extensively hardened operating system
      built directly from the Android Open Source Project (AOSP). The development team has
      implemented advanced security features that go far beyond what standard Google Pixel firmware
      offers. This includes:
    </Paragraph>
    <ul className="mb-6 max-w-3xl">
      <Bullet>
        <span>
          <strong className="text-text-primary">Hardened memory allocator (hardened_malloc)</strong>,
          which mitigates a vast array of memory corruption vulnerabilities.
        </span>
      </Bullet>
      <Bullet>
        <span>
          <strong className="text-text-primary">Strict network and filesystem sandboxing</strong> for
          all applications.
        </span>
      </Bullet>
    </ul>
    <Paragraph>
      By choosing GrapheneOS, you aren&rsquo;t just gaining privacy; you are actively raising the security
      ceiling of your device, making it exponentially harder for malicious actors to exploit your
      phone.
    </Paragraph>

    {/* 03 — Verified boot */}
    <SectionHeading id="verified-boot" index="03">Verified Boot with a Re-Locked Bootloader</SectionHeading>
    <Paragraph>
      One of the most common misconceptions about custom operating systems is that you have to
      leave your bootloader unlocked, leaving the device vulnerable to physical tampering.
    </Paragraph>
    <Paragraph>
      GrapheneOS utilizes Verified Boot. When you flash a Pixel with GrapheneOS, you are able to
      re-lock the bootloader using GrapheneOS&rsquo;s own security keys. This means that every single time
      your phone boots, the cryptographic signature of the operating system is verified from the
      hardware up. If any part of the OS has been tampered with or modified by a third party, the
      phone will refuse to boot, ensuring your device is secure even if someone gets physical
      access to it.
    </Paragraph>

    {/* 04 — Open source & legal */}
    <SectionHeading id="open-source" index="04">Open Source and Completely Legal</SectionHeading>
    <Paragraph>
      There is a persistent myth that modifying your phone&rsquo;s operating system is legally gray or
      violates terms of service. This is false.
    </Paragraph>
    <Paragraph>
      GrapheneOS is 100% open-source and entirely legal to utilise. You own your hardware, and you
      have the legal right to run whatever open-source software you choose on it. By using
      GrapheneOS, you are exercising your digital property rights and supporting a transparent,
      community-driven privacy project.
    </Paragraph>

    {/* 05 — Familiar UX */}
    <SectionHeading id="clean-android" index="05">Operates Like Clean Android</SectionHeading>
    <Paragraph>
      Privacy-focused operating systems often suffer from clunky user interfaces or lack basic
      functionality. GrapheneOS avoids this entirely.
    </Paragraph>
    <Paragraph>
      Because it is built on AOSP, it operates identically to clean Android. If you know how to use
      a standard Android phone, you already know how to use GrapheneOS. The user interface is
      familiar, fast, and bloatware-free. It does not look like a hacker&rsquo;s terminal; it looks and
      feels like the premium smartphone experience you are used to.
    </Paragraph>

    {/* 06 — Sandboxed Play */}
    <SectionHeading id="sandboxed-google-play" index="06">Sandboxed Google Play: Compatibility Without the Surveillance</SectionHeading>
    <Paragraph>
      One of the biggest hurdles with switching to a privacy OS is losing access to essential apps.
      GrapheneOS solves this with Sandboxed Google Play.
    </Paragraph>
    <Paragraph>
      Instead of giving Google deep system-level privileges over your entire phone, GrapheneOS
      allows you to optionally run Google Play services in an isolated, standard app container.
      This means you get the app compatibility you need for mapping, push notifications, and
      utilities — without the invasive system-level surveillance. Google is trapped in its own
      sandbox, unable to snoop on the rest of your device.
    </Paragraph>

    {/* 07 — Firewall */}
    <SectionHeading id="network-firewall" index="07">Per-App Network Firewall</SectionHeading>
    <Paragraph>
      Why should a calculator app or a simple note-taking tool have access to the internet? On
      standard Android, once you grant network permissions, apps can connect to external servers in
      the background.
    </Paragraph>
    <Paragraph>
      GrapheneOS includes a built-in per-app network firewall. You can individually block any
      specific app from accessing the internet via Wi-Fi or cellular data. This gives you absolute
      control over what leaves your device, allowing you to use apps offline with confidence that
      they aren&rsquo;t secretly transmitting your data to third-party servers.
    </Paragraph>

    {/* 08 — Storage Scopes */}
    <SectionHeading id="storage-scopes" index="08">Storage Scopes: Total Control Over Your Files</SectionHeading>
    <Paragraph>
      Standard Android forces an &ldquo;all or nothing&rdquo; approach to file storage — often forcing you to
      grant an app access to your entire media library just to attach a single photo.
    </Paragraph>
    <Paragraph>
      GrapheneOS introduces Storage Scopes. With this feature, apps only see the files they
      created, preventing them from snooping on your private photos, videos, and documents. You can
      manually grant an app access to specific files or folders only when necessary. An app will
      never know what else exists on your device unless you explicitly show it.
    </Paragraph>

    {/* 09 — Banking apps */}
    <SectionHeading id="banking-apps" index="09">Banking App Compatibility (With One Exception)</SectionHeading>
    <Paragraph>
      A major concern for users switching to privacy-focused OS versions is whether their essential
      daily apps will work. Because GrapheneOS is so well-built and maintains high security
      standards, the vast majority of your daily apps will work flawlessly — including banking
      apps.
    </Paragraph>
    <Paragraph>
      Most major banking and financial applications function perfectly on GrapheneOS because the
      OS passes standard Play Integrity checks when using the Sandboxed Google Play feature.
    </Paragraph>
    <h3 className="mt-10 mb-4 font-heading text-xl font-semibold text-cyan-400 tracking-tight">
      The Exception: Contactless Payments
    </h3>
    <Paragraph>
      Because GrapheneOS strips out the hardware-level access required for Google Pay NFC
      transactions, contactless payments via Google Pay are not supported. However, the workaround
      is simple: your banking app will function normally for balance checks, transfers, and QR code
      payments. For physical contactless payments, you can simply use a physical debit/credit card
      or a smartwatch linked to your bank account.
    </Paragraph>

    {/* 10 — App stack table */}
    <SectionHeading id="privacy-app-stack" index="10">The Ultimate Privacy App Stack: Replacing Big Tech</SectionHeading>
    <Paragraph>
      Installing GrapheneOS is just the first step. The applications you run on top of the operating
      system dictate your true level of privacy. Because GrapheneOS supports Sandboxed Google Play
      (or no Google Play at all), you can seamlessly swap out data-harvesting Big Tech apps for
      secure, open-source alternatives.
    </Paragraph>
    <Paragraph>
      Here is our recommended privacy app stack to replace the most common Google and Meta
      applications:
    </Paragraph>

    <div className="mb-6 overflow-x-auto rounded-lg border border-border-subtle bg-bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-elevated">
            <th scope="col" className="px-4 py-3 font-heading font-semibold uppercase tracking-wider text-xs text-cyan-400">Category</th>
            <th scope="col" className="px-4 py-3 font-heading font-semibold uppercase tracking-wider text-xs text-cyan-400">Instead of</th>
            <th scope="col" className="px-4 py-3 font-heading font-semibold uppercase tracking-wider text-xs text-cyan-400">Use</th>
            <th scope="col" className="px-4 py-3 font-heading font-semibold uppercase tracking-wider text-xs text-cyan-400">Why</th>
          </tr>
        </thead>
        <tbody>
          {APP_SWAPS.map((row) => (
            <tr key={row.category} className="border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors duration-150">
              <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{row.category}</td>
              <td className="px-4 py-3 text-text-muted">{row.insteadOf}</td>
              <td className="px-4 py-3 font-medium text-matrix-400 whitespace-nowrap">{row.use}</td>
              <td className="px-4 py-3 text-text-secondary leading-relaxed">{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mb-10 p-5 rounded-lg border border-border-subtle bg-bg-elevated/50">
      <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
        A quick note on affiliate transparency
      </h4>
      <p className="text-sm leading-relaxed text-text-secondary">
        At Graphene Security, our mission is to protect your digital footprint. We recommend
        services like Signal and F-Droid which offer zero affiliate programs simply because they
        are the best tools for the job. Where we do provide links to paid services (like Proton or
        Bitwarden), we may earn a small commission at no extra cost to you. This helps us keep the
        lights on without compromising our integrity.
      </p>
    </div>

    {/* 11 — CTA */}
    <SectionHeading id="ready-to-switch" index="11">Ready to Make the Switch?</SectionHeading>
    <Paragraph>
      At Graphene Security, we make transitioning to a private, secure smartphone seamless.
      Whether you want to purchase a Google Pixel pre-installed with GrapheneOS, or utilise our
      secure mail-in flashing service for your current device, we handle the technical complexities
      for you.
    </Paragraph>
    <ul className="mb-10 max-w-2xl">
      <Bullet>
        <span><strong className="text-text-primary">UK-Based:</strong> 3&ndash;5 working day lead time.</span>
      </Bullet>
      <Bullet>
        <span><strong className="text-text-primary">Risk-Free:</strong> 28-day returns policy on hardware.</span>
      </Bullet>
      <Bullet>
        <span>
          <strong className="text-text-primary">Privacy-First Checkout:</strong> Pay securely with
          PayPal Guest Checkout. No mandatory account creation required.
        </span>
      </Bullet>
    </ul>

    <BlogPostCTA />
  </article>
);

export default WhyChooseGrapheneOSPost;
