import React, { useState, useEffect } from 'react';
import { counterApi, orgApi, serviceApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Monitor, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { Badge } from '../../components/common/StatCard';

export function CountersPage() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counterNumber, setCounterNumber] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const { showToast } = useNotifications();

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await orgApi.getAll();
        if (res.success && res.data.length > 0) {
          setOrgs(res.data);
          setSelectedOrgId(res.data[0]._id || res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrgs();
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;
    async function loadCountersAndServices() {
      try {
        const [counterRes, serviceRes] = await Promise.all([
          counterApi.getByOrg(selectedOrgId),
          serviceApi.getByOrg(selectedOrgId)
        ]);
        if (counterRes.success) setCounters(counterRes.data);
        if (serviceRes.success) {
          setServices(serviceRes.data);
          if (serviceRes.data.length > 0) {
            setSelectedServiceId(serviceRes.data[0]._id || serviceRes.data[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCountersAndServices();
  }, [selectedOrgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await counterApi.create({
        organizationId: selectedOrgId,
        serviceId: selectedServiceId || null,
        counterNumber: counterNumber.trim(),
        status: 'open'
      });
      if (res.success) {
        showToast({ title: 'Success', message: 'Counter added!', type: 'success' });
        setIsModalOpen(false);
        setCounterNumber('');
        const updated = await counterApi.getByOrg(selectedOrgId);
        if (updated.success) setCounters(updated.data);
      }
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Service Counters
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage physical counters, operational status, and desk availability.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Counter</span>
        </button>
      </div>

      {/* Org Filter Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Organization:</span>
        {orgs.map((org) => {
          const isSelected = selectedOrgId === (org._id || org.id);
          return (
            <button
              key={org._id || org.id}
              onClick={() => setSelectedOrgId(org._id || org.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {org.name}
            </button>
          );
        })}
      </div>

      {counters.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
          <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Counters Configured</h3>
          <p className="text-xs text-slate-400 mt-1">Create counters to allow staff to call customers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((c) => (
            <div key={c._id || c.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-white">{c.counterNumber}</h3>
                </div>
                <Badge status={c.status} text={c.status} size="sm" />
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  Assigned Staff:{' '}
                  <span className="text-white font-medium">
                    {c.staff ? c.staff.name : 'Unassigned'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">Add New Counter</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Counter Identifier *</label>
                <input
                  type="text"
                  required
                  value={counterNumber}
                  onChange={(e) => setCounterNumber(e.target.value)}
                  placeholder="e.g. Counter 4, Desk B"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {services.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dedicated Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {services.map((srv) => (
                      <option key={srv._id || srv.id} value={srv._id || srv.id}>
                        {srv.name} ({srv.prefix})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
