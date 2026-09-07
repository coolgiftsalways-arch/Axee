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

  const letters = ["A", "X", "I", "E", "E"];

  useEffect(() => {
    const counter = { value: 0 };

    let iMoveX = 0;
    let iMoveY = 0;

    const tl = gsap.timeline();

    // ==============================
    // INITIAL STATE
    // ==============================

    gsap.set(lettersRef.current, {
      y: 120,
      opacity: 0,
      rotateX: 90,
    });

    gsap.set(lineRef.current, {
      scaleX: 0,
      transformOrigin: "left center",
    });

    gsap.set([leftPanelRef.current, rightPanelRef.current], {
      xPercent: 0,
    });

    // ==============================
    // 1. AXIEE ENTER
    // ==============================

    tl.to(lettersRef.current, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 0.75,
      stagger: 0.13,
      ease: "power4.out",
    });

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
      "-=0.15",
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

    // 100% punch

    tl.to(percentageRef.current, {
      scale: 1.1,
      duration: 0.15,
      ease: "power2.out",
    });

    tl.to(percentageRef.current, {
      scale: 1,
      duration: 0.15,
      ease: "power2.in",
    });

    tl.to({}, { duration: 0.2 });

    // ==============================
    // 4. REMOVE A X E E
    // ==============================

    tl.to(
      [
        lettersRef.current[0],
        lettersRef.current[1],
        lettersRef.current[3],
        lettersRef.current[4],
      ],
      {
        opacity: 0,
        scale: 0.7,
        filter: "blur(12px)",
        duration: 0.5,
        ease: "power3.inOut",
      },
    );

    // hide progress

    tl.to(
      bottomRef.current,
      {
        opacity: 0,
        y: 30,
        duration: 0.4,
        ease: "power2.inOut",
      },
      "<",
    );

    // ==============================
    // 5. FIND EXACT I CENTER
    // ==============================

    tl.add(() => {
      const iLetter = lettersRef.current[2];

      if (!iLetter) return;

      const rect = iLetter.getBoundingClientRect();

      const currentX = rect.left + rect.width / 2;
      const currentY = rect.top + rect.height / 2;

      const screenX = window.innerWidth / 2;
      const screenY = window.innerHeight / 2;

      iMoveX = screenX - currentX;
      iMoveY = screenY - currentY;
    });

    // ==============================
    // 6. MOVE I EXACTLY CENTER
    // ==============================

    tl.to(lettersRef.current[2], {
      x: () => iMoveX,
      y: () => iMoveY,
      duration: 0.7,
      ease: "power4.inOut",
    });

    // pause

    tl.to({}, { duration: 0.25 });

    // ==============================
    // 7. I STRETCHES SLIGHTLY
    // ==============================

    tl.to(lettersRef.current[2], {
      scaleY: 1.35,
      scaleX: 0.65,
      duration: 0.45,
      ease: "power3.inOut",
    });

    // little glow

    tl.to(lettersRef.current[2], {
      textShadow: "0 0 20px rgba(199,255,19,.9), 0 0 60px rgba(199,255,19,.5)",
      duration: 0.25,
    });

    // ==============================
    // 8. TURN I INTO THE DOOR
    // ==============================

    tl.to(lettersRef.current[2], {
      opacity: 0,
      duration: 0.15,
    });

    /*
       Remove normal loader background.
       Black panels now cover screen.
    */

    tl.set(loaderRef.current, {
      backgroundColor: "transparent",
    });

    // ==============================
    // 9. NETFLIX STYLE OPEN
    // ==============================

    tl.to(leftPanelRef.current, {
      xPercent: -100,
      duration: 1.5,
      ease: "power4.inOut",
    });

    tl.to(
      rightPanelRef.current,
      {
        xPercent: 100,
        duration: 1.5,
        ease: "power4.inOut",
      },
      "<",
    );

    // ==============================
    // 10. REMOVE LOADER
    // ==============================

    tl.set(loaderRef.current, {
      pointerEvents: "none",
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
      {/* BLACK REVEAL PANELS */}

      <div
        ref={leftPanelRef}
        className="loader-door-panel loader-door-left"
      ></div>

      <div
        ref={rightPanelRef}
        className="loader-door-panel loader-door-right"
      ></div>

      <div className="loader-inner">
        {/* AXIEE */}

        <div className="loader-logo">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              ref={(element) => {
                lettersRef.current[index] = element;
              }}
              className={
                index === 2 ? "loader-letter loader-letter-i" : "loader-letter"
              }
            >
              {letter}
            </span>
          ))}
        </div>

        {/* BOTTOM */}

        <div ref={bottomRef} className="loader-bottom">
          <div className="loader-progress">
            <span ref={lineRef}></span>
          </div>

          <div className="loader-information">
            <p>LOADING THE EXPERIENCE</p>

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
