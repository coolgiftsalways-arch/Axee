import React, { useEffect, useState } from "react";

import { Droplets, RefreshCw, Shirt, X } from "lucide-react";

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
  },
  {
    icon: Shirt,
    title: "NO STAINS",
    text: "No stains, marks or spills on the fabric.",
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
        Try it on, take the tag off, even wear it out. If it's not for you,
        exchange it within {EXCHANGE_DAYS} days. Just two conditions:
      </p>

      <ul className="ax-exchange-sheet-rules">
        {EXCHANGE_CONDITIONS.map(({ icon: Icon, title }) => (
          <li key={title}>
            <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
            {title}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================
   HOME PAGE — highlight banner
========================================================= */

export function ExchangeHighlight() {
  return (
    <section className="ax-exchange-highlight" aria-labelledby="ax-exchange-title">
      <div className="ax-exchange-highlight-main">
        <span className="ax-exchange-highlight-kicker">
          <RefreshCw size={12} strokeWidth={1.6} aria-hidden="true" />
          NEW / EASY EXCHANGE
        </span>

        <h2 id="ax-exchange-title">
          <span className="ax-exchange-highlight-days">{EXCHANGE_DAYS}</span>
          <span>
            DAYS TO
            <br />
            CHANGE YOUR MIND.
          </span>
        </h2>

        <p>
          Wear it. Rip the tag off. Live in it. Still not feeling it? Exchange
          it within {EXCHANGE_DAYS} days of delivery — no stress.
        </p>
      </div>

      <div className="ax-exchange-highlight-rules">
        <span className="ax-exchange-highlight-rules-label">
          ONLY 2 CONDITIONS
        </span>

        {EXCHANGE_CONDITIONS.map(({ icon: Icon, title, text }, index) => (
          <div className="ax-exchange-highlight-rule" key={title}>
            <span className="ax-exchange-highlight-rule-no">
              {String(index + 1).padStart(2, "0")}
            </span>

            <Icon size={20} strokeWidth={1.3} aria-hidden="true" />

            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExchangeSheet;
