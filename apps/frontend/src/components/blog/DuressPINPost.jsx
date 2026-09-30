import {
  SectionHeading,
  Paragraph,
  Bullet,
  NumberedSteps,
  NumberedStep,
  WarningCallout,
  BlogPostCTA
} from './postTypography';

const DuressPINPost = () => (
  <article data-testid="blog-post-content">
    {/* Introduction */}
    <Paragraph>
      When we think about smartphone security, we usually think about protecting our devices from
      remote hackers, malware, or data brokers. But what happens if the threat is physical?
    </Paragraph>
    <Paragraph>
      If you are ever confronted, coerced, or forced by an adversary to unlock your phone, standard
      encryption won&rsquo;t save you. This is known in the security community as a
      &ldquo;rubber-hose cryptanalysis&rdquo; attack — where physical force or intimidation is used
      to extract your credentials.
    </Paragraph>
    <Paragraph>
      To protect against this exact scenario, GrapheneOS includes a powerful, last-resort feature:
      the Duress PIN. Here is everything you need to know about duress codes and how to configure
      them on your GrapheneOS device.
    </Paragraph>

    {/* 01 — What is a Duress PIN */}
    <SectionHeading id="what-is-a-duress-pin" index="01">What is a Duress PIN?</SectionHeading>
    <Paragraph>
      A Duress PIN (or Duress Password) is a secondary, secret code you set up alongside your
      primary unlock PIN.
    </Paragraph>
    <ul className="mb-6 max-w-3xl">
      <Bullet>
        <span>
          <strong className="text-text-primary">Your Primary PIN:</strong> Unlocks the device and
          decrypts your data so you can use it normally.
        </span>
      </Bullet>
      <Bullet>
        <span>
          <strong className="text-text-primary">Your Duress PIN:</strong> Appears to function just
          like a normal lock screen. However, the moment this PIN is entered, GrapheneOS instantly
          begins securely wiping the device.
        </span>
      </Bullet>
    </ul>
    <Paragraph>
      When the duress PIN is triggered, the operating system immediately wipes the keys required to
      decrypt your data. The Titan M2 security chip purges its internal state, permanently
      destroying access to the encrypted storage. The phone will automatically reboot into a fresh
      setup screen, appearing as if it has been factory reset. Your data is gone forever — and
      there is no &ldquo;undo&rdquo; button.
    </Paragraph>

    {/* 02 — Why You Need a Duress Code */}
    <SectionHeading id="why-you-need-a-duress-code" index="02">Why You Need a Duress Code</SectionHeading>
    <Paragraph>
      You don&rsquo;t need to be a secret agent to justify having a duress code. Everyday privacy
      advocates, journalists, executives, and travelers utilize this feature for peace of mind.
      Common scenarios where a duress PIN is invaluable include:
    </Paragraph>
    <ul className="mb-6 max-w-3xl">
      <Bullet>
        <span>
          <strong className="text-text-primary">Border Searches:</strong> If you are crossing
          international borders and customs agents demand you unlock your phone, you can enter the
          duress PIN. The phone wipes, and you can honestly state the device has been reset.
        </span>
      </Bullet>
      <Bullet>
        <span>
          <strong className="text-text-primary">Physical Robbery:</strong> If someone steals your
          phone and demands your PIN to access your banking apps or crypto wallets, handing over
          the duress PIN destroys the data before they can access it.
        </span>
      </Bullet>
      <Bullet>
        <span>
          <strong className="text-text-primary">Coercion:</strong> If you are physically threatened
          to unlock your device, the duress PIN allows you to comply with the demand while ensuring
          your private data is instantly destroyed.
        </span>
      </Bullet>
    </ul>

    {/* 03 — How to Set Up */}
    <SectionHeading id="how-to-set-up-duress-pin" index="03">How to Set Up a Duress PIN on GrapheneOS</SectionHeading>
    <Paragraph>
      GrapheneOS makes setting up a duress code incredibly simple. Follow these steps to configure
      your failsafe:
    </Paragraph>
    <NumberedSteps>
      <NumberedStep>Open the <strong className="text-text-primary">Settings</strong> app on your GrapheneOS device.</NumberedStep>
      <NumberedStep>Scroll down and tap on <strong className="text-text-primary">Security</strong>.</NumberedStep>
      <NumberedStep>Select <strong className="text-text-primary">Duress PIN</strong> (or Duress Password, depending on your screen lock method).</NumberedStep>
      <NumberedStep>
        You will be prompted to enter your current primary PIN/Password to authenticate the change.
      </NumberedStep>
      <NumberedStep>
        Enter your desired Duress PIN. Ensure it is a sequence you can easily remember under
        stress, but entirely different from your primary PIN.
      </NumberedStep>
      <NumberedStep>Confirm the Duress PIN by entering it again.</NumberedStep>
      <NumberedStep>
        (Optional but recommended): In the Security settings, you can also set a Duress Password
        if you use an alphanumeric password to unlock your phone.
      </NumberedStep>
    </NumberedSteps>
    <Paragraph>
      Once configured, your duress PIN is live and ready to be used immediately.
    </Paragraph>

    {/* 04 — Safety warnings */}
    <SectionHeading id="crucial-safety-warnings" index="04">Crucial Safety Warnings</SectionHeading>
    <Paragraph>
      Before you set a Duress PIN, you must understand the gravity of this feature:
    </Paragraph>
    <WarningCallout title="Read before configuring">
      <li className="flex items-start gap-2">
        <span className="text-yellow-400 mt-0.5">•</span>
        <span>
          <strong className="text-text-primary">Irreversible Wipe:</strong> The moment the duress
          PIN is entered, the wipe is permanent. Not even the GrapheneOS developers can recover
          your data.
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-yellow-400 mt-0.5">•</span>
        <span>
          <strong className="text-text-primary">Muscle Memory is Dangerous:</strong> If you are
          stressed or distracted, you might accidentally type your Duress PIN out of habit instead
          of your Primary PIN. Ensure the numbers are sufficiently different so you don&rsquo;t
          confuse them.
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-yellow-400 mt-0.5">•</span>
        <span>
          <strong className="text-text-primary">Cloud Backups:</strong> GrapheneOS does not include
          Google Drive cloud backups. If your phone wipes via duress, local photos, files, and app
          data will be lost unless you have manually backed them up to an encrypted cloud service
          (like Ente) or a local computer.
        </span>
      </li>
    </WarningCallout>

    {/* 05 — Conclusion + CTA */}
    <SectionHeading id="conclusion" index="05">Conclusion: The Ultimate Peace of Mind</SectionHeading>
    <Paragraph>
      Setting up a Duress PIN transforms your smartphone from a simple communication tool into a
      tamper-proof vault. If the integrity of the vault is ever threatened, the vault destroys its
      own contents rather than yielding them to an attacker.
    </Paragraph>
    <Paragraph>
      Don&rsquo;t wait until you are in a high-risk situation to secure your digital life. At
      Graphene Security, we sell Google Pixel smartphones professionally pre-installed with
      GrapheneOS, giving you immediate access to advanced security features like Duress PIN,
      Sandboxed Google Play, and Verified Boot.
    </Paragraph>
    <ul className="mb-10 max-w-2xl">
      <Bullet>
        <span><strong className="text-text-primary">UK-Based:</strong> 3&ndash;5 working day lead time via our JIT inventory model.</span>
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

    <BlogPostCTA
      primaryLabel="Shop Pre-Installed GrapheneOS Phones"
      secondaryLabel="Learn About Our Mail-in Flash Service"
    />
  </article>
);

export default DuressPINPost;
