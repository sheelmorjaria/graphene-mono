import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AegisPayPalPayment from '../components/checkout/AegisPayPalPayment';
import {
  getAegisModels,
  createAegisOrder,
  AEGIS_PRICE_GBP,
  formatAegisCurrency
} from '../services/aegisService';
import {
  AEGIS_META,
  AEGIS_GROUPS,
  AEGIS_DEFENSE_COUNT,
  AEGIS_WIPE_PATHS,
  AEGIS_SCENARIOS,
  AEGIS_FAQ
} from '../data/aegisContent';
import SEOWrapper from '../components/SEO/SEOWrapper';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const GROUP_ICONS = {
  wipe: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  ),
  timer: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  adversary: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  ),
  lockdown: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  ),
  profile: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  )
};

const AegisPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // Purchase form state
  const [email, setEmail] = useState('');
  const [pixelModel, setPixelModel] = useState('');
  const [models, setModels] = useState([]);
  const [modelsError, setModelsError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let cancelled = false;
    getAegisModels()
      .then((data) => {
        if (!cancelled) setModels(data.models || []);
      })
      .catch((err) => {
        if (!cancelled) setModelsError(err.message || 'Could not load the supported model list.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link prefill: product pages link here as /aegis?model=<baseModel>
  // ("7 Pro" etc.) — preselect it once the catalog list arrives and confirms
  // it's a stocked model.
  useEffect(() => {
    const modelParam = searchParams.get('model');
    if (modelParam && models.length > 0 && models.some((m) => m.value === modelParam)) {
      setPixelModel((current) => current || modelParam);
    }
  }, [searchParams, models]);

  const validate = () => {
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (!pixelModel) return 'Select the Pixel model you are licensing.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const data = await createAegisOrder({
        customerEmail: email.trim(),
        pixelModel
      });
      setOrderData(data);
      setStep('payment');
    } catch (err) {
      setFormError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    // Capture response carries the per-order installer-kit download link
    setDownloadUrl(paymentData?.downloadUrl || '');
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title="Aegis Hardening Suite"
        description="Duress and anti-seizure hardening for GrapheneOS Pixels: multi-PIN self-wipe, remote SMS wipe, automated wipe timers, anti-tamper countermeasures and a hidden private profile. Lifetime licence, one-off £99."
        keywords={['Aegis', 'duress protection', 'GrapheneOS hardening', 'anti-seizure', 'phone wipe protection', 'privacy hardening']}
      />

      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-10" data-testid="aegis-hero">
          <div className="inline-block mb-4 px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-xs font-heading uppercase tracking-widest text-cyan-400">
            For GrapheneOS Pixels
          </div>
          <h1 className="text-4xl font-display font-bold text-text-primary mb-4">
            {AEGIS_META.name}
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-6">
            {AEGIS_META.tagline}. If your phone is taken — snatched, seized, or
            handed over under pressure — {AEGIS_DEFENSE_COUNT} standing defenses
            make sure your data doesn’t go with it.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-center" data-testid="aegis-stats">
            <div>
              <div className="text-3xl font-display font-bold text-cyan-400">{AEGIS_DEFENSE_COUNT}</div>
              <div className="text-xs font-heading uppercase tracking-wider text-text-muted">standing defenses</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-cyan-400">{AEGIS_WIPE_PATHS}</div>
              <div className="text-xs font-heading uppercase tracking-wider text-text-muted">independent wipe paths</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-cyan-400">{AEGIS_META.price}</div>
              <div className="text-xs font-heading uppercase tracking-wider text-text-muted">one-off, lifetime licence</div>
            </div>
          </div>
        </div>

        {/* Purchase flow */}
        {step === 'form' && (
          <div className="max-w-2xl mx-auto mb-16" data-testid="aegis-purchase">
            <div className="bg-bg-card border border-border-subtle rounded-lg p-6 md:p-8">
              <h2 className="text-xl font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                Buy the Aegis licence
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Lifetime licence for one device, 12 months of updates, installer
                kit and setup guide delivered by email. No account needed.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="aegis-email" className="block text-sm font-heading font-medium text-text-secondary mb-2 uppercase tracking-wider">
                      Email address
                    </label>
                    <input
                      id="aegis-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => email && !EMAIL_RE.test(email.trim()) && setFormError('Enter a valid email address.')}
                      placeholder="you@example.com"
                      className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-cyan-400"
                    />
                    <p className="mt-2 text-xs text-text-muted">
                      The installer kit and setup guide are sent here.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="aegis-device" className="block text-sm font-heading font-medium text-text-secondary mb-2 uppercase tracking-wider">
                      Pixel model to license
                    </label>
                    <select
                      id="aegis-device"
                      value={pixelModel}
                      onChange={(e) => setPixelModel(e.target.value)}
                      className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Select your Pixel model…</option>
                      {models.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {modelsError && (
                      <p className="mt-2 text-xs text-red" data-testid="aegis-models-error">
                        {modelsError}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-text-muted">
                      One licence per device — the model list matches the phones we currently stock.
                    </p>
                  </div>

                  <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-heading font-semibold text-text-primary">{AEGIS_META.name}</div>
                      <div className="text-xs text-text-muted">one-off · lifetime licence · 12 months of updates</div>
                    </div>
                    <div className="font-mono text-2xl text-cyan-400" data-testid="aegis-price">
                      {formatAegisCurrency(AEGIS_PRICE_GBP)}
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red" data-testid="aegis-form-error">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg py-3 hover:shadow-glow-cyan disabled:opacity-50 disabled:pointer-events-none transition-all"
                    data-testid="aegis-buy-button"
                  >
                    {isSubmitting ? 'Creating order…' : `Continue to payment — ${AEGIS_META.price}`}
                  </button>

                  <p className="text-center text-xs text-text-muted">
                    Payment is processed by PayPal — your card details never touch our servers.
                  </p>

                  <p className="text-center text-xs text-text-muted">
                    Already have a licence?{' '}
                    <Link to="/aegis/installer" className="text-cyan-400 hover:text-cyan-300 underline" data-testid="installer-link-from-aegis">
                      Install it in your browser — no terminal needed
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 'payment' && orderData && (
          <div className="max-w-2xl mx-auto mb-16" data-testid="aegis-payment-step">
            <div className="bg-bg-card border border-border-subtle rounded-lg p-6 md:p-8">
              <h2 className="text-xl font-heading font-semibold text-text-primary uppercase tracking-wider mb-6">
                Complete your purchase
              </h2>

              <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Order number</span>
                  <span className="font-mono text-text-primary">{orderData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Licensed device</span>
                  <span className="text-text-primary">Pixel {orderData.pixelModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Delivery email</span>
                  <span className="text-text-primary">{orderData.customerEmail}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-subtle border border-red rounded-lg p-3 text-sm text-red mb-4" data-testid="aegis-payment-step-error">
                  {error}
                </div>
              )}

              <AegisPayPalPayment
                orderId={orderData.orderId}
                amount={orderData.amountGbp}
                onSuccess={handlePaymentSuccess}
              />

              <button
                type="button"
                onClick={() => { setStep('form'); setError(''); }}
                className="mt-4 w-full text-sm text-text-secondary hover:text-cyan-400 underline"
              >
                ← Back and edit details
              </button>
            </div>
          </div>
        )}

        {step === 'success' && orderData && (
          <div className="max-w-2xl mx-auto mb-16" data-testid="aegis-success">
            <div className="bg-bg-card border border-cyan-400/30 rounded-lg p-6 md:p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
                Payment received
              </h2>
              <p className="text-text-secondary mb-6">
                Your Aegis Hardening Suite licence is confirmed. Order{' '}
                <span className="font-mono text-cyan-400">{orderData.orderNumber}</span>
              </p>

              <div className="text-left bg-bg-elevated border border-border-subtle rounded-lg p-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Licensed device</span>
                  <span className="text-text-primary">Pixel {orderData.pixelModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Delivery email</span>
                  <span className="text-text-primary">{orderData.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Paid</span>
                  <span className="font-mono text-cyan-400">{formatAegisCurrency(orderData.amountGbp)}</span>
                </div>
              </div>

              {downloadUrl && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                  <a
                    href={`/aegis/installer?token=${downloadUrl.split('/').pop()}`}
                    className="inline-block bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-8 py-3 hover:shadow-glow-cyan transition-all"
                    data-testid="aegis-web-installer-button"
                  >
                    Install in your browser
                  </a>
                  <a
                    href={downloadUrl}
                    className="inline-block border border-cyan-400 text-cyan-400 font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-8 py-3 hover:shadow-glow-cyan transition-all"
                    data-testid="aegis-download-button"
                  >
                    Download the kit (ZIP)
                  </a>
                </div>
              )}

              <div className="text-left text-sm text-text-secondary space-y-2">
                <p className="font-heading font-semibold text-text-primary uppercase tracking-wider text-xs">What happens next</p>
                {downloadUrl ? (
                  <p>Your installer kit and setup guide are downloading now — the same link is in your confirmation email at <strong className="text-text-primary">{orderData.customerEmail}</strong>, and stays active for the lifetime of your licence.</p>
                ) : (
                  <p>Your installer kit and setup guide will arrive at <strong className="text-text-primary">{orderData.customerEmail}</strong> shortly.</p>
                )}
                <p>Guided setup takes around 30 minutes: arming the suite, setting your duress PINs and choosing your optional protections. Keep the generated recovery sheet somewhere safe and offline.</p>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-16" data-testid="aegis-how-it-works">
          <h2 className="text-2xl font-heading font-semibold text-text-primary uppercase tracking-wider text-center mb-8">
            Three steps to a hardened phone
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Buy the licence', body: 'One-off payment of £99. The installer kit and setup guide are emailed to you — no account, no subscription, no activation server.' },
              { step: '2', title: 'Run guided setup', body: 'Around 30 minutes on your own Pixel: the installer arms the suite, generates your duress PINs and recovery sheet, and applies every protection.' },
              { step: '3', title: 'Carry it without fear', body: 'The suite runs silently underneath GrapheneOS. Verified boot stays intact, updates keep flowing, and every defense stands armed.' }
            ].map((s) => (
              <div key={s.step} className="bg-bg-card border border-border-subtle rounded-lg p-6">
                <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center font-display font-bold text-cyan-400 mb-4">
                  {s.step}
                </div>
                <h3 className="font-heading font-semibold text-text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature groups */}
        <div className="max-w-4xl mx-auto mb-16" data-testid="aegis-features">
          {AEGIS_GROUPS.map((group) => (
            <div key={group.id} className="mb-12 last:mb-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {GROUP_ICONS[group.icon]}
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-heading uppercase tracking-widest text-cyan-400">{group.kicker}</div>
                  <h2 className="text-2xl font-display font-bold text-text-primary">{group.title}</h2>
                  <p className="text-sm text-text-secondary mt-1 max-w-2xl">{group.subtitle}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {group.features.map((feature) => (
                  <div key={feature.id} className="bg-bg-card border border-border-subtle rounded-lg p-5">
                    <h3 className="font-heading font-semibold text-text-primary mb-1 flex items-center gap-2 flex-wrap">
                      {feature.title}
                      {feature.optional && (
                        <span className="text-[10px] font-heading uppercase tracking-wider px-2 py-0.5 bg-bg-elevated border border-border-subtle rounded text-text-muted">
                          optional
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-text-secondary">{feature.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Threat scenarios */}
        <div className="max-w-4xl mx-auto mb-16" data-testid="aegis-scenarios">
          <h2 className="text-2xl font-heading font-semibold text-text-primary uppercase tracking-wider text-center mb-2">
            What happens when it matters
          </h2>
          <p className="text-center text-text-secondary mb-8 text-sm">
            Six situations, six scripted responses. This is the suite doing its job.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {AEGIS_SCENARIOS.map((s) => (
              <div key={s.scenario} className="bg-bg-card border border-border-subtle rounded-lg p-5">
                <div className="text-xs font-heading uppercase tracking-wider text-cyan-400 mb-2">Threat</div>
                <p className="font-heading font-semibold text-text-primary mb-3">{s.scenario}</p>
                <div className="text-xs font-heading uppercase tracking-wider text-text-muted mb-2">Aegis response</div>
                <p className="text-sm text-text-secondary">{s.response}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ — crawlable, non-collapsible */}
        <div className="max-w-3xl mx-auto mb-16" data-testid="aegis-faq">
          <h2 className="text-2xl font-heading font-semibold text-text-primary uppercase tracking-wider text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {AEGIS_FAQ.map((item) => (
              <div key={item.q} className="bg-bg-card border border-border-subtle rounded-lg p-5">
                <h3 className="font-heading font-semibold text-text-primary mb-2">{item.q}</h3>
                <p className="text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-2xl mx-auto text-center" data-testid="aegis-final-cta">
          <h2 className="text-2xl font-display font-bold text-text-primary mb-3">
            Your data leaves on your terms — or not at all
          </h2>
          <p className="text-text-secondary mb-6">
            {AEGIS_DEFENSE_COUNT} defenses. {AEGIS_WIPE_PATHS} independent wipe paths. One one-off payment of {AEGIS_META.price}.
          </p>
          {step !== 'success' && (
            <button
              type="button"
              onClick={() => {
                setStep('form');
                document.getElementById('aegis-purchase')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg px-8 py-3 hover:shadow-glow-cyan transition-all"
            >
              Buy the Aegis licence — {AEGIS_META.price}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AegisPage;
