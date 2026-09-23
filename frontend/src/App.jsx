import { useEffect } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Lenis from "lenis";
import gsap from "gsap";

/* =========================================================
   COMPONENTS
========================================================= */

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransition";
import ScrollToTop from "./components/ScrollToTop";
import Payment from "./components/Payment";
import CustomCursor from "./components/CustomCursor";

/* =========================================================
   PUBLIC PAGES
========================================================= */

import Home from "./pages/Home";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import HallOfFame from "./pages/Halloffam";
import Artists from "./pages/Artists";
import Enter from "./pages/Enter";
import Upload from "./pages/Upload";
import TOP from "./pages/TOP";
import Upcoming from "./pages/Upcomeing";
import BookArtist from "./pages/BookArtist";
import ClientLogin from "./pages/ClientLogin";
import Sponsors from "./pages/Sponsors";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import Terms from "./pages/Terms";

/* =========================================================
   ADMIN PAGES
========================================================= */

import Dashboard from "./admin/Dashboard";
import Clients from "./admin/Clients";
import AdminStalls from "./admin/AdminStalls";
import AdminArtists from "./admin/Adminartists";
import AdminLogin from "./admin/Login";
import ArtistBookings from "./admin/ArtistBookings";

// import WhatsAppCampaigns from "./admin/WhatsAppCampaigns";

/* =========================================================
   STYLES
========================================================= */

import "./Style/SmoothScroll.css";
import "./Style/BarbaTransitions.css";
import "./Style/PageTransition.css";

/* =========================================================
   LAYOUT
========================================================= */

function Layout() {
  const location = useLocation();

  /* =======================================================
     HIDE PUBLIC WEBSITE UI ON ADMIN PAGES
  ======================================================= */

  const isAdminPage =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin");

  return (
    <>
      {/* ===================================================
          AWWWARDS CUSTOM CURSOR

          Only show on public website.
          Admin dashboard keeps normal cursor.
      =================================================== */}

      {!isAdminPage && <CustomCursor />}

      <div
        className="
          min-h-screen
          bg-[#08080a]
          text-white
          flex
          flex-col
          justify-between
          selection:bg-[#a855f7]
          selection:text-white
        "
      >
        {/* ===================================================
            PUBLIC NAVBAR
        =================================================== */}

        {!isAdminPage && <Navbar />}

        {/* ===================================================
            ROUTES
        =================================================== */}

        <div className="flex-grow w-full">
          <Routes location={location} key={location.pathname}>
            {/* =================================================
                HOME
            ================================================= */}

            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />

            {/* =================================================
                TERMS
            ================================================= */}

            <Route
              path="/terms"
              element={
                <PageTransition>
                  <Terms />
                </PageTransition>
              }
            />

            {/* =================================================
                ABOUT
            ================================================= */}

            <Route
              path="/about"
              element={
                <PageTransition>
                  <About />
                </PageTransition>
              }
            />

            {/* =================================================
                GALLERY
            ================================================= */}

            <Route
              path="/gallery"
              element={
                <PageTransition>
                  <Gallery />
                </PageTransition>
              }
            />

            {/* =================================================
                SERVICES
            ================================================= */}

            <Route
              path="/services"
              element={
                <PageTransition>
                  <Gallery />
                </PageTransition>
              }
            />

            {/* =================================================
                HALL OF FAME
            ================================================= */}

            <Route
              path="/hall-of-fame"
              element={
                <PageTransition>
                  <HallOfFame />
                </PageTransition>
              }
            />

            {/* =================================================
                ARTISTS
            ================================================= */}

            <Route
              path="/artists"
              element={
                <PageTransition>
                  <Artists />
                </PageTransition>
              }
            />

            {/* =================================================
                ARTIST CLAIM / UPDATE
            ================================================= */}

            <Route
              path="/Enter"
              element={
                <PageTransition>
                  <Enter />
                </PageTransition>
              }
            />

            <Route
              path="/enter"
              element={
                <PageTransition>
                  <Enter />
                </PageTransition>
              }
            />

            {/* =================================================
                TOP
            ================================================= */}

            <Route
              path="/top"
              element={
                <PageTransition>
                  <TOP />
                </PageTransition>
              }
            />

            {/* =================================================
                UPCOMING EVENTS
            ================================================= */}

            <Route
              path="/upcoming"
              element={
                <PageTransition>
                  <Upcoming />
                </PageTransition>
              }
            />

            {/* =================================================
                STALL BOOKING
            ================================================= */}

            <Route
              path="/stall-booking"
              element={
                <PageTransition>
                  <ClientLogin />
                </PageTransition>
              }
            />

            {/* =================================================
                CONTACT
            ================================================= */}

            <Route
              path="/contact"
              element={
                <PageTransition>
                  <About />
                </PageTransition>
              }
            />

            {/* =================================================
                COMPETITION
            ================================================= */}

            <Route
              path="/competition"
              element={
                <PageTransition>
                  <Upload />
                </PageTransition>
              }
            />

            {/* =================================================
                OLD UPLOAD ROUTES
            ================================================= */}

            <Route
              path="/Upload"
              element={
                <PageTransition>
                  <Upload />
                </PageTransition>
              }
            />

            <Route
              path="/upload"
              element={
                <PageTransition>
                  <Upload />
                </PageTransition>
              }
            />

            {/* =================================================
                PAYMENT
            ================================================= */}

            <Route
              path="/payment"
              element={
                <PageTransition>
                  <Payment />
                </PageTransition>
              }
            />

            {/* =================================================
                BOOK ARTIST
            ================================================= */}

            <Route
              path="/book-artist"
              element={
                <PageTransition>
                  <BookArtist />
                </PageTransition>
              }
            />

            {/* =================================================
                PRIVACY POLICY
            ================================================= */}

            <Route
              path="/privacy-policy"
              element={
                <PageTransition>
                  <PrivacyPolicy />
                </PageTransition>
              }
            />

            {/* =================================================
                DATA DELETION
            ================================================= */}

            <Route
              path="/data-deletion"
              element={
                <PageTransition>
                  <DataDeletion />
                </PageTransition>
              }
            />

            {/* =================================================
                SPONSORS
            ================================================= */}

            <Route
              path="/sponsors"
              element={
                <PageTransition>
                  <Sponsors />
                </PageTransition>
              }
            />

            {/* =================================================
                ADMIN ROOT

                /admin
                  ↓
                /admin/dashboard
            ================================================= */}

            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* =================================================
                ADMIN LOGIN
            ================================================= */}

            <Route path="/admin/login" element={<AdminLogin />} />

            {/* =================================================
                OLD DASHBOARD URL
            ================================================= */}

            <Route
              path="/dashboard"
              element={<Navigate to="/admin/dashboard" replace />}
            />

            {/* =================================================
                ADMIN DASHBOARD
            ================================================= */}

            <Route
              path="/admin/dashboard"
              element={
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              }
            />

            {/* =================================================
                ADMIN CLIENTS
            ================================================= */}

            <Route
              path="/admin/clients"
              element={
                <PageTransition>
                  <Clients />
                </PageTransition>
              }
            />

            {/* =================================================
                ADMIN STALLS
            ================================================= */}

            <Route
              path="/admin/stalls"
              element={
                <PageTransition>
                  <AdminStalls />
                </PageTransition>
              }
            />

            {/* =================================================
                ADMIN ARTISTS
            ================================================= */}

            <Route
              path="/admin/artists"
              element={
                <PageTransition>
                  <AdminArtists />
                </PageTransition>
              }
            />

            {/* =================================================
                ADMIN ARTIST BOOKINGS
            ================================================= */}

            <Route
              path="/admin/artist-bookings"
              element={
                <PageTransition>
                  <ArtistBookings />
                </PageTransition>
              }
            />

            {/* =================================================
                WHATSAPP ADMIN

                Keep disabled until page is ready.
            ================================================= */}

            {/*
            <Route
              path="/admin/whatsapp-campaigns"
              element={<WhatsAppCampaigns />}
            />
            */}

            {/* =================================================
                404
            ================================================= */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        {/* ===================================================
            PUBLIC FOOTER
        =================================================== */}

        {!isAdminPage && <Footer />}
      </div>
    </>
  );
}

/* =========================================================
   404 PAGE
========================================================= */

function NotFound() {
  return (
    <div
      className="
        min-h-[75vh]
        bg-[#08080a]
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-5
      "
    >
      <p
        className="
          text-purple-500
          font-black
          text-sm
          tracking-[0.3em]
          mb-4
        "
      >
        404
      </p>

      <h1
        className="
          text-4xl
          sm:text-6xl
          font-black
          uppercase
          tracking-tighter
        "
      >
        PAGE NOT FOUND
      </h1>

      <p className="text-gray-500 mt-4">This page does not exist.</p>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  useEffect(() => {
    /* =====================================================
       LENIS SMOOTH SCROLL
    ===================================================== */

    const lenis = new Lenis({
      duration: 1.2,

      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    /* =====================================================
       GSAP + LENIS
    ===================================================== */

    const raf = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);

    gsap.ticker.lagSmoothing(0);

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      gsap.ticker.remove(raf);

      lenis.destroy();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />

      <Layout />
    </Router>
  );
}