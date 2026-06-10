/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Benefits from './components/Benefits';
import Features from './components/Features';
import Segments from './components/Segments';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const handleExternalSession = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSession(customEvent.detail || null);
    };

    window.addEventListener('supabase-auth-changed', handleExternalSession);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('supabase-auth-changed', handleExternalSession);
    };
  }, []);

  if (session) {
    return <Dashboard session={session} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-cm-green/30 selection:text-cm-blue overflow-x-hidden flex flex-col">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Features />
        <Segments />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}

