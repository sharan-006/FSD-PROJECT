import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { orgApi, serviceApi, adminApi } from '../services/api';
import { playChime } from '../utils/soundAlerts';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Building2,
  Radio,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Megaphone
} from 'lucide-react';

export function PublicDisplayPage() {
  const { socket } = useSocket();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [queues, setQueues] = useState([]);
  const [lastAnnouncement, setLastAnnouncement] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await orgApi.getAll();
        if (res.success && res.data.length > 0) {
          setOrganizations(res.data);
          setSelectedOrgId(res.data[0]._id || res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadOrgs();
  }, []);

  // Load queues monitor
  const loadQueues = async () => {
    try {
      const res = await adminApi.getQueuesMonitor();
      if (res.success) {
        setQueues(res.data);
        // Find most recent calling queue entry
        const calling = res.data.find((q) => q.currentToken);
        if (calling && !lastAnnouncement) {
          setLastAnnouncement({
            token: calling.currentToken,
            service: calling.serviceName,
            org: calling.orgName,
            counter: 'Counter 1',
            time: new Date()
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQueues();
  }, [selectedOrgId]);

  // Text to Speech announcement
  const announceVoice = (tokenNumber, counterNumber, serviceName) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel any active speech
      const text = `Attention: Token ${tokenNumber.split('').join(' ')}, please proceed to ${counterNumber}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice announcement error:', err);
    }
  };

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleTicketCalled = (data) => {
      playChime();
      const newAnnounce = {
        token: data.tokenNumber,
        counter: data.counterNumber || 'Counter 1',
        service: data.serviceName,
        org: data.orgName,
        time: new Date()
      };
      setLastAnnouncement(newAnnounce);
      announceVoice(data.tokenNumber, data.counterNumber || 'Counter 1', data.serviceName);
      loadQueues();
    };

    const handleQueueUpdate = () => {
      loadQueues();
    };

    socket.on('ticket:called', handleTicketCalled);
    socket.on('queue:updated', handleQueueUpdate);

    return () => {
      socket.off('ticket:called', handleTicketCalled);
      socket.off('queue:updated', handleQueueUpdate);
    };
  }, [socket, voiceEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredQueues = selectedOrgId
    ? queues.filter((q) => String(q.organizationId) === String(selectedOrgId))
    : queues;

  const currentOrg = organizations.find((o) => (o._id || o.id) === selectedOrgId);

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col p-4 sm:p-8 font-sans selection:bg-brand-500">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {currentOrg ? currentOrg.name : 'Public Queue Display'}
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
            </h1>
            <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mt-0.5">
              Live Service Hall & Waiting Lounge Terminal
            </p>
          </div>
        </div>

        {/* Right Tools: Time, Voice Toggle, Fullscreen */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Org Selector */}
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
          >
            {organizations.map((org) => (
              <option key={org._id || org.id} value={org._id || org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Voice Announcement Toggle */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (!voiceEnabled) announceVoice('TEST', 'Counter 1', 'Sample Service');
            }}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              voiceEnabled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Voice Announcements"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'Voice ON' : 'Voice Muted'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Fullscreen TV Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Digital Clock */}
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs font-bold text-sky-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Massive Now Serving Hero Banner (Left 7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex-1 rounded-3xl p-8 sm:p-12 glass-panel border border-brand-500/40 bg-gradient-to-br from-brand-950/50 via-slate-900 to-sky-950/40 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Megaphone className="w-64 h-64 text-brand-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Now Calling Customer
              </div>

              <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider block">
                {lastAnnouncement?.service || 'General Service Desk'}
              </span>
            </div>

            {/* Giant Token Display */}
            <div className="my-8 text-center sm:text-left">
              <div className="text-7xl sm:text-9xl font-black text-white tracking-tight font-mono text-glow">
                {lastAnnouncement?.token || 'Q-018'}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-slate-400">Please Proceed To:</span>
                <span className="text-2xl sm:text-4xl font-extrabold text-brand-300 px-4 py-1.5 rounded-2xl bg-brand-500/20 border border-brand-500/40">
                  {lastAnnouncement?.counter || 'Counter 1'}
                </span>
              </div>
            </div>

            {/* Notification Announcement Subtitle */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Audio chime & voice announcement broadcasted automatically</span>
              </div>
              <button
                onClick={() => {
                  playChime();
                  if (lastAnnouncement) {
                    announceVoice(lastAnnouncement.token, lastAnnouncement.counter, lastAnnouncement.service);
                  }
                }}
                className="px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] transition-colors"
              >
                Re-announce
              </button>
            </div>
          </div>
        </section>

        {/* Live Counters & Department Overview (Right 5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Active Queue Status by Department
            </h3>
            <span className="text-xs font-mono text-brand-400 font-bold">{filteredQueues.length} Services</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
            {filteredQueues.map((q) => (
              <div
                key={q._id || q.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-white">{q.serviceName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Users className="w-3.5 h-3.5" />
                      {q.waitingCount} waiting
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">~{q.averageServiceTime} min avg</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Serving
                  </span>
                  <div className="text-2xl font-black font-mono text-brand-400 mt-0.5">
                    {q.currentToken || '--'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Ticker */}
      <footer className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">QVeue Public Display Core</span>
          <span>•</span>
          <span>WebSocket Real-Time Listener Active</span>
        </div>
        <div>
          <span>Please prepare your digital token before stepping to the desk.</span>
        </div>
      </footer>
    </div>
  );
}
