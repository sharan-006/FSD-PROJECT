import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orgApi } from '../services/api';
import {
  Layers,
  ArrowRight,
  Clock,
  Bell,
  Ticket,
  ShieldCheck,
  Building2,
  Users,
  Activity,
  Sparkles,
  Stethoscope,
  Landmark,
  Wrench,
  CheckCircle2,
  Volume2
} from 'lucide-react';

export function LandingPage() {
  const { quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await orgApi.getAll();
        if (res.success) setOrgs(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    loadOrgs();
  }, []);

  const handleQuickDemo = async (roleOrEmail, targetRoute) => {
    try {
      await quickDemoLogin(roleOrEmail);
      navigate(targetRoute);
    } catch (e) {
      console.error(e);
    }
  };

  const steps = [
    { num: '01', title: 'Select Service', desc: 'Choose your desired organization and service department.', icon: Building2 },
    { num: '02', title: 'Join Queue', desc: 'Generate an instant digital token with zero physical contact.', icon: Ticket },
    { num: '03', title: 'Track Position', desc: 'Monitor your live place and dynamic waiting time from anywhere.', icon: Clock },
    { num: '04', title: 'Get Notified', desc: 'Receive proactive alerts & audio chimes when your turn is near.', icon: Bell },
    { num: '05', title: 'Get Served', desc: 'Walk directly to the assigned counter right on time.', icon: CheckCircle2 },
  ];

  const features = [
    {
      title: 'Real-Time Visibility',
      desc: 'No more guessing. Watch the line move live with millisecond WebSocket push updates.',
      icon: Activity,
      color: 'brand'
    },
    {
      title: 'Dynamic Waiting Time',
      desc: 'Smart algorithmic prediction considering customers ahead, active counters, and rolling averages.',
      icon: Clock,
      color: 'sky'
    },
    {
      title: 'Digital Smart Tokens',
      desc: 'Sequential, zero-padded tokens (e.g. Q-024) per service category without paper waste.',
      icon: Ticket,
      color: 'emerald'
    },
    {
      title: 'Proactive Turn Alerts',
      desc: 'Auditory hospital chimes and in-app alerts fire when 2 customers remain before you.',
      icon: Bell,
      color: 'amber'
    },
    {
      title: 'Full Facility Governance',
      desc: 'Centralized admin controls for multiple organizations, counters, staff, and hourly analytics.',
      icon: ShieldCheck,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6 animate-fade-in shadow-lg shadow-brand-500/10">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Generation Digital Queue Experience</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          <span className="text-white">v2.0 Live</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          Know your place. <br />
          <span className="bg-gradient-to-r from-sky-400 via-brand-400 to-emerald-400 bg-clip-text text-transparent">
            Know your wait.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Real-time queue management for hospitals, banks, service centers, and modern service organizations. Free your customers from waiting lobbies.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/customer/join"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <span>Join a Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login"
            className="px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-sm border border-slate-700 transition-all hover:scale-105 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Staff / Admin Login</span>
          </Link>
        </div>

        {/* Live Demo Quick-Launch Bar */}
        <div className="mt-12 p-4 rounded-2xl glass-panel border border-slate-800 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Instant One-Click Demo Evaluators:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('shankar@example.com', '/customer/dashboard')}
              className="px-3 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 font-semibold transition-colors"
            >
              Customer: Shankar (Q-024)
            </button>
            <button
              onClick={() => handleQuickDemo('sarah.patel@citycare.org', '/staff/dashboard')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold transition-colors"
            >
              Staff: Dr. Sarah (Hospital)
            </button>
            <button
              onClick={() => handleQuickDemo('admin@qveue.com', '/admin/dashboard')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-semibold transition-colors"
            >
              Admin: Eleanor (Full KPIs)
            </button>
          </div>
        </div>

        {/* Live Snapshot Mock Card */}
        <div className="mt-12 p-1 rounded-3xl bg-gradient-to-r from-brand-500/30 via-sky-500/30 to-emerald-500/30 shadow-2xl">
          <div className="glass-panel p-6 sm:p-8 rounded-[22px] border border-slate-700/60 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">CityCare Hospital – General Consultation</h4>
                  <span className="text-xs text-slate-400">Live Active Queue Demonstration</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Syncing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400">Now Serving</span>
                <div className="text-2xl font-black text-brand-400 mt-1">Q-018</div>
                <span className="text-[10px] text-slate-500">Counter 1</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400">Your Token</span>
                <div className="text-2xl font-black text-white mt-1">Q-024</div>
                <span className="text-[10px] text-slate-500">Shankar Kumar</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400">People Ahead</span>
                <div className="text-2xl font-black text-amber-400 mt-1">5</div>
                <span className="text-[10px] text-slate-500">Waiting before you</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-bold uppercase text-slate-400">Estimated Wait</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">18 min</div>
                <span className="text-[10px] text-slate-500">Dynamic rolling avg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            Frictionless Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            How QVeue Works
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            From arrival to counter service, everything is streamlined digitally in 5 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="glass-panel p-5 rounded-2xl border border-slate-800 relative hover:border-brand-500/30 transition-all duration-200"
              >
                <div className="text-3xl font-black text-slate-700/60 font-mono mb-2">{s.num}</div>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 w-fit mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">{s.title}</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why QVeue Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Core Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            Why Modern Facilities Choose QVeue
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Engineered to eliminate physical waiting anxiety and optimize staff throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 w-fit border border-brand-500/20">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Supported Sectors */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Versatile Multi-Tenant Design
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Ready for Hospitals, Banks, and Service Centers
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Whether routing patients through Triage and Pharmacy, balancing teller lines in commercial branches, or organizing warranty repair intakes, QVeue adapts effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Hospitals & Clinics</h4>
                <p className="text-[11px] text-slate-400">Consultation, Labs, Pharmacy</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <Landmark className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Commercial Banks</h4>
                <p className="text-[11px] text-slate-400">Cash Teller, Loans, Accounts</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <Wrench className="w-6 h-6 text-sky-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Service Hubs</h4>
                <p className="text-[11px] text-slate-400">Technical Support, Repair, Claims</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-950/50 via-slate-900 to-sky-950/50 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Experience the Future of Queuing
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
            Try the live digital queue now or explore staff service desk controls with one click.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/customer/join"
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-transform hover:scale-105"
            >
              Get a Digital Token
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-transform hover:scale-105"
            >
              Sign In to Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
