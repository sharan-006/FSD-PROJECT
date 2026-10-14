import React, { useState, useEffect } from 'react';
import { serviceApi, orgApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Sliders, Plus, Clock, Tag, Building2, QrCode } from 'lucide-react';
import { Badge } from '../../components/common/StatCard';
import { QRCodeModal } from '../../components/admin/QRCodeModal';

export function ServicesPage() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQRService, setSelectedQRService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    averageServiceTime: 5,
    prefix: 'Q'
  });
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
    async function loadServices() {
      try {
        const res = await serviceApi.getByOrg(selectedOrgId);
        if (res.success) setServices(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    loadServices();
  }, [selectedOrgId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await serviceApi.create({
        ...formData,
        organizationId: selectedOrgId,
        averageServiceTime: Number(formData.averageServiceTime)
      });
      if (res.success) {
        showToast({ title: 'Success', message: 'Service created successfully!', type: 'success' });
        setIsModalOpen(false);
        setFormData({ name: '', description: '', averageServiceTime: 5, prefix: 'Q' });
        const updated = await serviceApi.getByOrg(selectedOrgId);
        if (updated.success) setServices(updated.data);
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
            Service Categories & Average Durations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure average service durations used by the dynamic waiting-time engine.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Org Filter Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Filter by Org:</span>
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

      {services.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-800">
          <Sliders className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Services Found</h3>
          <p className="text-xs text-slate-400 mt-1">Add a service category to enable queues for this organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div key={srv._id || srv.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900 text-brand-400 border border-slate-800">
                  TOKEN PREFIX: {srv.prefix}
                </span>
                <Badge status={srv.status} text={srv.status} size="sm" />
              </div>

              <div>
                <h3 className="font-bold text-base text-white">{srv.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {srv.description || 'No description provided'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {srv.averageServiceTime} min / ticket
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedQRService(srv)}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 font-bold border border-purple-500/40 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Generate QR code and printable counter standee"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Standee</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">Add New Service</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pediatric Consultation"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Token Prefix (1-2 chars) *</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. P"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Average Service Time (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={formData.averageServiceTime}
                  onChange={(e) => setFormData({ ...formData, averageServiceTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of service scope"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Standee Modal */}
      {selectedQRService && (
        <QRCodeModal
          organization={orgs.find((o) => (o._id || o.id) === selectedOrgId)}
          service={selectedQRService}
          isOpen={!!selectedQRService}
          onClose={() => setSelectedQRService(null)}
        />
      )}
    </div>
  );
}
