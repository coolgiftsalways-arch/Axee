import React, { useLayoutEffect, useRef, useState } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  Package,
  MapPin,
  Search,
  Copy,
  CalendarDays,
  Truck,
  Check,
} from "lucide-react";

import "../styles/trackOrder.css";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   AXIEE CARGO VAN
========================================================= */

function CargoVan() {
  return (
    <svg
      className="ax-cargo-van-svg"
      viewBox="0 0 320 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="axVanBody" x1="30" y1="20" x2="280" y2="125">
          <stop stopColor="#3b403a" />
          <stop offset="0.42" stopColor="#181b18" />
          <stop offset="1" stopColor="#070807" />
        </linearGradient>

        <linearGradient id="axVanGlass" x1="210" y1="35" x2="270" y2="80">
          <stop stopColor="#819289" stopOpacity="0.7" />
          <stop offset="1" stopColor="#111712" />
        </linearGradient>

        <filter id="axVanShadow">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor="#000"
            floodOpacity="0.8"
          />
        </filter>
      </defs>

      <ellipse cx="160" cy="130" rx="135" ry="10" fill="#000" opacity="0.7" />

      <g filter="url(#axVanShadow)">
        <path
          d="
            M28 35
            C28 25 36 19 46 19
            H187
            C195 19 202 24 206 31
            L229 69
            H267
            C281 69 291 80 291 93
            V107
            H275
            C271 90 259 80 242 80
            C225 80 213 91 210 107
            H91
            C88 90 76 80 59 80
            C42 80 30 91 27 107
            H17
            V50
            C17 41 21 35 28 35
          "
          fill="url(#axVanBody)"
          stroke="rgba(255,255,255,.28)"
          strokeWidth="1.4"
        />

        <path
          d="
            M207 35
            H235
            C242 35 247 39 251 46
            L266 69
            H229
            Z
          "
          fill="url(#axVanGlass)"
          stroke="rgba(255,255,255,.22)"
        />

        <rect
          x="115"
          y="30"
          width="71"
          height="65"
          rx="3"
          stroke="rgba(255,255,255,.12)"
        />

        <text
          x="60"
          y="61"
          fill="#bfff00"
          fontSize="21"
          fontFamily="Arial"
          letterSpacing="5"
        >
          AXIEE
        </text>

        <text
          x="62"
          y="77"
          fill="rgba(255,255,255,.45)"
          fontSize="5"
          fontFamily="Arial"
          letterSpacing="2"
        >
          LOGISTICS
        </text>

        <rect x="282" y="76" width="8" height="8" rx="2" fill="#ddff6f" />

        <rect
          x="17"
          y="65"
          width="5"
          height="18"
          rx="2"
          fill="#ff4b44"
          opacity="0.7"
        />

        <circle
          cx="59"
          cy="107"
          r="20"
          fill="#050505"
          stroke="#6d726d"
          strokeWidth="2"
        />

        <circle cx="59" cy="107" r="9" fill="#292d29" stroke="#aaa" />

        <circle
          cx="242"
          cy="107"
          r="20"
          fill="#050505"
          stroke="#6d726d"
          strokeWidth="2"
        />

        <circle cx="242" cy="107" r="9" fill="#292d29" stroke="#aaa" />
      </g>
    </svg>
  );
}

/* =========================================================
   AXIEE AIRCRAFT
========================================================= */

function CargoPlane() {
  return (
    <svg
      className="ax-plane-svg"
      viewBox="0 0 440 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="axPlaneBody" x1="60" y1="70" x2="385" y2="115">
          <stop stopColor="#f4f4ef" />
          <stop offset="0.5" stopColor="#c9cdc8" />
          <stop offset="1" stopColor="#696f6a" />
        </linearGradient>

        <linearGradient id="axWing" x1="180" y1="70" x2="250" y2="165">
          <stop stopColor="#dfe2dd" />
          <stop offset="1" stopColor="#646a65" />
        </linearGradient>

        <filter id="axPlaneShadow">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="7"
            floodColor="#000"
            floodOpacity="0.8"
          />
        </filter>
      </defs>

      <g filter="url(#axPlaneShadow)">
        <path
          d="
            M30 95
            C62 86 100 84 135 82
            L300 69
            C334 66 370 70 400 82
            C411 86 418 92 414 97
            C409 103 395 105 379 106
            L135 113
            C96 114 63 110 35 104
            L17 100
            C9 98 10 94 17 92
            Z
          "
          fill="url(#axPlaneBody)"
          stroke="rgba(255,255,255,.65)"
        />

        <path
          d="
            M193 82
            L239 22
            L277 20
            L243 78
            Z
          "
          fill="url(#axWing)"
        />

        <path
          d="
            M205 108
            L285 167
            L247 169
            L171 112
            Z
          "
          fill="url(#axWing)"
        />

        <path
          d="
            M85 85
            L55 35
            L83 36
            L123 82
            Z
          "
          fill="url(#axWing)"
        />

        <path d="M88 105L43 131L101 109" fill="#9ea49f" />

        <path
          d="
            M363 75
            C380 77 394 80 404 85
            L390 91
            L359 89
            Z
          "
          fill="#18221d"
        />

        <ellipse
          cx="223"
          cy="122"
          rx="24"
          ry="14"
          fill="#343936"
          stroke="#b2b6b1"
        />

        <ellipse cx="223" cy="122" rx="13" ry="8" fill="#090b0a" />

        <ellipse
          cx="291"
          cy="117"
          rx="23"
          ry="13"
          fill="#343936"
          stroke="#b2b6b1"
        />

        <ellipse cx="291" cy="117" rx="12" ry="7" fill="#090b0a" />

        <path
          d="M122 88L333 76"
          stroke="#29332d"
          strokeWidth="3"
          strokeDasharray="3 7"
        />

        <text
          x="143"
          y="102"
          fill="#151815"
          fontSize="16"
          fontFamily="Arial"
          letterSpacing="4"
        >
          AXIEE
        </text>

        <text
          x="213"
          y="101"
          fill="#6c8500"
          fontSize="6"
          fontFamily="Arial"
          letterSpacing="2"
        >
          AIR CARGO
        </text>

        <circle cx="247" cy="22" r="3" fill="#bfff00" />
        <circle cx="284" cy="167" r="3" fill="#ff4d45" />
      </g>
    </svg>
  );
}

/* =========================================================
   WAREHOUSE
========================================================= */

function SellerWarehouse() {
  return (
    <div className="ax-warehouse">
      <div className="ax-warehouse-roof"></div>

      <div className="ax-warehouse-name">AXIEE</div>

      <div className="ax-warehouse-body">
        <div className="ax-warehouse-door">
          <i></i>
          <i></i>
          <i></i>
        </div>

        <div className="ax-warehouse-light"></div>
      </div>
    </div>
  );
}

/* =========================================================
   AIRPORT
========================================================= */

function Airport({ destination = false }) {
  return (
    <div className="ax-airport">
      <div className="ax-airport-tower">
        <div className="ax-airport-beacon"></div>

        <div className="ax-tower-window">
          <i></i>
          <i></i>
          <i></i>
        </div>

        <div className="ax-tower-column"></div>
      </div>

      <div className="ax-airport-terminal">
        <div className="ax-terminal-glass">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>

        <span>{destination ? "DESTINATION HUB" : "AXIEE AIR HUB"}</span>
      </div>
    </div>
  );
}

/* =========================================================
   IMPROVED DELIVERY SCOOTER

   No gun-like straight handle.
========================================================= */

function DeliveryRider() {
  return (
    <svg
      className="ax-rider-svg"
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="scooterBody" x1="60" y1="65" x2="180" y2="130">
          <stop stopColor="#2a2f29" />
          <stop offset="1" stopColor="#0a0c0a" />
        </linearGradient>

        <linearGradient id="riderJacket" x1="100" y1="45" x2="125" y2="100">
          <stop stopColor="#252925" />
          <stop offset="1" stopColor="#0b0d0b" />
        </linearGradient>

        <filter id="riderShadow">
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="6"
            floodColor="#000"
            floodOpacity=".8"
          />
        </filter>
      </defs>

      {/* ground shadow */}

      <ellipse cx="120" cy="142" rx="95" ry="8" fill="#000" opacity=".7" />

      <g filter="url(#riderShadow)">
        {/* wheels */}

        <circle
          cx="65"
          cy="123"
          r="25"
          fill="#050605"
          stroke="#707670"
          strokeWidth="3"
        />

        <circle cx="65" cy="123" r="10" fill="#252925" stroke="#b0b4af" />

        <circle
          cx="178"
          cy="123"
          r="25"
          fill="#050605"
          stroke="#707670"
          strokeWidth="3"
        />

        <circle cx="178" cy="123" r="10" fill="#252925" stroke="#b0b4af" />

        {/* scooter rear body */}

        <path
          d="
            M62 111
            C73 93 89 85 111 87
            H143
            C153 87 159 94 162 102
            L171 119
            H125
            L101 109
            L77 119
            Z
          "
          fill="url(#scooterBody)"
          stroke="rgba(255,255,255,.28)"
          strokeWidth="1.4"
        />

        {/* front scooter shield */}

        <path
          d="
            M153 91
            C161 79 168 69 179 63
            L188 66
            C181 80 177 96 176 119
            H162
            C163 107 159 99 153 91
            Z
          "
          fill="#171b17"
          stroke="rgba(255,255,255,.3)"
        />

        {/* CURVED handlebar */}

        <path
          d="
            M176 68
            C182 59 190 56 199 59
          "
          stroke="#b6bbb6"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="
            M197 59
            C201 60 204 62 207 65
          "
          stroke="#b6bbb6"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* headlamp */}

        <ellipse cx="181" cy="83" rx="7" ry="5" fill="#dfff75" opacity=".9" />

        {/* seat */}

        <path
          d="
            M95 84
            H141
            C147 84 150 87 149 91
            H96
            C91 91 90 87 95 84
          "
          fill="#090a09"
          stroke="rgba(255,255,255,.25)"
        />

        {/* delivery box */}

        <rect
          x="47"
          y="65"
          width="52"
          height="42"
          rx="5"
          fill="#161916"
          stroke="#bfff00"
          strokeOpacity=".55"
        />

        <path d="M47 78H99" stroke="rgba(191,255,0,.22)" />

        <text
          x="55"
          y="91"
          fill="#bfff00"
          fontSize="10"
          fontFamily="Arial"
          letterSpacing="2"
        >
          AXIEE
        </text>

        {/* rider torso */}

        <path
          d="
            M111 55
            C118 49 128 49 135 55
            L151 82
            L140 92
            L113 86
            L99 70
            Z
          "
          fill="url(#riderJacket)"
          stroke="rgba(255,255,255,.24)"
        />

        {/* rider leg */}

        <path
          d="
            M119 84
            L141 101
            L126 120
          "
          stroke="#343934"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* rider arm */}

        <path
          d="
            M132 62
            C146 65 157 66 174 68
          "
          stroke="#343934"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* hand */}

        <circle cx="174" cy="68" r="4" fill="#b6b1a8" />

        {/* helmet */}

        <circle
          cx="116"
          cy="40"
          r="18"
          fill="#111411"
          stroke="#bfff00"
          strokeWidth="1.3"
        />

        <path
          d="
            M112 35
            C121 34 129 36 134 40
          "
          stroke="#d9ded9"
          strokeOpacity=".55"
          strokeWidth="2"
        />

        <path
          d="
            M116 39
            H133
          "
          stroke="#6d7b73"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* AXIEE mark */}

        <text
          x="106"
          y="67"
          fill="#bfff00"
          fontSize="6"
          fontFamily="Arial"
          letterSpacing="1.5"
        >
          AX
        </text>
      </g>
    </svg>
  );
}

/* =========================================================
   CUSTOMER
========================================================= */

function CustomerDoor() {
  return (
    <div className="ax-customer">
      <div className="ax-customer-roof"></div>

      <div className="ax-customer-body">
        <div className="ax-customer-door">
          <div className="ax-person">
            <div className="ax-person-head"></div>
            <div className="ax-person-body"></div>
          </div>
        </div>

        <Package size={24} strokeWidth={1.2} className="ax-customer-package" />
      </div>

      <div className="ax-customer-check">
        <Check size={13} strokeWidth={3} />
      </div>
    </div>
  );
}

/* =========================================================
   STEPS
========================================================= */

const steps = [
  {
    number: "01",
    title: "ORDER RECEIVED",
  },
  {
    number: "02",
    title: "PACKING",
  },
  {
    number: "03",
    title: "PICKED UP",
  },
  {
    number: "04",
    title: "AIR HUB",
  },
  {
    number: "05",
    title: "FLIGHT",
  },
  {
    number: "06",
    title: "LANDED",
  },
  {
    number: "07",
    title: "OUT FOR DELIVERY",
  },
  {
    number: "08",
    title: "DELIVERED",
  },
];

/* =========================================================
   PAGE
========================================================= */

function TrackOrder() {
  const [orderId, setOrderId] = useState("");

  const [trackedOrder, setTrackedOrder] = useState("AXIEE-2026-00125");

  const pageRef = useRef(null);

  const sellerRef = useRef(null);
  const packageRef = useRef(null);
  const vanRef = useRef(null);
  const airportOneRef = useRef(null);
  const planeRef = useRef(null);
  const airportTwoRef = useRef(null);
  const riderRef = useRef(null);
  const customerRef = useRef(null);

  const routeRef = useRef(null);
  const routeDotRef = useRef(null);

  const statusRef = useRef(null);

  /* =========================================================
     ANIMATION
  ========================================================= */

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const seller = sellerRef.current;
      const box = packageRef.current;
      const van = vanRef.current;
      const airportOne = airportOneRef.current;
      const plane = planeRef.current;
      const airportTwo = airportTwoRef.current;
      const rider = riderRef.current;
      const customer = customerRef.current;

      /* =====================================================
         HERO INTRO
      ===================================================== */

      gsap.from(".ax-track-heading > span", {
        opacity: 0,
        y: 10,
        duration: 0.4,
      });

      gsap.from(".ax-track-heading h1", {
        opacity: 0,
        y: 45,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".ax-track-heading p", {
        opacity: 0,
        y: 15,
        duration: 0.5,
        delay: 0.2,
      });

      gsap.from(".ax-status-card", {
        opacity: 0,
        y: -15,
        stagger: 0.1,
        duration: 0.5,
        delay: 0.2,
      });

      /* =====================================================
         INITIAL STATES
      ===================================================== */

      gsap.set(
        [seller, box, van, airportOne, plane, airportTwo, rider, customer],
        {
          opacity: 0,
          visibility: "visible",
        },
      );

      gsap.set(seller, {
        y: 12,
      });

      gsap.set(box, {
        scale: 0.65,
      });

      gsap.set(van, {
        x: -150,
      });

      gsap.set(airportOne, {
        y: 15,
      });

      gsap.set(plane, {
        x: -220,
        y: 35,
        scale: 0.78,
        rotate: -5,
      });

      gsap.set(airportTwo, {
        y: 15,
      });

      /* IMPORTANT
         rider starts farther left
      */

      gsap.set(rider, {
        x: -150,
      });

      gsap.set(customer, {
        scale: 0.8,
      });

      gsap.set(routeRef.current, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      gsap.set(routeDotRef.current, {
        left: "0%",
        opacity: 0,
      });

      gsap.set(".ax-step", {
        opacity: 0.23,
      });

      /* =====================================================
         HELPERS
      ===================================================== */

      const status = (text) => {
        if (!statusRef.current) return;

        gsap.to(statusRef.current, {
          opacity: 0,
          duration: 0.1,

          onComplete: () => {
            statusRef.current.textContent = text;

            gsap.to(statusRef.current, {
              opacity: 1,
              duration: 0.18,
            });
          },
        });
      };

      const activeStep = (number) => {
        gsap.to(".ax-step", {
          opacity: 0.23,
          duration: 0.2,
        });

        gsap.to(`.ax-step[data-step="${number}"]`, {
          opacity: 1,
          duration: 0.25,
        });
      };

      const routeTo = (percent) => {
        gsap.to(routeRef.current, {
          scaleX: percent / 100,
          duration: 0.55,
          ease: "power2.inOut",
        });

        gsap.to(routeDotRef.current, {
          left: `${percent}%`,
          opacity: 1,
          duration: 0.55,
          ease: "power2.inOut",
        });
      };

      /* =====================================================
         MAIN TIMELINE
      ===================================================== */

      const tl = gsap.timeline({
        delay: 0.7,

        defaults: {
          ease: "power2.inOut",
        },
      });

      /* =====================================================
         01 ORDER RECEIVED
      ===================================================== */

      tl.call(() => {
        status("ORDER RECEIVED");
        activeStep("01");
      });

      tl.to(seller, {
        opacity: 1,
        y: 0,
        duration: 0.45,
      });

      tl.call(() => {
        routeTo(7);
      });

      /* =====================================================
         02 PACKING
      ===================================================== */

      tl.call(() => {
        status("PACKING YOUR ORDER");
        activeStep("02");
      });

      tl.to(box, {
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: "back.out(1.7)",
      });

      tl.to(box, {
        y: -7,
        duration: 0.12,
        repeat: 1,
        yoyo: true,
      });

      tl.call(() => {
        routeTo(18);
      });

      /* =====================================================
         03 VAN
      ===================================================== */

      tl.call(() => {
        status("COURIER PICKED UP PACKAGE");
        activeStep("03");
      });

      tl.to(van, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      tl.to(
        box,
        {
          x: 120,
          y: 8,
          scale: 0.65,
          duration: 0.45,
        },
        "-=0.25",
      );

      tl.to(box, {
        opacity: 0,
        duration: 0.15,
      });

      tl.call(() => {
        routeTo(31);
      });

      tl.to(van, {
        x: 100,
        duration: 0.65,
      });

      /* =====================================================
         04 AIR HUB
      ===================================================== */

      tl.call(() => {
        status("PACKAGE AT AIR HUB");
        activeStep("04");
      });

      tl.to(
        airportOne,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
        },
        "-=0.3",
      );

      tl.to(van, {
        opacity: 0.18,
        duration: 0.2,
      });

      tl.call(() => {
        routeTo(44);
      });

      /* =====================================================
         05 FLIGHT
      ===================================================== */

      tl.call(() => {
        status("FLIGHT DEPARTED");
        activeStep("05");
      });

      tl.to(plane, {
        opacity: 1,
        duration: 0.2,
      });

      tl.to(plane, {
        x: -50,
        y: 10,
        scale: 0.85,
        duration: 0.45,
      });

      tl.to(plane, {
        x: 40,
        y: -38,
        rotate: -4,
        scale: 0.92,
        duration: 0.55,
        ease: "power3.out",
      });

      tl.to(plane, {
        x: 150,
        y: -72,
        rotate: 0,
        scale: 1,
        duration: 0.7,
        ease: "sine.inOut",
      });

      tl.call(() => {
        status("PACKAGE IN AIR TRANSIT");
        routeTo(58);
      });

      /* =====================================================
         06 LANDING
      ===================================================== */

      tl.call(() => {
        activeStep("06");
      });

      tl.to(
        airportTwo,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
        },
        "-=0.25",
      );

      tl.to(plane, {
        x: 245,
        y: -38,
        rotate: 3,
        scale: 0.9,
        duration: 0.55,
      });

      tl.to(plane, {
        x: 305,
        y: 15,
        rotate: 0,
        scale: 0.8,
        duration: 0.45,
      });

      tl.call(() => {
        status("PACKAGE LANDED");
        routeTo(71);
      });

      tl.to(plane, {
        opacity: 0,
        duration: 0.22,
      });

      /* =====================================================
         07 RIDER
      ===================================================== */

      tl.call(() => {
        status("OUT FOR DELIVERY");
        activeStep("07");
      });

      /*
        Rider enters from left
      */

      tl.to(rider, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      tl.call(() => {
        routeTo(84);
      });

      /*
        Bike now drives MUCH FARTHER.
      */

      tl.to(rider, {
        x: 115,
        duration: 0.65,
        ease: "power1.inOut",
      });

      tl.call(() => {
        status("DELIVERY PARTNER NEAR YOUR ADDRESS");
      });

      tl.to(rider, {
        x: 205,
        duration: 0.65,
        ease: "power2.inOut",
      });

      tl.call(() => {
        routeTo(94);
      });

      /*
        final approach to customer
      */

      tl.to(rider, {
        x: 255,
        duration: 0.45,
        ease: "power2.out",
      });

      /* bike stops */

      tl.to(rider, {
        y: -3,
        duration: 0.12,
        repeat: 1,
        yoyo: true,
      });

      /* =====================================================
         08 CUSTOMER
      ===================================================== */

      tl.call(() => {
        status("HANDING PACKAGE TO CUSTOMER");
        activeStep("08");
      });

      tl.to(
        customer,
        {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: "back.out(1.6)",
        },
        "-=0.3",
      );

      /*
        Rider fades slightly
        to show delivery finished.
      */

      tl.to(rider, {
        opacity: 0.55,
        duration: 0.3,
      });

      tl.call(() => {
        routeTo(100);
      });

      tl.to(".ax-customer-check", {
        scale: 1.3,
        duration: 0.18,
        repeat: 1,
        yoyo: true,
        boxShadow: "0 0 28px rgba(191,255,0,.9)",
      });

      tl.call(() => {
        status("ORDER DELIVERED ✓");
      });

      /* =====================================================
         LOWER PAGE REVEALS
      ===================================================== */

      gsap.utils.toArray(".ax-track-reveal").forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 45,
          duration: 0.8,

          scrollTrigger: {
            trigger: section,
            start: "top 88%",
            once: true,
          },
        });
      });

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, []);

  /* =========================================================
     TRACK FORM
  ========================================================= */

  const handleTrack = (event) => {
    event.preventDefault();

    const cleanOrder = orderId.trim();

    if (!cleanOrder) return;

    setTrackedOrder(cleanOrder);

    setOrderId("");
  };

  /* =========================================================
     COPY
  ========================================================= */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackedOrder);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main ref={pageRef} className="ax-track-page">
      {/* =====================================================
          FIRST SCREEN
      ===================================================== */}

      <section className="ax-track-first-screen">
        <div className="ax-track-grid"></div>

        <div className="ax-track-glow"></div>

        {/* TOP */}

        <div className="ax-track-top">
          <div className="ax-track-heading">
            <span>AXIEE / ORDER SYSTEM</span>

            <h1>
              TRACK
              <br />
              YOUR
              <br />
              ORDER
            </h1>

            <p>
              FOLLOW YOUR AXIEE PACKAGE FROM
              <br />
              SELLER TO YOUR DOORSTEP.
            </p>
          </div>

          <div className="ax-track-status">
            <article className="ax-status-card">
              <span>ORDER ID</span>

              <strong>{trackedOrder}</strong>
            </article>

            <article className="ax-status-card ax-live-card">
              <span>
                <i></i>
                LIVE TRACKING
              </span>

              <strong ref={statusRef}>STARTING JOURNEY</strong>
            </article>
          </div>
        </div>

        {/* =================================================
            JOURNEY
        ================================================= */}

        <div className="ax-journey">
          {/* MAP */}

          <div className="ax-world-map">
            <div></div>
          </div>

          {/* FLIGHT ARC */}

          <svg
            className="ax-flight-path"
            viewBox="0 0 1000 250"
            preserveAspectRatio="none"
          >
            <path
              d="M300 215 C430 35 575 35 700 215"
              fill="none"
              stroke="rgba(191,255,0,.18)"
              strokeWidth="1"
              strokeDasharray="7 8"
            />

            <path
              d="M300 215 C430 35 575 35 700 215"
              fill="none"
              stroke="#bfff00"
              strokeWidth="1.4"
              opacity=".28"
            />
          </svg>

          {/* ROUTE */}

          <div className="ax-route">
            <div ref={routeRef} className="ax-route-progress"></div>

            <div ref={routeDotRef} className="ax-route-dot"></div>
          </div>

          {/* SELLER */}

          <div ref={sellerRef} className="ax-object ax-seller">
            <SellerWarehouse />
          </div>

          {/* PACKAGE */}

          <div ref={packageRef} className="ax-object ax-package">
            <div className="ax-package-box">
              <div className="ax-box-tape"></div>

              <Package size={27} strokeWidth={1.1} />

              <strong>AXIEE</strong>
            </div>
          </div>

          {/* VAN */}

          <div ref={vanRef} className="ax-object ax-van">
            <CargoVan />
          </div>

          {/* AIRPORT */}

          <div ref={airportOneRef} className="ax-object ax-airport-one">
            <Airport />
          </div>

          {/* PLANE */}

          <div ref={planeRef} className="ax-object ax-plane">
            <CargoPlane />
          </div>

          {/* DESTINATION */}

          <div ref={airportTwoRef} className="ax-object ax-airport-two">
            <Airport destination />
          </div>

          {/* RIDER */}

          <div ref={riderRef} className="ax-object ax-rider">
            <DeliveryRider />
          </div>

          {/* CUSTOMER */}

          <div ref={customerRef} className="ax-object ax-customer-position">
            <CustomerDoor />
          </div>
        </div>

        {/* STEPS */}

        <div className="ax-steps">
          {steps.map((step) => (
            <article
              className="ax-step"
              data-step={step.number}
              key={step.number}
            >
              <div className="ax-step-number">{step.number}</div>

              <h3>{step.title}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="ax-track-search ax-track-reveal">
        <div>
          <span className="ax-small-green">ENTER YOUR ORDER ID</span>

          <h2>
            WHERE IS
            <br />
            YOUR ORDER?
          </h2>

          <p>YOU ONLY NEED YOUR AXIEE ORDER ID.</p>
        </div>

        <form onSubmit={handleTrack}>
          <label htmlFor="trackOrder">ORDER ID</label>

          <div className="ax-form-row">
            <div className="ax-input">
              <Package size={19} strokeWidth={1.2} />

              <input
                id="trackOrder"
                value={orderId}
                type="text"
                placeholder="AXIEE-2026-00125"
                autoComplete="off"
                onChange={(event) => setOrderId(event.target.value)}
              />
            </div>

            <button type="submit">
              TRACK ORDER
              <Search size={17} strokeWidth={1.4} />
            </button>
          </div>

          <small>EXAMPLE / AXIEE-2026-00125</small>
        </form>
      </section>

      {/* =====================================================
          DETAILS
      ===================================================== */}

      <section className="ax-order-details ax-track-reveal">
        <span className="ax-detail-title">ORDER DETAILS</span>

        <div className="ax-detail-grid">
          <article className="ax-detail-card">
            <div>
              <span>ORDER ID</span>

              <strong>{trackedOrder}</strong>
            </div>

            <button type="button" onClick={handleCopy}>
              <Copy size={18} />
            </button>
          </article>

          <article className="ax-detail-card">
            <CalendarDays size={25} />

            <div>
              <span>ESTIMATED DELIVERY</span>

              <strong>12 SEP 2026</strong>
            </div>
          </article>

          <article className="ax-detail-card">
            <Truck size={26} />

            <div>
              <span>COURIER</span>

              <strong>AXIEE EXPRESS</strong>
            </div>
          </article>

          <article className="ax-detail-card">
            <MapPin size={26} />

            <div>
              <span>DESTINATION</span>

              <strong>MUMBAI, INDIA</strong>
            </div>
          </article>
        </div>
      </section>

      {/* =====================================================
          SUPPORT
      ===================================================== */}

      <section className="ax-support ax-track-reveal">
        <div>
          <span className="ax-small-green">NEED HELP?</span>

          <h2>ORDER SUPPORT</h2>

          <p>Keep your order ID ready when contacting AXIEE support.</p>
        </div>

        <button type="button">
          CONTACT SUPPORT
          <span>→</span>
        </button>
      </section>
    </main>
  );
}

export default TrackOrder;
