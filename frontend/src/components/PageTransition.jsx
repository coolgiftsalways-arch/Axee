import React, { useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import gsap from "gsap";

import "../styles/pageTransition.css";

function PageTransition() {
  const location = useLocation();

  const overlayRef = useRef(null);

  const topRef = useRef(null);

  const middleRef = useRef(null);

  const bottomRef = useRef(null);

  const textRef = useRef(null);

  const lineRef = useRef(null);

  /*
    IMPORTANT:

    Store the URL that existed
    when this component first mounted.

    Example:

    Website opens at "/"
    previousPath = "/"

    React StrictMode runs effect again:
    "/" === "/"
    so NO transition.

    Later:
    "/" → "/shirts"
    different URL
    so transition plays.
  */

  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    const currentPath = location.pathname;

    /* ========================================
       SAME PAGE = DO NOTHING

       This prevents the transition from
       running during:
       - initial loading
       - Loader
       - StrictMode effect reruns
    ======================================== */

    if (previousPath === currentPath) {
      return;
    }

    /*
      Save new page.

      Next route change will compare
      against this.
    */

    previousPathRef.current = currentPath;

    const overlay = overlayRef.current;

    if (!overlay) {
      return;
    }

    /* ========================================
       PAGE TRANSITION
    ======================================== */

    const ctx = gsap.context(() => {
      /* RESET */

      gsap.killTweensOf([
        overlay,
        topRef.current,
        middleRef.current,
        bottomRef.current,
        textRef.current,
        lineRef.current,
      ]);

      gsap.set(overlay, {
        display: "block",

        visibility: "visible",

        pointerEvents: "all",
      });

      /* PANELS */

      gsap.set([topRef.current, middleRef.current, bottomRef.current], {
        scaleX: 0,

        transformOrigin: "right center",
      });

      /* AXIEE TEXT */

      gsap.set(textRef.current, {
        opacity: 0,

        y: 20,
      });

      /* GREEN LINE */

      gsap.set(lineRef.current, {
        scaleX: 0,

        transformOrigin: "left center",
      });

      /* ====================================
           TIMELINE
        ==================================== */

      const tl = gsap.timeline({
        defaults: {
          ease: "power4.inOut",
        },

        onComplete: () => {
          gsap.set(overlay, {
            display: "none",

            visibility: "hidden",

            pointerEvents: "none",
          });
        },
      });

      /* ====================================
           PANEL ENTER
        ==================================== */

      tl.to(
        topRef.current,
        {
          scaleX: 1,

          duration: 0.48,
        },
        0,
      );

      tl.to(
        middleRef.current,
        {
          scaleX: 1,

          duration: 0.53,
        },
        0.05,
      );

      tl.to(
        bottomRef.current,
        {
          scaleX: 1,

          duration: 0.58,
        },
        0.1,
      );

      /* ====================================
           AXIEE
        ==================================== */

      tl.to(
        textRef.current,
        {
          opacity: 1,

          y: 0,

          duration: 0.32,

          ease: "power3.out",
        },
        0.31,
      );

      /* ====================================
           LIME LINE
        ==================================== */

      tl.to(
        lineRef.current,
        {
          scaleX: 1,

          duration: 0.42,

          ease: "expo.inOut",
        },
        0.38,
      );

      /* SMALL HOLD */

      tl.to(
        {},
        {
          duration: 0.12,
        },
      );

      /* ====================================
           TEXT EXIT
        ==================================== */

      tl.to(textRef.current, {
        opacity: 0,

        y: -16,

        duration: 0.22,

        ease: "power2.in",
      });

      tl.to(
        lineRef.current,
        {
          scaleX: 0,

          duration: 0.25,

          transformOrigin: "right center",

          ease: "power3.inOut",
        },
        "<",
      );

      /* ====================================
           CHANGE PANEL EXIT DIRECTION
        ==================================== */

      tl.set([topRef.current, middleRef.current, bottomRef.current], {
        transformOrigin: "left center",
      });

      /* ====================================
           PANEL EXIT
        ==================================== */

      tl.to(topRef.current, {
        scaleX: 0,

        duration: 0.5,
      });

      tl.to(
        middleRef.current,
        {
          scaleX: 0,

          duration: 0.55,
        },
        "<0.04",
      );

      tl.to(
        bottomRef.current,
        {
          scaleX: 0,

          duration: 0.6,
        },
        "<0.04",
      );
    }, overlay);

    return () => {
      ctx.revert();
    };
  }, [location.pathname]);

  return (
    <div ref={overlayRef} className="ax-page-transition">
      {/* TOP */}

      <div
        ref={topRef}
        className="
          ax-transition-panel
          ax-transition-top
        "
      />

      {/* MIDDLE */}

      <div
        ref={middleRef}
        className="
          ax-transition-panel
          ax-transition-middle
        "
      />

      {/* BOTTOM */}

      <div
        ref={bottomRef}
        className="
          ax-transition-panel
          ax-transition-bottom
        "
      />

      {/* CENTER */}

      <div className="ax-transition-center">
        <span ref={textRef} className="ax-transition-text">
          AXIEE
        </span>

        <span ref={lineRef} className="ax-transition-line" />
      </div>
    </div>
  );
}

export default PageTransition;
