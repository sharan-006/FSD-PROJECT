import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { queueApi } from '../../services/api';
import { playChime, playAlertBeep } from '../../utils/soundAlerts';
import { validateAndNormalizePhone } from '../../utils/phoneValidator';
import { AlreadyInQueueModal } from '../../components/common/AlreadyInQueueModal';
import {
  Layers,
  Building2,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  User,
  Volume2,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  QrCode,
  Printer,
  ChevronRight,
  ArrowLeft,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  ClipboardList,
  Banknote,
  CreditCard,
  Landmark,
  Headphones,
  Wrench,
  FileText
} from 'lucide-react';

export function QRJoinPage() {
  const { organizationId, serviceId: urlServiceId } = useParams();
  const [selectedServiceId, setSelectedServiceId] = useState(urlServiceId || null);
  const activeServiceId = urlServiceId || selectedServiceId;

  const { user } = useAuth();
  const { socket, joinQueueRoom } = useSocket();
  const { showToast } = useNotifications();

  // Pre-join state
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  // Duplicate active ticket modal state
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Post-join state
  const [ticket, setTicket] = useState(null);

  // Sync urlServiceId if changed
  useEffect(() => {
    if (urlServiceId) {
      setSelectedServiceId(urlServiceId);
    }
  }, [urlServiceId]);

  // Load preview data based on activeServiceId
  const loadPreview = useCallback(async () => {
    try {
      setError(null);
      const res = await queueApi.getPreview(organizationId, activeServiceId);
      if (res.success && res.data) {
        setPreview(res.data);
        if (res.data.queueId) {
          joinQueueRoom(res.data.queueId);
        }
      } else {
        setError('Service queue not found or unavailable.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load service queue details.');
    } finally {
      setLoading(false);
    }
  }, [organizationId, activeServiceId, joinQueueRoom]);

  useEffect(() => {
    setLoading(true);
    loadPreview();
  }, [loadPreview]);

  // Keep customer name/phone in sync if user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone) setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // Real-time listener for queue progression
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => {
      // Refresh preview stats
      loadPreview();

      // If user has an active ticket, recalculate their position
      if (ticket) {
        queueApi.getMyActiveTickets().then((res) => {
          if (res.success && res.data) {
            const current = res.data.find(
              (t) => (t._id === ticket._id || t.id === ticket.id)
            );
            if (current) {
              setTicket(current);
              if (current.status === 'calling' && ticket.status !== 'calling') {
                playChime();
              } else if (current.peopleAhead <= 2 && ticket.peopleAhead > 2) {
                playAlertBeep();
              }
            }
          }
        }).catch(() => {});
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('ticket:called', handleQueueUpdate);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('ticket:called', handleQueueUpdate);
    };
  }, [socket, ticket, loadPreview]);

  // Handle Join Queue Submit
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast({ title: 'Name Required', message: 'Please enter your name.', type: 'warning' });
      return;
    }

    if (!activeServiceId) {
      showToast({ title: 'Service Required', message: 'Please select a service first.', type: 'warning' });
      return;
    }

    const phoneValidation = validateAndNormalizePhone(customerPhone);
    if (!phoneValidation.isValid) {
      showToast({
        title: 'Invalid Phone Number',
        message: 'Please enter a valid 10-digit phone number.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await queueApi.join({
        organizationId,
        serviceId: activeServiceId,
        customerName: customerName.trim(),
        customerPhone: phoneValidation.normalized
      });

      if (res.success && res.ticket) {
        setTicket(res.ticket);
        playChime();
        showToast({
          title: 'You Are In Line!',
          message: `Your token ${res.ticket.tokenNumber} is ready.`,
          type: 'success'
        });
      }
    } catch (err) {
      if (err.data?.error === 'ALREADY_IN_QUEUE' || (err.data?.message && err.data.message.includes('already in this queue'))) {
        setDuplicateData(err.data);
        setShowDuplicateModal(true);
        showToast({
          title: 'Already in Queue',
          message: err.data?.message || `You are already in this queue with token ${err.data?.existingToken || ''}.`,
          type: 'warning'
        });
      } else {
        showToast({
          title: 'Could Not Join Queue',
          message: err.message || 'Error creating ticket',
          type: 'alert'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for department icon
  const getServiceIcon = (iconName, prefix) => {
    switch (iconName) {
      case 'stethoscope': return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 'pill': return <Pill className="w-5 h-5 text-sky-400" />;
      case 'flask-conical': return <FlaskConical className="w-5 h-5 text-purple-400" />;
      case 'receipt': return <Receipt className="w-5 h-5 text-amber-400" />;
      case 'clipboard-list': return <ClipboardList className="w-5 h-5 text-rose-400" />;
      case 'banknote': return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'credit-card': return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'landmark': return <Landmark className="w-5 h-5 text-amber-400" />;
      case 'headphones': return <Headphones className="w-5 h-5 text-sky-400" />;
      case 'wrench': return <Wrench className="w-5 h-5 text-orange-400" />;
      default: return <Clock className="w-5 h-5 text-brand-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center max-w-sm w-full">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading live queue status...</p>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-[#070d1e] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Queue Not Found</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {error || 'The requested service queue does not exist or has been closed.'}
            </p>
          </div>
          <Link
            to="/customer/join"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
          >
            Explore All Queues
          </Link>
        </div>
      </div>
    );
  }

  const isCalling = ticket && (ticket.status === 'calling' || ticket.status === 'serving');
  const isApproaching = ticket && ticket.peopleAhead !== undefined && ticket.peopleAhead <= 2 && ticket.peopleAhead > 0;

  // Render Case 1: Post-Join Live Ticket Card
  if (ticket) {
    return (
      <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-brand-500">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">QVeue</span>
            </div>
            <p className="text-[11px] text-brand-400 font-semibold uppercase tracking-widest">
              Digital Queue Live Ticket
            </p>
          </div>

          {/* Clean Mobile-first Live Card Matching Mockup */}
          <div
            className={`rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up transition-all ${
              isCalling
                ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/50'
                : 'glass-panel border-brand-500/40'
            }`}
          >
            {/* Banner: Calling Now or Turn Approaching */}
            {isCalling && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-center animate-pulse">
                <span className="text-xs font-black uppercase tracking-wider block text-emerald-300">
                  Now Serving You!
                </span>
                <span className="text-sm font-bold block mt-1">
                  Please proceed to {ticket.counterNumber || 'Counter 1'}
                </span>
              </div>
            )}

            {!isCalling && isApproaching && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-center">
                <strong className="text-amber-300">Your turn is approaching!</strong> Only{' '}
                {ticket.peopleAhead} {ticket.peopleAhead === 1 ? 'person' : 'people'} ahead. Please be near the counter.
              </div>
            )}

            {/* Organization & Service Summary */}
            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {ticket.orgName || preview.organization?.name}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                {ticket.serviceName || preview.service?.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registered for: <span className="text-white font-semibold">{ticket.customerName}</span>
              </p>
            </div>

            {/* YOUR TOKEN HERO (Exact specification) */}
            <div className="text-center py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                YOUR TOKEN
              </span>
              <div className="text-6xl font-black text-white font-mono tracking-tight text-glow my-1">
                {ticket.tokenNumber}
              </div>
            </div>

            {/* Metrics Stack */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 uppercase font-semibold">NOW SERVING:</span>
                <span className="font-mono font-black text-brand-400 text-base">
                  {ticket.currentToken || preview.currentToken || 'Waiting'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 uppercase font-semibold">PEOPLE AHEAD:</span>
                <span className="font-bold text-amber-400 text-base">
                  {ticket.peopleAhead !== undefined ? ticket.peopleAhead : 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 uppercase font-semibold">ESTIMATED WAIT:</span>
                <span className="font-bold text-emerald-400 text-base">
                  {ticket.formattedWaitTime || ticket.formattedWait || `${ticket.estimatedWaitMinutes || ticket.estimatedWaitTime || 0} MINUTES`}
                </span>
              </div>
            </div>

            {/* Status Live Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>● QUEUE LIVE</span>
            </div>

            {/* Actions: View in Dashboard / Audio */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => playChime()}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                title="Test Audio Chime"
              >
                <Volume2 className="w-4 h-4 text-brand-400" />
                <span>Test Chime</span>
              </button>

              <Link
                to="/customer/dashboard"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500 mt-6">
            You can leave the waiting area. This page refreshes automatically in real time.
          </p>
        </div>
      </div>
    );
  }

  // Render Case 2: Service is Selected -> Show Step 3 & Step 4 Join Form
  if (activeServiceId && preview.service) {
    const { organization, service, waitingCount, estimatedWaitMinutes, formattedWait } = preview;

    return (
      <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-brand-500">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">QVeue</span>
            </div>
            <p className="text-[11px] text-brand-400 font-semibold uppercase tracking-widest">
              QR Digital Queue Entry
            </p>
          </div>

          {/* Clean Mobile Card (Step 3 & 4) */}
          <div className="glass-panel rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-slide-up">
            {/* If user came from org selection, let them switch back */}
            {!urlServiceId && (
              <button
                type="button"
                onClick={() => setSelectedServiceId(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Choose another department</span>
              </button>
            )}

            {/* Step 3: Organization & Service Header */}
            <div className="text-center space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-400" />
                {organization?.name || 'Service Organization'}
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {service?.name || 'General Consultation'}
              </h2>

              <p className="text-xs text-brand-300 font-semibold pt-0.5">
                Join this queue?
              </p>

              {service?.description && (
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
                  {service.description}
                </p>
              )}
            </div>

            {/* Waiting Count Live Badge */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-center">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Waiting Right Now
                </span>
                <span className="text-2xl font-black text-amber-400 block mt-0.5">
                  {waitingCount} {waitingCount === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estimated Wait
                </span>
                <span className="text-2xl font-black text-emerald-400 block mt-0.5">
                  {formattedWait || `${estimatedWaitMinutes} min`}
                </span>
              </div>
            </div>

            {/* Step 4: Customer Basic Inputs Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Shankar"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Phone (10 digits) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Indian 10-digit number. Used for SMS turn notifications & queue identification.
                </span>
              </div>

              {/* Step 5: Big Prominent JOIN QUEUE Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Generating Token...' : 'JOIN QUEUE'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center">
              <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No physical queue standing needed. Live tracking enabled.
              </span>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500 mt-6">
            QVeue Smart Queue System &copy; {new Date().getFullYear()} • Powered by Real-Time WebSockets
          </p>
        </div>

        {/* Duplicate Active Queue Entry Modal */}
        <AlreadyInQueueModal
          isOpen={showDuplicateModal}
          duplicateData={duplicateData}
          onClose={() => setShowDuplicateModal(false)}
          onViewQueue={() => {
            if (duplicateData?.ticket) {
              setTicket(duplicateData.ticket);
            }
            setShowDuplicateModal(false);
          }}
        />
      </div>
    );
  }

  // Render Case 3: Scanned Organization Entrance QR -> Department / Service Selector
  const { organization, services = [] } = preview;

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-brand-500">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">QVeue</span>
          </div>
          <p className="text-[11px] text-brand-400 font-semibold uppercase tracking-widest">
            Organization Entrance Pass
          </p>
        </div>

        {/* Organization Welcome Card */}
        <div className="glass-panel rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-5 animate-slide-up">
          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              Welcome to
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {organization?.name || 'Service Organization'}
            </h1>
            <p className="text-xs text-slate-400">
              Select a service below to join its digital line:
            </p>
          </div>

          {/* Services List */}
          <div className="space-y-2.5">
            {services.map((srv) => (
              <button
                key={srv._id || srv.id}
                type="button"
                onClick={() => setSelectedServiceId(srv._id || srv.id)}
                className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-brand-500/50 transition-all text-left group flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-brand-500/30 transition-colors">
                    {getServiceIcon(srv.icon, srv.prefix)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors">
                      {srv.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="text-amber-400 font-semibold">
                        {srv.waitingCount} {srv.waitingCount === 1 ? 'person' : 'people'} waiting
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        ~{srv.formattedWait || `${srv.estimatedWaitMinutes}m`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-brand-400 group-hover:translate-x-1 transition-transform shrink-0">
                  <span>Join</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Secure QR Entry • No App Download Required
            </span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          QVeue Smart Queue System &copy; {new Date().getFullYear()} • Powered by Real-Time WebSockets
        </p>
      </div>
    </div>
  );
}

export default QRJoinPage;
