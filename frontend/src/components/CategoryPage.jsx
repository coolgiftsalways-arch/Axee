import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowRight, SlidersHorizontal, Search, X } from "lucide-react";

import { products } from "../data/products";
import "../styles/shop.css";

/* =========================================================
   CATEGORY VISUAL
========================================================= */

function CategoryVisual({ type }) {
  /* =======================================================
     T-SHIRTS VISUAL
  ======================================================= */

  if (type === "tshirts") {
    return (
      <div className="category-visual category-visual-tshirts">
        <svg
          className="category-tshirt-svg"
          viewBox="0 0 700 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="
              M265 75
              L320 45
              L380 45
              L435 75
              L515 120
              L470 205
              L430 182
              L430 350
              L270 350
              L270 182
              L230 205
              L185 120
              Z
            "
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.35"
          />

          <path
            d="
              M320 45
              C325 88
              375 88
              380 45
            "
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.22"
          />

          <path
            d="M270 182H430"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.08"
          />

          <path
            d="M350 70V350"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.08"
          />

          <circle
            cx="350"
            cy="210"
            r="82"
            stroke="currentColor"
            opacity="0.12"
          />

          <circle cx="350" cy="210" r="5" fill="currentColor" />

          <path d="M165 70H240" stroke="currentColor" opacity="0.25" />

          <path d="M460 340H545" stroke="currentColor" opacity="0.25" />

          <path d="M165 70V120" stroke="currentColor" opacity="0.25" />

          <path d="M545 290V340" stroke="currentColor" opacity="0.25" />
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>FORM</span>
          <span>COTTON</span>
          <span>STRUCTURE</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>01 / 06</span>
          <span>ESSENTIAL</span>
          <span>TEE SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / TS / 001</span>

        <span className="category-coordinate bottom">GARMENT STUDY / 2026</span>
      </div>
    );
  }

  /* =======================================================
     SHIRTS VISUAL
  ======================================================= */

  if (type === "shirts") {
    return (
      <div className="category-visual category-visual-shirts">
        <svg
          className="category-shirt-svg"
          viewBox="0 0 700 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="235"
            y="90"
            width="230"
            height="245"
            stroke="currentColor"
            opacity="0.2"
          />

          <path
            d="M235 90L310 50H390L465 90"
            stroke="currentColor"
            opacity="0.35"
          />

          <path
            d="M310 50L350 110L390 50"
            stroke="currentColor"
            opacity="0.28"
          />

          <path d="M350 110V335" stroke="currentColor" opacity="0.18" />

          <circle cx="350" cy="145" r="3" fill="currentColor" />

          <circle cx="350" cy="190" r="3" fill="currentColor" />

          <circle cx="350" cy="235" r="3" fill="currentColor" />

          <path d="M170 130H225" stroke="currentColor" opacity="0.2" />

          <path d="M475 290H540" stroke="currentColor" opacity="0.2" />
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>TAILORED</span>
          <span>STRUCTURE</span>
          <span>FORM</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>02 / 06</span>
          <span>REFINED</span>
          <span>SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / SH / 002</span>

        <span className="category-coordinate bottom">
          STRUCTURE STUDY / 2026
        </span>
      </div>
    );
  }

  /* =======================================================
     HOODIES VISUAL
  ======================================================= */

  if (type === "hoodies") {
    return (
      <div className="category-visual category-visual-hoodies">
        <svg
          className="category-hoodie-svg"
          viewBox="0 0 700 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="350"
            cy="255"
            r="175"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
          />

          <circle
            cx="350"
            cy="255"
            r="120"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
            strokeDasharray="5 9"
          />

          {/* HOOD */}

          <path
            d="
              M285 145
              C300 95 330 75 350 75
              C370 75 400 95 415 145
              L390 175
              C378 145 365 130 350 130
              C335 130 322 145 310 175
              Z
            "
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="
              M310 145
              C322 112 338 98 350 98
              C362 98 378 112 390 145
            "
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="5 6"
          />

          {/* BODY */}

          <path
            d="
              M310 165
              L255 190
              L205 285
              L245 305
              L280 255
              L270 430
              L430 430
              L420 255
              L455 305
              L495 285
              L445 190
              L390 165
            "
            stroke="currentColor"
            strokeWidth="2"
          />

          <path
            d="M310 165L350 190L390 165"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          <line
            x1="350"
            y1="190"
            x2="350"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="5 6"
          />

          {/* POCKET */}

          <path
            d="
              M300 335
              L400 335
              L420 390
              L280 390
              Z
            "
            stroke="currentColor"
            strokeOpacity="0.7"
            strokeWidth="1"
          />

          <path
            d="M300 335L350 365L400 335"
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="1"
          />

          {/* CUFFS */}

          <line
            x1="205"
            y1="285"
            x2="245"
            y2="305"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.65"
          />

          <line
            x1="455"
            y1="305"
            x2="495"
            y2="285"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.65"
          />

          {/* BOTTOM */}

          <line
            x1="270"
            y1="430"
            x2="430"
            y2="430"
            stroke="currentColor"
            strokeWidth="5"
            strokeOpacity="0.65"
          />

          {/* DRAW STRINGS */}

          <line
            x1="338"
            y1="158"
            x2="330"
            y2="225"
            stroke="currentColor"
            strokeOpacity="0.8"
            strokeWidth="1"
          />

          <line
            x1="362"
            y1="158"
            x2="370"
            y2="225"
            stroke="currentColor"
            strokeOpacity="0.8"
            strokeWidth="1"
          />

          <circle cx="330" cy="228" r="3" fill="currentColor" />

          <circle cx="370" cy="228" r="3" fill="currentColor" />

          {/* MEASURE */}

          <line
            x1="180"
            y1="150"
            x2="180"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <line
            x1="165"
            y1="150"
            x2="195"
            y2="150"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <line
            x1="165"
            y1="430"
            x2="195"
            y2="430"
            stroke="currentColor"
            strokeOpacity="0.15"
          />

          <text
            x="158"
            y="300"
            fill="currentColor"
            fillOpacity="0.3"
            fontSize="9"
            letterSpacing="3"
            transform="rotate(-90 158 300)"
          >
            BODY LENGTH
          </text>

          {/* TECH COPY */}

          <line
            x1="460"
            y1="170"
            x2="510"
            y2="170"
            stroke="currentColor"
            strokeOpacity="0.25"
          />

          <text
            x="525"
            y="165"
            fill="currentColor"
            fillOpacity="0.7"
            fontSize="9"
            letterSpacing="3"
          >
            HOOD
          </text>

          <text
            x="525"
            y="190"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="8"
            letterSpacing="2"
          >
            STRUCTURE
          </text>

          <text
            x="525"
            y="215"
            fill="currentColor"
            fillOpacity="0.35"
            fontSize="8"
            letterSpacing="2"
          >
            LAYER
          </text>

          <text
            x="520"
            y="330"
            fill="currentColor"
            fillOpacity="0.18"
            fontSize="48"
            fontFamily="serif"
          >
            06
          </text>

          <text
            x="520"
            y="355"
            fill="currentColor"
            fillOpacity="0.4"
            fontSize="8"
            letterSpacing="2"
          >
            LAYER SYSTEM
          </text>

          <text
            x="235"
            y="485"
            fill="currentColor"
            fillOpacity="0.3"
            fontSize="8"
            letterSpacing="3"
          >
            AX / HD / 006
          </text>

          <text
            x="420"
            y="485"
            fill="currentColor"
            fillOpacity="0.18"
            fontSize="8"
            letterSpacing="2"
          >
            GARMENT STUDY / 2026
          </text>
        </svg>

        <div className="category-side-copy category-side-copy-one">
          <span>PROTECT</span>
          <span>LAYER</span>
          <span>FORM</span>
        </div>

        <div className="category-side-copy category-side-copy-two">
          <span>06 / 06</span>
          <span>HOODED</span>
          <span>SYSTEM</span>
        </div>

        <div className="category-visual-arrow">
          <ArrowRight size={25} strokeWidth={1} />
        </div>

        <span className="category-coordinate top">AX / HD / 006</span>

        <span className="category-coordinate bottom">LAYER STUDY / 2026</span>
      </div>
    );
  }

  if (type === "jeans") {
  return (
    <div className="category-visual category-visual-jeans">
      <svg
        className="category-jeans-svg"
        viewBox="0 0 700 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* MAIN BAGGY JEANS SHAPE */}

        <path
          d="
            M285 60
            L415 60
            L430 120
            L450 350
            L380 350
            L350 205
            L320 350
            L250 350
            L270 120
            Z
          "
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.38"
        />

        {/* WAIST */}

        <path
          d="M285 60H415"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.4"
        />

        <path
          d="M280 85H420"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.18"
        />

        {/* BELT LOOPS */}

        <path
          d="M310 60V88"
          stroke="currentColor"
          opacity="0.32"
        />

        <path
          d="M350 60V88"
          stroke="currentColor"
          opacity="0.32"
        />

        <path
          d="M390 60V88"
          stroke="currentColor"
          opacity="0.32"
        />

        {/* CENTER */}

        <path
          d="M350 85V205"
          stroke="currentColor"
          opacity="0.22"
        />

        {/* POCKETS */}

        <path
          d="M292 105C315 100 330 110 340 130"
          stroke="currentColor"
          opacity="0.32"
        />

        <path
          d="M408 105C385 100 370 110 360 130"
          stroke="currentColor"
          opacity="0.32"
        />

        {/* BAGGY LEG FOLD LINES */}

        <path
          d="M275 185C295 175 315 180 330 195"
          stroke="currentColor"
          opacity="0.13"
        />

        <path
          d="M425 185C405 175 385 180 370 195"
          stroke="currentColor"
          opacity="0.13"
        />

        <path
          d="M265 245C290 235 315 240 330 255"
          stroke="currentColor"
          opacity="0.12"
        />

        <path
          d="M435 245C410 235 385 240 370 255"
          stroke="currentColor"
          opacity="0.12"
        />

        {/* HEMS */}

        <path
          d="M250 330H320"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M380 330H450"
          stroke="currentColor"
          opacity="0.25"
        />

        {/* CENTER TECH CIRCLE */}

        <circle
          cx="350"
          cy="210"
          r="82"
          stroke="currentColor"
          opacity="0.11"
        />

        <circle
          cx="350"
          cy="210"
          r="5"
          fill="currentColor"
        />

        {/* LEFT TECH LINE */}

        <path
          d="M165 70H235"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M165 70V120"
          stroke="currentColor"
          opacity="0.25"
        />

        {/* RIGHT TECH LINE */}

        <path
          d="M465 340H550"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M550 290V340"
          stroke="currentColor"
          opacity="0.25"
        />
      </svg>

      <div className="category-side-copy category-side-copy-one">
        <span>DENIM</span>
        <span>BAGGY</span>
        <span>STRUCTURE</span>
      </div>

      <div className="category-side-copy category-side-copy-two">
        <span>02 / 06</span>
        <span>RELAXED</span>
        <span>DENIM SYSTEM</span>
      </div>

      <div className="category-visual-arrow">
        <ArrowRight size={25} strokeWidth={1} />
      </div>

      <span className="category-coordinate top">
        AX / JN / 002
      </span>

      <span className="category-coordinate bottom">
        DENIM STUDY / 2026
      </span>
    </div>
  );
}
if (type === "trackpants") {
  return (
    <div className="category-visual category-visual-trackpants">
      <svg
        className="category-trackpants-svg"
        viewBox="0 0 760 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* BACKGROUND TECH RINGS */}

        <circle
          cx="390"
          cy="220"
          r="145"
          stroke="currentColor"
          opacity="0.08"
        />

        <circle
          cx="390"
          cy="220"
          r="105"
          stroke="currentColor"
          opacity="0.05"
          strokeDasharray="5 8"
        />

        <circle
          cx="390"
          cy="220"
          r="66"
          stroke="currentColor"
          opacity="0.04"
        />

        {/* MOTION ARCS */}

        <path
          d="M235 170C300 100 480 80 555 165"
          stroke="currentColor"
          opacity="0.08"
        />

        <path
          d="M225 260C300 335 500 350 565 250"
          stroke="currentColor"
          opacity="0.06"
        />

        {/* =================================================
            MAIN RELAXED TRACK PANTS
        ================================================= */}

        <path
          d="
            M320 58
            C352 50 407 50 440 58

            L450 90

            C460 120 468 158 468 195

            L476 334

            C454 350 427 355 400 346

            L384 230

            L380 205

            L376 230

            L360 346

            C333 355 306 350 284 334

            L292 195

            C292 158 300 120 310 90

            Z
          "
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.52"
        />

        {/* =================================================
            ELASTIC WAIST
        ================================================= */}

        <path
          d="M320 58C350 67 410 67 440 58"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.58"
        />

        <path
          d="M314 85C350 94 410 94 446 85"
          stroke="currentColor"
          opacity="0.3"
        />

        {/* WAIST RIBS */}

        {[330, 348, 366, 384, 402, 420].map((x) => (
          <line
            key={x}
            x1={x}
            y1="62"
            x2={x - 2}
            y2="88"
            stroke="currentColor"
            opacity="0.17"
          />
        ))}

        {/* =================================================
            DRAWSTRINGS
        ================================================= */}

        <path
          d="M370 87C368 110 362 130 356 151"
          stroke="currentColor"
          opacity="0.62"
        />

        <path
          d="M390 87C392 110 398 130 404 151"
          stroke="currentColor"
          opacity="0.62"
        />

        <circle cx="356" cy="154" r="3" fill="currentColor" />

        <circle cx="404" cy="154" r="3" fill="currentColor" />

        {/* =================================================
            ZIP POCKET LEFT
        ================================================= */}

        <path
          d="M316 118L350 144"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.48"
        />

        <path
          d="M320 123L346 143"
          stroke="currentColor"
          opacity="0.18"
          strokeDasharray="3 4"
        />

        <circle
          cx="315"
          cy="117"
          r="2.5"
          fill="currentColor"
          opacity="0.75"
        />

        {/* =================================================
            POCKET RIGHT
        ================================================= */}

        <path
          d="M444 118C425 116 412 126 405 144"
          stroke="currentColor"
          opacity="0.38"
        />

        {/* =================================================
            SIDE SPORT PANELS
        ================================================= */}

        <path
          d="M310 102L298 318"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.3"
        />

        <path
          d="M450 102L462 318"
          stroke="currentColor"
          strokeWidth="1.3"
          opacity="0.3"
        />

        <path
          d="M318 104L309 310"
          stroke="currentColor"
          opacity="0.08"
        />

        <path
          d="M442 104L451 310"
          stroke="currentColor"
          opacity="0.08"
        />

        {/* =================================================
            KNEE ARTICULATION
        ================================================= */}

        <path
          d="M296 222C320 212 341 215 358 228"
          stroke="currentColor"
          opacity="0.2"
        />

        <path
          d="M402 228C419 215 440 212 464 222"
          stroke="currentColor"
          opacity="0.2"
        />

        <path
          d="M298 237C320 229 341 232 356 243"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M404 243C419 232 440 229 462 237"
          stroke="currentColor"
          opacity="0.09"
        />

        {/* TECH KNEE LINE */}

        <line
          x1="296"
          y1="260"
          x2="356"
          y2="260"
          stroke="currentColor"
          opacity="0.13"
          strokeDasharray="4 6"
        />

        <line
          x1="404"
          y1="260"
          x2="464"
          y2="260"
          stroke="currentColor"
          opacity="0.13"
          strokeDasharray="4 6"
        />

        {/* =================================================
            FABRIC FLOW
        ================================================= */}

        <path
          d="M302 175C325 165 344 170 359 186"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M458 175C435 165 416 170 401 186"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M292 290C316 281 336 285 349 296"
          stroke="currentColor"
          opacity="0.1"
        />

        <path
          d="M468 290C444 281 424 285 411 296"
          stroke="currentColor"
          opacity="0.1"
        />

        {/* =================================================
            ANKLE CUFFS
        ================================================= */}

        <path
          d="M284 320C306 331 332 333 359 324"
          stroke="currentColor"
          strokeWidth="1.8"
          opacity="0.5"
        />

        <path
          d="M401 324C428 333 454 331 476 320"
          stroke="currentColor"
          strokeWidth="1.8"
          opacity="0.5"
        />

        <path
          d="M285 328C306 339 334 341 360 332"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M400 332C426 341 454 339 475 328"
          stroke="currentColor"
          opacity="0.25"
        />

        {/* =================================================
            MEASUREMENT SYSTEM
        ================================================= */}

        <line
          x1="250"
          y1="65"
          x2="250"
          y2="340"
          stroke="currentColor"
          opacity="0.16"
        />

        <line
          x1="237"
          y1="65"
          x2="263"
          y2="65"
          stroke="currentColor"
          opacity="0.24"
        />

        <line
          x1="237"
          y1="340"
          x2="263"
          y2="340"
          stroke="currentColor"
          opacity="0.24"
        />

        <text
          x="232"
          y="240"
          fill="currentColor"
          fillOpacity="0.35"
          fontSize="8"
          letterSpacing="3"
          transform="rotate(-90 232 240)"
        >
          MOTION LENGTH
        </text>

        {/* =================================================
            CENTER TARGET
        ================================================= */}

        <circle
          cx="380"
          cy="205"
          r="5"
          fill="currentColor"
        />

        <line
          x1="350"
          y1="205"
          x2="410"
          y2="205"
          stroke="currentColor"
          opacity="0.12"
        />

        <line
          x1="380"
          y1="175"
          x2="380"
          y2="235"
          stroke="currentColor"
          opacity="0.12"
        />

        {/* =================================================
            LEFT DATA
        ================================================= */}

        <path
          d="M160 95H220"
          stroke="currentColor"
          opacity="0.28"
        />

        <path
          d="M160 95V140"
          stroke="currentColor"
          opacity="0.28"
        />

        <text
          x="160"
          y="162"
          fill="currentColor"
          fillOpacity="0.4"
          fontSize="8"
          letterSpacing="2"
        >
          AX / MOTION 003
        </text>

        <text
          x="160"
          y="182"
          fill="currentColor"
          fillOpacity="0.22"
          fontSize="7"
          letterSpacing="2"
        >
          RELAXED FIT
        </text>

        {/* =================================================
            RIGHT DATA
        ================================================= */}

        <path
          d="M510 305H570"
          stroke="currentColor"
          opacity="0.28"
        />

        <path
          d="M570 265V305"
          stroke="currentColor"
          opacity="0.28"
        />

        <text
          x="515"
          y="332"
          fill="currentColor"
          fillOpacity="0.36"
          fontSize="8"
          letterSpacing="2"
        >
          ACTIVE / 03
        </text>

        <text
          x="515"
          y="350"
          fill="currentColor"
          fillOpacity="0.2"
          fontSize="7"
          letterSpacing="2"
        >
          FLEX SYSTEM
        </text>
      </svg>

      <div className="category-side-copy category-side-copy-one">
        <span>MOTION</span>
        <span>UTILITY</span>
        <span>FLEX</span>
      </div>

      <div className="category-side-copy category-side-copy-two">
        <span>03 / 06</span>
        <span>RELAXED</span>
        <span>MOTION SYSTEM</span>
      </div>

      <div className="category-visual-arrow">
        <ArrowRight size={25} strokeWidth={1} />
      </div>

      <span className="category-coordinate top">
        AX / TR / 003
      </span>

      <span className="category-coordinate bottom">
        MOTION STUDY / 2026
      </span>
    </div>
  );
}
/* =======================================================
   SHORTS VISUAL
======================================================= */

if (type === "shorts") {
  return (
    <div className="category-visual category-visual-shorts">
      <svg
        className="category-shorts-svg"
        viewBox="0 0 700 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="350"
          cy="210"
          r="86"
          stroke="currentColor"
          opacity="0.1"
        />

        <path
          d="
            M290 75
            L410 75
            L420 115
            L435 285
            C410 294 385 292 365 280
            L350 210
            L335 280
            C315 292 290 294 265 285
            L280 115
            Z
          "
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.46"
        />

        <path
          d="M290 75H410"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.52"
        />

        <path
          d="M284 102H416"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M300 123C318 119 333 126 341 143"
          stroke="currentColor"
          opacity="0.38"
        />

        <path
          d="M400 123C382 119 367 126 359 143"
          stroke="currentColor"
          opacity="0.38"
        />

        <rect
          x="278"
          y="158"
          width="50"
          height="72"
          stroke="currentColor"
          opacity="0.18"
        />

        <rect
          x="372"
          y="158"
          width="50"
          height="72"
          stroke="currentColor"
          opacity="0.18"
        />

        <path
          d="M287 175H319"
          stroke="currentColor"
          opacity="0.3"
          strokeDasharray="4 5"
        />

        <path
          d="M381 175H413"
          stroke="currentColor"
          opacity="0.3"
          strokeDasharray="4 5"
        />

        <path
          d="M165 70H235"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M165 70V120"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M465 340H550"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M550 290V340"
          stroke="currentColor"
          opacity="0.25"
        />

        <circle cx="350" cy="210" r="5" fill="currentColor" />
      </svg>

      <div className="category-side-copy category-side-copy-one">
        <span>UTILITY</span>
        <span>MOTION</span>
        <span>LIGHT</span>
      </div>

      <div className="category-side-copy category-side-copy-two">
        <span>05 / 08</span>
        <span>REDUCED</span>
        <span>SHORT SYSTEM</span>
      </div>

      <div className="category-visual-arrow">
        <ArrowRight size={25} strokeWidth={1} />
      </div>

      <span className="category-coordinate top">AX / ST / 005</span>
      <span className="category-coordinate bottom">UTILITY STUDY / 2026</span>
    </div>
  );
}


/* =======================================================
   JACKETS VISUAL
======================================================= */

if (type === "jackets") {
  return (
    <div className="category-visual category-visual-jackets">
      <svg
        className="category-jackets-svg"
        viewBox="0 0 700 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="350"
          cy="210"
          r="100"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="
            M315 65
            L350 45
            L385 65
            L445 95
            L475 195
            L438 210
            L420 160
            L420 340
            L280 340
            L280 160
            L262 210
            L225 195
            L255 95
            Z
          "
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.48"
        />

        <path
          d="M315 65L350 115L385 65"
          stroke="currentColor"
          opacity="0.34"
        />

        <path
          d="M350 115V340"
          stroke="currentColor"
          opacity="0.32"
        />

        <path
          d="M300 165H340V215H300Z"
          stroke="currentColor"
          opacity="0.18"
        />

        <path
          d="M360 165H400V215H360Z"
          stroke="currentColor"
          opacity="0.18"
        />

        <path
          d="M300 230L325 250"
          stroke="currentColor"
          opacity="0.18"
        />

        <path
          d="M400 230L375 250"
          stroke="currentColor"
          opacity="0.18"
        />

        <path
          d="M165 70H235"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M165 70V120"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M465 340H550"
          stroke="currentColor"
          opacity="0.25"
        />

        <path
          d="M550 290V340"
          stroke="currentColor"
          opacity="0.25"
        />

        <circle cx="350" cy="210" r="5" fill="currentColor" />
      </svg>

      <div className="category-side-copy category-side-copy-one">
        <span>OUTER</span>
        <span>PROTECT</span>
        <span>LAYER</span>
      </div>

      <div className="category-side-copy category-side-copy-two">
        <span>07 / 08</span>
        <span>STRUCTURED</span>
        <span>JACKET SYSTEM</span>
      </div>

      <div className="category-visual-arrow">
        <ArrowRight size={25} strokeWidth={1} />
      </div>

      <span className="category-coordinate top">AX / JK / 007</span>
      <span className="category-coordinate bottom">OUTER STUDY / 2026</span>
    </div>
  );
}


/* =======================================================
   CO-ORD SETS VISUAL
======================================================= */
if (type === "coordsets") {
  return (
    <div className="category-visual category-visual-coordsets">
      <svg
        className="category-coordsets-svg"
        viewBox="0 0 760 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* BACKGROUND TECH CIRCLES */}

        <circle
          cx="390"
          cy="225"
          r="155"
          stroke="currentColor"
          opacity="0.08"
        />

        <circle
          cx="390"
          cy="225"
          r="112"
          stroke="currentColor"
          opacity="0.05"
          strokeDasharray="5 8"
        />

        {/* =================================================
            OVERSIZED CO-ORD TOP
        ================================================= */}

        <path
          d="
            M315 72
            C330 62 345 58 360 56
            C375 60 390 62 405 72

            L470 100
            L490 145

            L450 170
            L425 138

            L428 245

            C402 255 322 255 292 244

            L295 138
            L270 170
            L230 145
            L250 100

            Z
          "
          stroke="currentColor"
          strokeWidth="1.7"
          opacity="0.52"
        />

        {/* ROUND NECK */}

        <path
          d="
            M338 62
            C343 84 377 84 382 62
          "
          stroke="currentColor"
          opacity="0.38"
        />

        {/* SHOULDER SEAMS */}

        <path
          d="M315 72L350 95"
          stroke="currentColor"
          opacity="0.16"
        />

        <path
          d="M405 72L370 95"
          stroke="currentColor"
          opacity="0.16"
        />

        {/* HORIZONTAL STRIPE DETAIL */}

        <path
          d="M286 132C325 144 394 144 439 132"
          stroke="currentColor"
          opacity="0.24"
        />

        <path
          d="M287 146C327 158 394 158 438 146"
          stroke="currentColor"
          opacity="0.12"
        />

        {/* LOOSE FABRIC FOLDS */}

        <path
          d="M300 175C322 166 340 168 356 180"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M420 175C398 166 380 168 364 180"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M310 210C330 202 345 204 358 214"
          stroke="currentColor"
          opacity="0.08"
        />

        <path
          d="M410 210C390 202 375 204 362 214"
          stroke="currentColor"
          opacity="0.08"
        />

        {/* =================================================
            WIDE RELAXED PANTS
        ================================================= */}

        <path
          d="
            M305 260
            C330 254 390 254 415 260

            L428 292

            L455 405

            C435 414 405 414 382 407

            L360 315

            L338 407

            C315 414 285 414 265 405

            L292 292

            Z
          "
          stroke="currentColor"
          strokeWidth="1.7"
          opacity="0.52"
        />

        {/* WAISTBAND */}

        <path
          d="M305 260C335 268 385 268 415 260"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.42"
        />

        <path
          d="M300 281C335 290 385 290 420 281"
          stroke="currentColor"
          opacity="0.24"
        />

        {/* PANTS SIDE STRIPES */}

        <path
          d="M296 286L273 395"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.28"
        />

        <path
          d="M424 286L447 395"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.28"
        />

        <path
          d="M305 287L284 398"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M415 287L436 398"
          stroke="currentColor"
          opacity="0.09"
        />

        {/* POCKETS */}

        <path
          d="M314 296C329 292 341 299 348 312"
          stroke="currentColor"
          opacity="0.32"
        />

        <path
          d="M406 296C391 292 379 299 372 312"
          stroke="currentColor"
          opacity="0.32"
        />

        {/* WIDE LEG FOLDS */}

        <path
          d="M282 335C305 326 323 330 337 342"
          stroke="currentColor"
          opacity="0.1"
        />

        <path
          d="M438 335C415 326 397 330 383 342"
          stroke="currentColor"
          opacity="0.1"
        />

        <path
          d="M274 372C299 364 319 368 333 380"
          stroke="currentColor"
          opacity="0.09"
        />

        <path
          d="M446 372C421 364 401 368 387 380"
          stroke="currentColor"
          opacity="0.09"
        />

        {/* =================================================
            SYNC CONNECTOR
        ================================================= */}

        <line
          x1="360"
          y1="245"
          x2="360"
          y2="260"
          stroke="currentColor"
          opacity="0.42"
          strokeDasharray="3 5"
        />

        <circle
          cx="360"
          cy="252"
          r="4"
          fill="currentColor"
          opacity="0.85"
        />

        {/* =================================================
            CENTER TARGET
        ================================================= */}

        <circle
          cx="360"
          cy="225"
          r="5"
          fill="currentColor"
        />

        <line
          x1="325"
          y1="225"
          x2="395"
          y2="225"
          stroke="currentColor"
          opacity="0.1"
        />

        <line
          x1="360"
          y1="190"
          x2="360"
          y2="260"
          stroke="currentColor"
          opacity="0.1"
        />

        {/* =================================================
            LEFT TECH DETAILS
        ================================================= */}

        <path
          d="M145 90H215"
          stroke="currentColor"
          opacity="0.27"
        />

        <path
          d="M145 90V140"
          stroke="currentColor"
          opacity="0.27"
        />

        <text
          x="145"
          y="166"
          fill="currentColor"
          fillOpacity="0.42"
          fontSize="8"
          letterSpacing="2"
        >
          MATCHED FORM
        </text>

        <text
          x="145"
          y="188"
          fill="currentColor"
          fillOpacity="0.22"
          fontSize="7"
          letterSpacing="2"
        >
          OVERSIZED / RELAXED
        </text>

        {/* =================================================
            RIGHT TECH DETAILS
        ================================================= */}

        <path
          d="M500 318H570"
          stroke="currentColor"
          opacity="0.27"
        />

        <path
          d="M570 272V318"
          stroke="currentColor"
          opacity="0.27"
        />

        <text
          x="500"
          y="345"
          fill="currentColor"
          fillOpacity="0.42"
          fontSize="8"
          letterSpacing="2"
        >
          SYNC / 08
        </text>

        <text
          x="500"
          y="366"
          fill="currentColor"
          fillOpacity="0.22"
          fontSize="7"
          letterSpacing="2"
        >
          WIDE FIT SYSTEM
        </text>
      </svg>

      <div className="category-side-copy category-side-copy-one">
        <span>SYNC</span>
        <span>OVERSIZED</span>
        <span>RELAXED</span>
      </div>

      <div className="category-side-copy category-side-copy-two">
        <span>08 / 08</span>
        <span>WIDE FIT</span>
        <span>CO-ORD SYSTEM</span>
      </div>

      <div className="category-visual-arrow">
        <ArrowRight size={25} strokeWidth={1} />
      </div>

      <span className="category-coordinate top">
        AX / CO / 008
      </span>

      <span className="category-coordinate bottom">
        MATCHED SET STUDY / 2026
      </span>
    </div>
  );
}

  

  /* =======================================================
     DEFAULT VISUAL
  ======================================================= */

  return (
    <div className="category-visual">
      <svg
        className="category-orbit-svg"
        viewBox="0 0 700 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="390"
          cy="210"
          r="135"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.18"
        />

        <circle
          cx="390"
          cy="210"
          r="88"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.1"
        />

        <ellipse
          cx="390"
          cy="210"
          rx="240"
          ry="72"
          transform="rotate(-17 390 210)"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        <ellipse
          cx="390"
          cy="210"
          rx="185"
          ry="45"
          transform="rotate(24 390 210)"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.14"
        />

        <circle cx="519" cy="163" r="5" fill="currentColor" />
      </svg>
    </div>
  );
}

/* =========================================================
   CATEGORY PAGE
========================================================= */

function CategoryPage({
  category,
  title,
  subtitle,
  description,
  visualType = "default",
}) {
  const navigate = useNavigate();

  const [sort, setSort] = useState("featured");

  const [search, setSearch] = useState("");

  const [selectedSizes, setSelectedSizes] = useState({});

  /* =======================================================
     QUICK SEARCH FOR EVERY CATEGORY
  ======================================================= */

  const quickSearchOptions = {
    "T-SHIRTS": ["WHITE", "BLACK", "RED", "OVERSIZED", "GRAPHIC"],

    SHIRTS: ["WHITE", "BLACK", "BLUE", "OVERSIZED", "FORMAL"],

    HOODIES: ["WHITE", "BLACK", "RED", "GREY", "OVERSIZED"],

    JEANS: ["BLACK", "BLUE", "GREY", "BAGGY", "STRAIGHT"],

    "TRACK PANTS": ["BLACK", "GREY", "WHITE", "BAGGY", "RELAXED"],

    SHORTS: ["BLACK", "GREY", "CARGO", "OVERSIZED", "UTILITY"],
  };

  const quickSearch = quickSearchOptions[category] || ["BLACK", "WHITE", "NEW"];

  /* =======================================================
     SEARCH PLACEHOLDER
  ======================================================= */

  const getSearchPlaceholder = () => {
    if (category === "T-SHIRTS") {
      return "SEARCH WHITE T-SHIRT, BLACK T-SHIRT, OVERSIZED...";
    }

    if (category === "SHIRTS") {
      return "SEARCH WHITE SHIRT, BLACK SHIRT, BLUE...";
    }

    if (category === "HOODIES") {
      return "SEARCH WHITE HOODIE, RED HOODIE, BLACK...";
    }

    if (category === "JEANS") {
      return "SEARCH BLACK JEANS, BLUE JEANS, BAGGY...";
    }

    if (category === "TRACK PANTS") {
      return "SEARCH BLACK TRACK PANTS, GREY, BAGGY...";
    }

    if (category === "SHORTS") {
      return "SEARCH BLACK SHORTS, CARGO, UTILITY...";
    }

    return `SEARCH ${title}...`;
  };

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const categoryProducts = useMemo(() => {
    let result = products.filter((product) => product.category === category);

    /* SEARCH */

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      const searchWords = searchValue.split(/\s+/);

      result = result.filter((product) => {
        const searchableText = [
          product.name,
          product.category,
          product.color,
          product.fit,
          product.style,
          product.tag,
          product.description,

          ...(product.colors || []),
          ...(product.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchWords.every((word) => searchableText.includes(word));
      });
    }

    /* IMPORTANT:
       Copy array before sort
    */

    result = [...result];

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [category, sort, search]);

  /* =======================================================
     TOTAL CATEGORY PRODUCTS
  ======================================================= */

  const totalCategoryProducts = useMemo(() => {
    return products.filter((product) => product.category === category).length;
  }, [category]);

  /* =======================================================
     SELECT SIZE
  ======================================================= */

  const selectSize = (productId, size) => {
    setSelectedSizes((previous) => ({
      ...previous,

      [productId]: size,
    }));
  };

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = (product) => {
    const size = selectedSizes[product.id];

    if (!size) {
      alert("Please select a size first.");

      return;
    }

    const cart = JSON.parse(localStorage.getItem("axiee-cart")) || [];

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.size === size,
    );

    if (existingIndex !== -1) {
      cart[existingIndex].quantity =
        Number(cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({
        ...product,

        size,

        quantity: 1,
      });
    }

    localStorage.setItem("axiee-cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("axiee-cart-updated"));
  };

  /* =======================================================
     BUY NOW
  ======================================================= */

  const buyNow = (product) => {
    const size = selectedSizes[product.id];

    if (!size) {
      alert("Please select a size first.");

      return;
    }

    const checkoutProduct = {
      ...product,

      size,

      quantity: 1,
    };

    localStorage.setItem("axiee-buy-now", JSON.stringify(checkoutProduct));

    navigate("/checkout");
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="shop-page">
      {/* ===================================================
          CATEGORY HERO
      =================================================== */}

      <section className="category-text-hero">
        <div className="category-grid-bg" />

        <div className="category-glow category-glow-one" />

        <div className="category-glow category-glow-two" />

        <div className="category-text-content">
          <span className="category-breadcrumb">HOME / SHOP / {title}</span>

          <div className="category-title-row">
            <h1>{title}</h1>

            <span className="category-product-number">
              ({totalCategoryProducts})
            </span>
          </div>

          <h2>{subtitle}</h2>

          <p>{description}</p>
        </div>

        <CategoryVisual type={visualType} />

        <div className="category-hero-bottom">
          <span>AXIEE / CATEGORY</span>

          <span>FORM FOLLOWS MOVEMENT</span>
        </div>
      </section>

      {/* ===================================================
          PRODUCTS
      =================================================== */}

      <section className="shop-products-section">
        {/* =================================================
            PRODUCTS TOOLBAR
        ================================================= */}

        <div className="shop-products-toolbar">
          <div className="shop-products-count">
            <SlidersHorizontal size={15} />

            <span>{categoryProducts.length} PRODUCTS</span>
          </div>

          <div className="shop-sort">
            <span>SORT BY:</span>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">FEATURED</option>

              <option value="low">PRICE: LOW TO HIGH</option>

              <option value="high">PRICE: HIGH TO LOW</option>

              <option value="name">NAME</option>
            </select>
          </div>
        </div>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <div className="category-global-search">
          <div className="category-global-search-top">
            <span>01 / SEARCH</span>

            <small>FIND YOUR STYLE</small>
          </div>

          <div className="category-global-search-box">
            <Search
              size={20}
              strokeWidth={1.3}
              className="category-global-search-icon"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={getSearchPlaceholder()}
              aria-label={`Search ${title}`}
            />

            {search && (
              <button
                type="button"
                className="category-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={13} strokeWidth={1.4} />

                <span>CLEAR</span>
              </button>
            )}
          </div>

          {/* ===============================================
              QUICK SEARCH
          =============================================== */}

          <div className="category-quick-search">
            <span className="category-quick-title">QUICK SEARCH</span>

            {quickSearch.map((option) => (
              <button
                type="button"
                key={option}
                className={
                  search.toLowerCase() === option.toLowerCase() ? "active" : ""
                }
                onClick={() => setSearch(option.toLowerCase())}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        <div className="shop-product-grid">
          {/* ===============================================
              NO RESULTS
          =============================================== */}

          {categoryProducts.length === 0 && (
            <div className="category-no-results">
              <span>NO RESULTS</span>

              <h3>
                NOTHING FOUND
                <br />
                FOR "{search}"
              </h3>

              <p>TRY ANOTHER COLOUR, STYLE OR PRODUCT NAME</p>

              <button type="button" onClick={() => setSearch("")}>
                CLEAR SEARCH
              </button>
            </div>
          )}

          {/* ===============================================
              PRODUCTS
          =============================================== */}

          {categoryProducts.map((product) => (
            <article className="shop-product-card" key={product.id}>
              {/* IMAGE */}

              <Link
                to={`/product/${product.id}`}
                className="shop-product-image-box"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="shop-product-image"
                />

                {product.tag && (
                  <span className="shop-new-tag">{product.tag}</span>
                )}

                <button
                  type="button"
                  className="shop-heart"
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                  aria-label={`Add ${product.name} to wishlist`}
                >
                  <Heart size={16} strokeWidth={1.5} />
                </button>

                <div className="shop-image-fog" />
              </Link>

              {/* CONTENT */}

              <div className="shop-product-content">
                <div className="shop-product-name-row">
                  <div>
                    <h3>{product.name}</h3>

                    <p>₹{product.price.toLocaleString("en-IN")}</p>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="shop-product-arrow"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* PRODUCT COLOUR */}

                {product.color && (
                  <div className="category-product-meta">
                    <span>COLOUR</span>

                    <strong>{product.color}</strong>
                  </div>
                )}

                {/* SIZES */}

                <div className="shop-size-list">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={
                        selectedSizes[product.id] === size
                          ? "shop-size active"
                          : "shop-size"
                      }
                      onClick={() => selectSize(product.id, size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* BUTTONS */}

                <div className="shop-product-actions">
                  <button
                    type="button"
                    className="shop-add-cart"
                    onClick={() => addToCart(product)}
                  >
                    ADD TO CART
                  </button>

                  <button
                    type="button"
                    className="shop-buy-now"
                    onClick={() => buyNow(product)}
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default CategoryPage;
