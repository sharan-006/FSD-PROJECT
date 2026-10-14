import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { orgApi, serviceApi, queueApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { validateAndNormalizePhone } from '../../utils/phoneValidator';
import { AlreadyInQueueModal } from '../../components/common/AlreadyInQueueModal';
import { 
  Building2, 
  Layers, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  User, 
  Phone, 
  FileText, 
  Sparkles,
  Stethoscope,
  Landmark,
  Wrench
} from 'lucide-react';

export function JoinQueuePage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Duplicate active ticket modal state
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Load organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await orgApi.getAll();
        if (res.success && res.data) {
          setOrganizations(res.data);
          if (res.data.length > 0) {
            setSelectedOrgId(res.data[0]._id || res.data[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load organizations', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrgs();
  }, []);

  // Load services whenever selectedOrgId changes
  useEffect(() => {
    if (!selectedOrgId) return;
    async function loadServices() {
      try {
        const res = await serviceApi.getByOrg(selectedOrgId);
        if (res.success && res.data) {
          setServices(res.data);
          if (res.data.length > 0) {
            setSelectedServiceId(res.data[0]._id || res.data[0].id);
            setSelectedService(res.data[0]);
          } else {
            setSelectedServiceId('');
            setSelectedService(null);
          }
        }
      } catch (e) {
        console.error('Failed to load services', e);
      }
    }
    loadServices();
  }, [selectedOrgId]);

  const handleServiceSelect = (srv) => {
    setSelectedServiceId(srv._id || srv.id);
    setSelectedService(srv);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      showToast({ title: 'Validation', message: 'Please choose a service.', type: 'warning' });
      return;
    }
    if (!customerName.trim()) {
      showToast({ title: 'Validation', message: 'Please provide your name.', type: 'warning' });
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
        serviceId: selectedServiceId,
        organizationId: selectedOrgId,
        customerName: customerName.trim(),
        customerPhone: phoneValidation.normalized,
        notes: notes.trim()
      });

      if (res.success) {
        showToast({
          title: 'Token Generated!',
          message: `Your token ${res.ticket?.tokenNumber} is ready. Welcome!`,
          type: 'success'
        });
        navigate('/customer/dashboard');
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
          title: 'Could Not Join',
          message: err.message || 'Error creating ticket',
          type: 'alert'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getOrgIcon = (type) => {
    switch (type) {
      case 'hospital':
        return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 'bank':
        return <Landmark className="w-5 h-5 text-amber-400" />;
      default:
        return <Wrench className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
          Smart Registration
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
          Join a Digital Queue
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          Select your destination and service to generate an instant real-time token. You can leave the physical waiting area while tracking your live wait time.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select Organization */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-bold">1</span>
              Select Organization
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {organizations.map((org) => {
                const isSelected = selectedOrgId === (org._id || org.id);
                return (
                  <button
                    key={org._id || org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org._id || org.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-950/60 border-brand-500 text-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {getOrgIcon(org.type)}
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                    </div>
                    <span className="font-bold text-sm block text-white">{org.name}</span>
                    <span className="text-[11px] text-slate-400 capitalize block mt-0.5">{org.type.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Service */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-bold">2</span>
              Select Service Category
            </label>
            {services.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 border border-dashed border-slate-800 rounded-2xl">
                No active services available for this organization.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {services.map((srv) => {
                  const isSelected = selectedServiceId === (srv._id || srv.id);
                  return (
                    <button
                      key={srv._id || srv.id}
                      type="button"
                      onClick={() => handleServiceSelect(srv)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-sky-400 border border-slate-800">
                          PREFIX: {srv.prefix}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                      </div>
                      <span className="font-bold text-sm block text-white mt-1">{srv.name}</span>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>~{srv.averageServiceTime} min avg.</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Customer Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-bold">3</span>
              Customer Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Shankar Kumar"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Mobile Phone (10 digits) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Indian 10-digit number. Used for SMS turn notifications & queue identification.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Reason for Visit / Special Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Annual health checkup, deposit slip #104, etc."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {selectedService ? (
                <span>
                  Expected Service Time: <strong className="text-emerald-400">{selectedService.averageServiceTime} min</strong>
                </span>
              ) : (
                <span>Please pick a service</span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedServiceId}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Generating Token...' : 'Generate My Token'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Active Queue Entry Modal */}
      <AlreadyInQueueModal
        isOpen={showDuplicateModal}
        duplicateData={duplicateData}
        onClose={() => setShowDuplicateModal(false)}
        onViewQueue={() => navigate('/customer/dashboard')}
      />
    </div>
  );
}
