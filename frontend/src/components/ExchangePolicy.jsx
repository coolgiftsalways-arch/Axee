import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowDown,
  ArrowRight,
  Check,
  Droplets,
  MessageCircle,
  Package,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Shirt,
  X,
} from "lucide-react";

import "../styles/exchangePolicy.css";

/* =========================================================
   30-DAY EXCHANGE POLICY

   Single source of truth for the exchange promise, used by:
   - <ExchangeSheet />     product page, slides up over the first image
   - <ExchangeHighlight /> home page banner
========================================================= */

export const EXCHANGE_DAYS = 30;

export const EXCHANGE_CONDITIONS = [
  {
    icon: Droplets,
    title: "NOT WASHED",
    text: "Return it unwashed, the way it arrived.",
    detail:
      "Not even once. Washing changes the fit and fabric, so we can't pass it on as new.",
  },
  {
    icon: Shirt,
    title: "NO STAINS",
    text: "No stains, marks or spills on the fabric.",
    detail:
      "No food, drink, makeup, deodorant or ink marks — keep it clean while you try it.",
  },
];

export const EXCHANGE_ALLOWED = [
  "Tag removed",
  "Tried on at home",
  "Worn out for a day",
  "Didn't love the fit, size or colour",
];

export const EXCHANGE_STEPS = [
  {
    icon: Package,
    title: "It arrives",
    text: `Your ${EXCHANGE_DAYS} days start the day your order is delivered.`,
  },
  {
    icon: Scissors,
    title: "Live in it",
    text: "Try it on, cut the tag, wear it out. Really test it.",
  },
  {
    icon: MessageCircle,
    title: "Not the one?",
    text: `Request it online within ${EXCHANGE_DAYS} days — takes a minute.`,
  },
  {
    icon: RefreshCw,
    title: "Free pickup & swap",
    text: "We collect it, check it, and send your new size or piece.",
  },
];

/* =========================================================
   PRODUCT PAGE — bottom sheet over the first image
========================================================= */

export function ExchangeSheet({ visible = true }) {
  const [dismissed, setDismissed] = useState(false);
  const [entered, setEntered] = useState(false);

  // Small delay so the sheet visibly rises from the bottom after the image loads.
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 650);

    return () => window.clearTimeout(timer);
  }, []);

  const isOpen = visible && entered && !dismissed;

  return (
    <div
      className={`ax-exchange-sheet${isOpen ? " is-open" : ""}`}
      role="region"
      aria-label={`${EXCHANGE_DAYS}-day exchange policy`}
      aria-hidden={!isOpen}
      // Keep clicks on the sheet from opening the full-screen image viewer.
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="ax-exchange-sheet-close"
        onClick={() => setDismissed(true)}
        aria-label="Close exchange information"
        tabIndex={isOpen ? 0 : -1}
      >
        <X size={14} strokeWidth={1.6} />
      </button>

      <div className="ax-exchange-sheet-head">
        <span className="ax-exchange-sheet-icon" aria-hidden="true">
          <RefreshCw size={16} strokeWidth={1.5} />
        </span>

        <div>
          <small>WEAR IT. DON'T LOVE IT? SWAP IT.</small>
          <strong>
            <em>{EXCHANGE_DAYS}-DAY</em> EASY EXCHANGE
          </strong>
        </div>
      </div>

      <p className="ax-exchange-sheet-copy">
        Not sure about it? Wear it first. If it's not for you, exchange it
        within {EXCHANGE_DAYS} days of delivery.
      </p>

      <div className="ax-exchange-sheet-grid">
        <div className="ax-exchange-sheet-row is-ok">
          <span className="ax-exchange-sheet-row-label">
            <Check size={12} strokeWidth={2.6} aria-hidden="true" />
            TOTALLY FINE
          </span>
          <span>Tag removed · Tried on · Worn out</span>
        </div>

        <div className="ax-exchange-sheet-row is-no">
          <span className="ax-exchange-sheet-row-label">
            <X size={12} strokeWidth={2.6} aria-hidden="true" />
            ONLY 2 CONDITIONS
          </span>
          <span>Must be unwashed &amp; stain-free</span>
        </div>
      </div>

      <Link to="/exchange" className="ax-exchange-sheet-link" tabIndex={isOpen ? 0 : -1}>
        Already ordered? Start an exchange
        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}

/* =========================================================
   HOME PAGE — highlight banner
========================================================= */

export function ExchangeHighlight() {
  return (
    <section
      className="ax-xc"
      id="exchange"
      aria-labelledby="ax-exchange-title"
    >
      <span className="ax-xc-glow" aria-hidden="true" />

      {/* ---------- INTRO ---------- */}

      <header className="ax-xc-intro">
        <div className="ax-xc-number" aria-hidden="true">
          <strong>{EXCHANGE_DAYS}</strong>
          <span>DAYS</span>
        </div>

        <div className="ax-xc-intro-copy">
          <span className="ax-xc-kicker">
            <RefreshCw size={12} strokeWidth={1.8} aria-hidden="true" />
            THE UNBOUND EXCHANGE PROMISE
          </span>

          <h2 id="ax-exchange-title">
            Wear it first.
            <br />
            <em>Decide later.</em>
          </h2>

          <p>
            Most stores won't take a piece back once the tag is off. We will.
            Take it home, cut the tag, wear it out — and if it's not the one,
            exchange it within <b>{EXCHANGE_DAYS} days of delivery</b>.
          </p>
        </div>
      </header>

      {/* ---------- HOW IT WORKS ---------- */}

      <div className="ax-xc-block-label">
        <span>HOW IT WORKS</span>
        <i aria-hidden="true" />
      </div>

      <ol className="ax-xc-steps">
        {EXCHANGE_STEPS.map(({ icon: Icon, title, text }, index) => (
          <li className="ax-xc-step" key={title}>
            <div className="ax-xc-step-top">
              <span className="ax-xc-step-no">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="ax-xc-step-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.4} />
              </span>
            </div>
            <strong>{title}</strong>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      {/* ---------- WHAT'S OK vs. THE 2 CONDITIONS ---------- */}

      <div className="ax-xc-compare">
        <div className="ax-xc-card is-ok">
          <div className="ax-xc-card-head">
            <span className="ax-xc-card-badge" aria-hidden="true">
              <Check size={14} strokeWidth={2.4} />
            </span>
            <div>
              <small>STILL EXCHANGEABLE</small>
              <strong>Totally fine</strong>
            </div>
          </div>

          <ul>
            {EXCHANGE_ALLOWED.map((item) => (
              <li key={item}>
                <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="ax-xc-card is-no">
          <div className="ax-xc-card-head">
            <span className="ax-xc-card-badge" aria-hidden="true">
              <X size={14} strokeWidth={2.4} />
            </span>
            <div>
              <small>ONLY 2 CONDITIONS</small>
              <strong>Not exchangeable if</strong>
            </div>
          </div>

          <ul className="ax-xc-rules">
            {EXCHANGE_CONDITIONS.map(({ icon: Icon, title, detail }) => (
              <li key={title}>
                <span className="ax-xc-rule-icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={1.5} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- FOOTER ---------- */}

      <footer className="ax-xc-foot">
        <p>
          <ShieldCheck size={15} strokeWidth={1.5} aria-hidden="true" />
          Keep it unwashed and stain-free, and it's yours to swap — no
          questions about the tag.
        </p>

        <div className="ax-xc-foot-actions">
          <Link to="/exchange" className="ax-xc-cta is-ghost">
            START AN EXCHANGE
            <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>

          <Link to="/shop" className="ax-xc-cta">
            SHOP RISK-FREE
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </section>
  );
}

/* =========================================================
   HOME HERO — floating popup, so visitors see the offer
   without scrolling. Appears after the hero intro finishes,
   hides once they scroll past the hero, and stays closed for
   the rest of the visit once dismissed.
========================================================= */

const TOAST_DISMISS_KEY = "ax-exchange-toast-dismissed";

const readDismissed = () => {
  try {
    return window.sessionStorage.getItem(TOAST_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

export function ExchangeToast({ ready = true, delay = 900 }) {
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!ready || dismissed) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShown(true), delay);

    return () => window.clearTimeout(timer);
  }, [ready, dismissed, delay]);

  useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 0.55);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);

    try {
      window.sessionStorage.setItem(TOAST_DISMISS_KEY, "1");
    } catch {
      /* storage blocked — just close for this page view */
    }
  };

  const showDetails = () => {
    document
      .getElementById("exchange")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    dismiss();
  };

  const isOpen = shown && !dismissed && !pastHero;

  return (
    <aside
      className={`ax-exchange-toast${isOpen ? " is-open" : ""}`}
      aria-label={`${EXCHANGE_DAYS}-day exchange offer`}
      aria-hidden={!isOpen}
    >
      <span className="ax-exchange-toast-shine" aria-hidden="true" />

      <div className="ax-exchange-toast-badge" aria-hidden="true">
        <strong>{EXCHANGE_DAYS}</strong>
        <small>DAYS</small>
      </div>

      <div className="ax-exchange-toast-copy">
        <span className="ax-exchange-toast-kicker">
          <RefreshCw size={10} strokeWidth={2} aria-hidden="true" />
          NEW · EASY EXCHANGE
        </span>

        <strong>Wear it. Tag off. Still swap it.</strong>

        <span className="ax-exchange-toast-sub">
          Exchange within {EXCHANGE_DAYS} days — just keep it unwashed &amp;
          stain-free.
        </span>
      </div>

      <div className="ax-exchange-toast-actions">
        <button
          type="button"
          className="ax-exchange-toast-cta"
          onClick={showDetails}
          tabIndex={isOpen ? 0 : -1}
        >
          SEE HOW
          <ArrowDown size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <Link
          to="/exchange"
          className="ax-exchange-toast-link"
          tabIndex={isOpen ? 0 : -1}
          onClick={dismiss}
        >
          EXCHANGE AN ORDER
        </Link>
      </div>

      <button
        type="button"
        className="ax-exchange-toast-close"
        onClick={dismiss}
        aria-label="Close exchange offer"
        tabIndex={isOpen ? 0 : -1}
      >
        <X size={14} strokeWidth={1.6} />
      </button>
    </aside>
  );
}

export default ExchangeSheet;
