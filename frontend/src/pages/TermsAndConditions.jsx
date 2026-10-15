import { Link } from "react-router-dom";
import "../styles/unboundLegal.css";

// =====================================================
// UNBOUND CLOTHING — TERMS & CONDITIONS
// Effective Date: 15 October 2026
// =====================================================

const termsSections = [
  {
    title: "1. Store Information and Eligibility",
    paragraphs: [
      "UNBOUND operates an online retail store offering clothing, including streetwear apparel and related products.",

      "You must be legally competent to enter into a binding contract under applicable law to purchase products, or use the Website under the supervision of a parent or legal guardian.",

      "You agree to provide accurate, current contact, delivery, and billing information.",
    ],
  },

  {
    title: "2. Products, Sizes and Availability",
    paragraphs: [
      "We aim to display product photographs, descriptions, sizes, colours, materials, and availability accurately.",

      "Actual colours may vary due to screen settings, lighting, or manufacturing differences.",

      "Please review size charts and item details before buying.",

      "All products are subject to availability.",

      "We may restrict quantities or discontinue items, and will contact you if an ordered product cannot be fulfilled.",
    ],
  },

  {
    title: "3. Pricing, Taxes and Promotions",
    paragraphs: [
      "Prices are displayed in Indian rupees (INR) unless otherwise stated.",

      "Applicable taxes, discounts and any delivery fees will be shown or calculated during checkout.",

      "The final amount payable is the amount shown for your order at checkout.",

      "We may change prices or promotions prospectively without notice, but changes will not ordinarily affect orders we have already accepted.",

      "Promotional codes may have eligibility, expiry, usage and product restrictions; they cannot be exchanged for cash unless expressly stated.",
    ],
  },

  {
    title: "4. Orders and Acceptance",
    paragraphs: [
      "Placing an order is an offer to purchase.",

      "An automatic order confirmation or payment receipt acknowledges that we received your request; it does not necessarily mean the order has been accepted for fulfilment.",

      "Acceptance is subject to availability, payment verification, delivery serviceability, fraud checks, and our ability to process the order.",

      "If we cancel a paid order, we will initiate an appropriate refund to the original payment method or another agreed method, subject to payment-provider processing times.",
    ],
  },

  {
    title: "5. Payments and Transaction Security",
    paragraphs: [
      "Payment methods available to you are those displayed at checkout and may include UPI, cards, net banking or other options via approved payment gateways, including Razorpay if active on the Website.",

      "Payments are subject to the gateway or bank's authorization and terms.",

      "Do not disclose your OTP, UPI PIN, CVV or banking password to anyone.",

      "If a payment is debited but your order is not confirmed, contact us with the transaction reference so that we can investigate; payment reversals or refunds depend on the gateway and bank processing cycles.",
    ],
  },

  {
    title: "6. Shipping, Delivery and Risk",
    paragraphs: [
      "We ship to serviceable addresses shown or accepted at checkout.",

      "Any dispatch or delivery dates displayed are estimates and may be affected by courier networks, holidays, weather, address issues and other events outside our reasonable control.",

      "Customers are responsible for providing a complete and accurate delivery address, reachable phone number and accepting delivery where required.",

      "Shipping charges, serviceable locations and delivery timelines are governed by the Shipping Policy or checkout information published on the Website.",

      "Ownership and risk are governed by applicable law and the circumstances of delivery; nothing here limits non-excludable consumer rights.",
    ],
  },

  {
    title: "7. Cancellations, Returns, Exchanges and Refunds",
    paragraphs: [
      "Requests for cancellation, return, exchange or refund are governed by the applicable Return/Refund and Cancellation policies displayed on the Website and your statutory consumer rights.",

      "Eligibility may vary by item, condition, hygiene considerations and the stage of order processing.",

      "Please do not assume every item is returnable or that a fixed return window applies unless our published policy expressly states so.",

      "If you receive the wrong item or an item that is damaged or defective, contact customer support promptly with your order number, a description and, where available, photographs.",

      "We will review the issue and provide a resolution required by law and our applicable published policy.",

      "Approved refunds are initiated through the original payment channel where practical; bank or gateway settlement time can vary.",
    ],
  },

  {
    title: "8. Account and Customer Responsibilities",
    paragraphs: [
      "If account registration is offered, you are responsible for keeping your login details confidential and for activity conducted through your account, subject to applicable law.",

      "You agree not to submit false orders, interfere with our services, misuse promotions, attempt unauthorized access, scrape the Website in a harmful way, or use the Website for unlawful purposes.",

      "Contact us if you suspect account misuse.",
    ],
  },

  {
    title: "9. Intellectual Property",
    paragraphs: [
      "The Website's original branding, logo, text, visual design, graphics, product images and other content are owned by UNBOUND or used with permission, as applicable.",

      "They may not be copied, republished or commercially exploited without the relevant owner's consent, except as permitted by law.",

      "Third-party marks remain the property of their respective owners.",
    ],
  },

  {
    title: "10. Customer Reviews and Submitted Content",
    paragraphs: [
      "If you submit a review, comment, image or feedback, you confirm you have the rights to share it and that it is not unlawful, defamatory, deceptive or infringing.",

      "You grant us a non-exclusive, royalty-free permission to display, reproduce and use that content in connection with the Website and our products, subject to applicable privacy law.",

      "We may moderate or remove submissions that violate these terms.",
    ],
  },

  {
    title: "11. Website Accuracy and Availability",
    paragraphs: [
      "We work to keep the Website secure and available, but do not guarantee uninterrupted operation, error-free content or compatibility with every device.",

      "We may suspend access temporarily for maintenance, technical fixes or security needs.",

      "Links to third-party websites are provided for convenience and may be governed by separate terms and policies.",
    ],
  },

  {
    title: "12. Liability and Consumer Rights",
    paragraphs: [
      "To the extent permitted by applicable law, UNBOUND is not responsible for indirect or consequential losses arising from Website downtime, third-party service outages, or misuse of the Website.",

      "Nothing in these terms excludes or restricts liability that cannot lawfully be excluded, including remedies and rights available under the Consumer Protection Act, 2019 and other applicable Indian laws.",

      "Any limitation is subject to mandatory consumer protections.",
    ],
  },

  {
    title: "13. Privacy and Personal Information",
    paragraphs: [
      "We handle customer data in accordance with our Privacy Policy, available on the Website.",

      "This may include information needed to process orders, payments, deliveries, customer support and permitted communications.",

      "Please read the Privacy Policy for details about collection, sharing, retention and your rights.",
    ],
  },

  {
    title: "14. Force Majeure",
    paragraphs: [
      "We are not responsible for delays caused by events beyond our reasonable control, such as natural disasters, widespread logistics interruptions, telecommunications failures, government restrictions, or similar circumstances.",

      "We will take reasonable steps to update affected customers and address orders fairly in line with applicable law.",
    ],
  },

  {
    title: "15. Changes to These Terms",
    paragraphs: [
      "We may update these Terms & Conditions from time to time to reflect changes in our business, services or legal requirements.",

      "The latest version published on the Website will indicate its effective date.",

      "Material changes will not retroactively remove rights that have already accrued under applicable law.",
    ],
  },

  {
    title: "16. Governing Law and Dispute Resolution",
    paragraphs: [
      "These terms are governed by the laws of India.",

      "We encourage customers to contact us first so we can attempt to resolve concerns.",

      "Nothing in these terms prevents customers from approaching a competent consumer commission or other authority with jurisdiction under applicable law.",

      "Any contractual jurisdiction arrangement is subject to mandatory legal rights.",
    ],
  },

  {
    title: "17. Contact and Grievances",
    paragraphs: [
      "For order assistance, returns, payment concerns, complaints or questions about these terms, please use the verified contact information published on the Website.",
    ],
  },
];

// =====================================================
// TERMS & CONDITIONS PAGE
// =====================================================

export default function TermsAndConditions() {
  return (
    <main className="ub-legal-page">
      <div className="ub-legal-container">
        {/* BREADCRUMB */}

        <div className="ub-legal-breadcrumb">
          <Link to="/">HOME</Link>
          <span>/</span>
          <span>TERMS & CONDITIONS</span>
        </div>

        {/* HEADER */}

        <header className="ub-legal-header">
          <span className="ub-legal-eyebrow">UNBOUND / PREMIUM STREETWEAR</span>

          <h1>
            TERMS &
            <br />
            <span>CONDITIONS.</span>
          </h1>

          <div className="ub-legal-meta">
            <span>WEBSITE: UNBOUNDCLOTHING.IN</span>
            <span>EFFECTIVE DATE: 15 OCTOBER 2026</span>
          </div>
        </header>

        {/* INTRODUCTION */}

        <section className="ub-legal-introduction">
          <p>
            Welcome to UNBOUND Clothing ("UNBOUND", "we", "our", or "us"). These
            Terms & Conditions govern your access to and use of
            unboundclothing.in (the "Website") and purchases from our online
            clothing store.
          </p>

          <p>
            By using the Website or placing an order, you agree to these terms.
            Please read them before ordering.
          </p>
        </section>

        {/* ALL TERMS */}

        <div className="ub-legal-sections">
          {termsSections.map((section, index) => (
            <section
              key={index}
              className="ub-legal-section"
              id={`terms-section-${index + 1}`}
            >
              <h2>{section.title}</h2>

              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        {/* BOTTOM NAVIGATION */}

        <div className="ub-legal-bottom">
          <Link to="/">← BACK TO HOME</Link>

          <Link to="/privacy-policy">PRIVACY POLICY →</Link>
        </div>
      </div>
    </main>
  );
}
