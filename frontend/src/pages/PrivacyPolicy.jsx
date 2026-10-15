import { Link } from "react-router-dom";
import "../styles/unboundLegal.css";

// =====================================================
// UNBOUND CLOTHING — PRIVACY POLICY
// Effective Date: 15 October 2026
// =====================================================

const privacySections = [
  {
    title: "1. Information We Collect",
    bullets: [
      "Identity and contact details: name, email address, phone number, billing and delivery addresses, and account credentials if you create an account.",

      "Order and transaction details: purchased items, size/variant selections, order identifiers, prices, discounts, delivery preferences, invoice details, payment status, refunds and support history.",

      "Payment information: payments are processed through authorized third-party payment partners. We may receive transaction references and payment status. We do not intend to store full card numbers, CVVs or banking passwords on our own servers.",

      "Technical and usage information: IP address, browser/device type, approximate location derived from IP, pages visited, referral sources, shopping-cart interactions and cookie or similar identifiers, where collected.",

      "Communications and preferences: messages sent to customer support, product reviews or feedback, and marketing preferences.",
    ],
  },

  {
    title: "2. How We Use Personal Information",
    bullets: [
      "To operate our store, display products, maintain your cart or account and process orders.",

      "To verify payment status, prevent duplicate or fraudulent transactions and facilitate refunds or chargeback review.",

      "To arrange packing, shipping, delivery, tracking, exchanges, returns and customer support.",

      "To send order confirmations, invoices, shipping updates, service notices and important policy communications.",

      "To improve website performance, troubleshoot errors, measure store usage and protect our Services from misuse.",

      "To send promotional messages about products, collections or offers where permitted by law and your preferences; you can opt out of marketing communications.",

      "To comply with applicable legal obligations, tax/accounting recordkeeping, lawful requests and dispute resolution.",
    ],
  },

  {
    title: "3. Basis for Processing and Your Choices",
    paragraphs: [
      "We handle personal information for purposes connected with the products or services you request, for uses permitted under applicable Indian law, and based on consent where consent is required.",

      "Where we rely on consent, you may withdraw it through the applicable unsubscribe mechanism or by contacting us. Withdrawal does not invalidate processing already lawfully completed and may affect our ability to provide certain Services.",
    ],
  },

  {
    title: "4. Payment Processing",
    paragraphs: [
      "Checkout payments may be handled by third-party payment gateways, including Razorpay if enabled on our website.",

      "Payment details entered into the gateway are subject to that provider's own privacy and security practices. We receive only the information reasonably required to confirm, reconcile, support or refund a payment.",

      "Do not send card numbers, CVVs, PINs or OTPs to us by email, chat or social media.",
    ],
  },

  {
    title: "5. Sharing Personal Information",
    paragraphs: [
      "We do not sell your personal information.",

      "We may share relevant information with trusted service providers for hosting and technical infrastructure, payment processing, order management, shipping and courier services, analytics, communication delivery, fraud prevention and customer service.",

      "These parties should receive only information reasonably necessary for their functions and be subject to applicable confidentiality and security requirements.",

      "We may also disclose information when legally required, to defend legal rights, or as part of a legitimate business reorganization subject to applicable law.",
    ],
  },

  {
    title: "6. Cookies and Similar Technologies",
    paragraphs: [
      "Our website may use essential cookies or local storage to maintain carts, sessions, preferences and security.",

      "If enabled, analytics or advertising technologies may help us understand visits and measure campaign performance.",

      "Your browser may allow you to block or remove cookies, although some store functions may not work correctly.",

      "Where law requires consent for non-essential technologies, we will seek it through the relevant website controls.",
    ],
  },

  {
    title: "7. Data Retention",
    paragraphs: [
      "We retain personal information only for as long as reasonably needed for the purposes described in this policy, including order fulfillment, customer service, legitimate business records, accounting/tax requirements, dispute handling and applicable legal obligations.",

      "When retention is no longer necessary, we take reasonable steps to delete, anonymize or securely dispose of the information, subject to technical and legal limits.",
    ],
  },

  {
    title: "8. Security",
    paragraphs: [
      "We use reasonable administrative, technical and organizational safeguards designed to protect personal information against unauthorized access, disclosure, alteration or loss.",

      "No internet service or storage system can be guaranteed completely secure.",

      "Please keep account passwords private and notify us promptly if you suspect unauthorized account activity.",
    ],
  },

  {
    title: "9. Your Privacy Rights",
    paragraphs: [
      "Subject to applicable law, you may request access to information about your personal data, correction or updating of inaccurate details, erasure where applicable, withdrawal of consent and assistance with privacy grievances.",

      "You may also opt out of promotional communications by using an unsubscribe option where provided or contacting us.",

      "We may need to verify your identity and may retain certain information where required by law or necessary for lawful records.",
    ],
  },

  {
    title: "10. Children's Privacy",
    paragraphs: [
      "Our website is intended for general retail shopping and is not directed to children.",

      "Where the collection or processing of children's personal information requires parental or guardian consent under applicable law, we will seek such consent or restrict the relevant activity.",

      "If you believe a child has provided personal information inappropriately, please contact us.",
    ],
  },

  {
    title: "11. Third-Party Websites and International Processing",
    paragraphs: [
      "Our Services may contain links to third-party sites, social networks or payment pages. Their privacy practices are governed by their own policies.",

      "Some hosting, analytics, support or processing providers may handle information using infrastructure located outside India, subject to applicable legal requirements and restrictions.",
    ],
  },

  {
    title: "12. Updates to This Policy",
    paragraphs: [
      "We may update this Privacy Policy to reflect changes to our operations, service providers, technology or legal requirements.",

      "Updates will be published on this website with a revised effective date.",

      "Material changes may also be communicated through the Services where appropriate.",
    ],
  },

  {
    title: "13. Contact and Grievance Redressal",
    paragraphs: [
      "For privacy questions, requests or complaints, use the contact details published on https://unboundclothing.in.",
    ],
  },
];

// =====================================================
// PRIVACY POLICY PAGE
// =====================================================

export default function PrivacyPolicy() {
  return (
    <main className="ub-legal-page">
      <div className="ub-legal-container">
        {/* BREADCRUMB */}

        <div className="ub-legal-breadcrumb">
          <Link to="/">HOME</Link>
          <span>/</span>
          <span>PRIVACY POLICY</span>
        </div>

        {/* HEADER */}

        <header className="ub-legal-header">
          <span className="ub-legal-eyebrow">UNBOUND / PREMIUM STREETWEAR</span>

          <h1>
            PRIVACY
            <br />
            <span>POLICY.</span>
          </h1>

          <div className="ub-legal-meta">
            <span>WEBSITE: UNBOUNDCLOTHING.IN</span>
            <span>EFFECTIVE DATE: 15 OCTOBER 2026</span>
          </div>
        </header>

        {/* INTRODUCTION */}

        <section className="ub-legal-introduction">
          <p>
            UNBOUND Clothing ("UNBOUND", "we", "us", or "our") respects your
            privacy. This Privacy Policy describes how personal information is
            collected, used, shared, stored and protected when you visit
            unboundclothing.in, browse our clothing collections, register an
            account, place an order, make a payment, request support or
            otherwise interact with our online store (the "Services").
          </p>

          <p>
            This policy applies to personal information handled through the
            Services, including data processed by service providers acting on
            our behalf.
          </p>

          <p>
            Please read it alongside our Terms and Conditions, Shipping Policy
            and Return/Refund Policy, where available.
          </p>
        </section>

        {/* POLICY SECTIONS */}

        <div className="ub-legal-sections">
          {privacySections.map((section, index) => (
            <section
              key={index}
              className="ub-legal-section"
              id={`privacy-section-${index + 1}`}
            >
              <h2>{section.title}</h2>

              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}

              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* BOTTOM NAVIGATION */}

        <div className="ub-legal-bottom">
          <Link to="/">← BACK TO HOME</Link>

          <Link to="/terms-and-conditions">TERMS & CONDITIONS →</Link>
        </div>
      </div>
    </main>
  );
}
