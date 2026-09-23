import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../styles/loader.css";

function Loader({ onComplete }) {
  const loaderRef = useRef(null);
  const lettersRef = useRef([]);
  const lineRef = useRef(null);
  const percentageRef = useRef(null);
  const bottomRef = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  const [percentage, setPercentage] = useState(0);

  const letters = ["U", "N", "B", "O", "U", "N", "D"];

  // Middle O
  const centerIndex = 3;

  useEffect(() => {
    const counter = { value: 0 };

    let centerMoveX = 0;
    let centerMoveY = 0;

    const tl = gsap.timeline();

    // ==============================
    // INITIAL STATE
    // ==============================

    gsap.set(lettersRef.current, {
      y: 150,
      opacity: 0,
      rotateX: 90,
      filter: "blur(8px)",
    });

    gsap.set(lineRef.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    gsap.set([leftPanelRef.current, rightPanelRef.current], {
      xPercent: 0,
    });

    // ==============================
    // 1. UNBOUND ENTER
    // ==============================

    tl.to(lettersRef.current, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 0.85,
      stagger: 0.1,
      ease: "power4.out",
    });

    // Small impact
    tl.fromTo(
      lettersRef.current,
      {
        scale: 1.08,
      },
      {
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.03,
      },
      "-=0.45",
    );

    // ==============================
    // 2. LOADING BAR
    // ==============================

    tl.to(
      lineRef.current,
      {
        scaleX: 1,
        duration: 2.8,
        ease: "power2.inOut",
      },
      "-=0.2",
    );

    // ==============================
    // 3. 000 → 100
    // ==============================

    tl.to(
      counter,
      {
        value: 100,
        duration: 2.8,
        ease: "power2.inOut",

        onUpdate: () => {
          setPercentage(Math.round(counter.value));
        },
      },
      "<",
    );

    // ==============================
    // 4. 100% PUNCH
    // ==============================

    tl.to(percentageRef.current, {
      scale: 1.15,
      duration: 0.15,
      ease: "power2.out",
    });

    tl.to(percentageRef.current, {
      scale: 1,
      duration: 0.15,
      ease: "power2.in",
    });

    tl.to({}, { duration: 0.15 });

    // ==============================
    // 5. HIDE ALL LETTERS EXCEPT O
    // ==============================

    const lettersToHide = lettersRef.current.filter(
      (_, index) => index !== centerIndex,
    );

    tl.to(lettersToHide, {
      opacity: 0,
      y: -35,
      scale: 0.75,
      filter: "blur(15px)",
      duration: 0.55,
      stagger: {
        each: 0.035,
        from: "edges",
      },
      ease: "power3.inOut",
    });

    // ==============================
    // HIDE LOADING BOTTOM
    // ==============================

    tl.to(
      bottomRef.current,
      {
        opacity: 0,
        y: 30,
        duration: 0.45,
        ease: "power3.inOut",
      },
      "<",
    );

    // ==============================
    // 6. FIND CENTER O POSITION
    // ==============================

    tl.add(() => {
      const centerLetter = lettersRef.current[centerIndex];

      if (!centerLetter) return;

      const rect = centerLetter.getBoundingClientRect();

      const currentX = rect.left + rect.width / 2;
      const currentY = rect.top + rect.height / 2;

      const screenX = window.innerWidth / 2;
      const screenY = window.innerHeight / 2;

      centerMoveX = screenX - currentX;
      centerMoveY = screenY - currentY;
    });

    // ==============================
    // 7. MOVE O EXACTLY CENTER
    // ==============================

    tl.to(lettersRef.current[centerIndex], {
      x: () => centerMoveX,
      y: () => centerMoveY,
      duration: 0.75,
      ease: "power4.inOut",
    });

    tl.to({}, { duration: 0.15 });

    // ==============================
    // 8. O BECOMES LIME
    // ==============================

    tl.to(lettersRef.current[centerIndex], {
      color: "#c7ff13",

      textShadow:
        "0 0 15px rgba(199,255,19,.9), 0 0 45px rgba(199,255,19,.65), 0 0 90px rgba(199,255,19,.35)",

      duration: 0.3,
      ease: "power2.out",
    });

    // ==============================
    // 9. O COMPRESSES INTO DOOR
    // ==============================

    tl.to(lettersRef.current[centerIndex], {
      scaleX: 0.1,
      scaleY: 1.7,
      duration: 0.5,
      ease: "power4.inOut",
    });

    // Extra glow
    tl.to(lettersRef.current[centerIndex], {
      scaleY: 2.4,

      textShadow:
        "0 0 25px rgba(199,255,19,1), 0 0 80px rgba(199,255,19,.8), 0 0 150px rgba(199,255,19,.5)",

      duration: 0.3,
      ease: "power3.out",
    });

    // ==============================
    // 10. REMOVE CENTER LETTER
    // ==============================

    tl.to(lettersRef.current[centerIndex], {
      opacity: 0,
      scaleX: 0.03,
      duration: 0.18,
      ease: "power2.in",
    });

    // Loader background becomes transparent
    tl.set(loaderRef.current, {
      backgroundColor: "transparent",
    });

    // ==============================
    // 11. NETFLIX STYLE OPEN
    // ==============================

    tl.to(leftPanelRef.current, {
      xPercent: -100,
      duration: 1.4,
      ease: "power4.inOut",
    });

    tl.to(
      rightPanelRef.current,
      {
        xPercent: 100,
        duration: 1.4,
        ease: "power4.inOut",
      },
      "<",
    );

    // ==============================
    // 12. REMOVE LOADER
    // ==============================

    tl.set(loaderRef.current, {
      pointerEvents: "none",
      visibility: "hidden",
    });

    tl.call(() => {
      if (onComplete) {
        onComplete();
      }
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={loaderRef} className="axiee-loader">
      {/* BLACK OPENING PANELS */}

      <div ref={leftPanelRef} className="loader-door-panel loader-door-left" />

      <div
        ref={rightPanelRef}
        className="loader-door-panel loader-door-right"
      />

      <div className="loader-inner">
        {/* UNBOUND */}

        <div className="loader-logo">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              ref={(element) => {
                lettersRef.current[index] = element;
              }}
              className={
                index === centerIndex
                  ? "loader-letter loader-letter-center"
                  : "loader-letter"
              }
            >
              {letter}
            </span>
          ))}
        </div>

        {/* BOTTOM LOADER */}

        <div ref={bottomRef} className="loader-bottom">
          <div className="loader-progress">
            <span ref={lineRef}></span>
          </div>

          <div className="loader-information">
            <p>LOADING THE UNBOUND EXPERIENCE</p>

            <div ref={percentageRef} className="loader-percentage">
              <span>{String(percentage).padStart(3, "0")}</span>
              <small>%</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loader;
