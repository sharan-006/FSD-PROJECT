import React, { useState, useEffect } from 'react';
import { orgApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Building2, Plus, Phone, MapPin, CheckCircle, Stethoscope, Landmark, Wrench, QrCode } from 'lucide-react';
import { Badge } from '../../components/common/StatCard';
import { QRCodeModal } from '../../components/admin/QRCodeModal';

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQROrg, setSelectedQROrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'hospital',
    address: '',
    contact: '',
    tagline: ''
  });
  const { showToast } = useNotifications();

  const loadOrgs = async () => {
    try {
      const res = await orgApi.getAll();
      if (res.success) setOrgs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await orgApi.create(formData);
      if (res.success) {
        showToast({ title: 'Success', message: 'Organization created successfully!', type: 'success' });
        setIsModalOpen(false);
        setFormData({ name: '', type: 'hospital', address: '', contact: '', tagline: '' });
        loadOrgs();
      }
    } catch (e) {
      showToast({ title: 'Error', message: e.message, type: 'alert' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'hospital': return <Stethoscope className="w-5 h-5 text-emerald-400" />;
      case 'bank': return <Landmark className="w-5 h-5 text-amber-400" />;
      default: return <Wrench className="w-5 h-5 text-sky-400" />;
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
            Organizations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage participating hospitals, banks, and service branches.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl border border-slate-800">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs">Loading organizations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div key={org._id || org.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                    {getTypeIcon(org.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{org.name}</h3>
                    <span className="text-[11px] text-slate-400 capitalize">{org.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <Badge status={org.status} text={org.status} size="sm" />
              </div>

              {org.tagline && (
                <p className="text-xs text-slate-300 italic">"{org.tagline}"</p>
              )}

              <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{org.address || 'Address not listed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{org.contact || 'No direct phone'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedQROrg(org)}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-bold border border-purple-500/40 transition-all flex items-center gap-1.5 text-xs shadow-sm hover:scale-[1.02]"
                  title="Generate Entrance QR code and printable standee"
                >
                  <QrCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>Entrance QR Standee</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organization QR Code Standee Modal */}
      {selectedQROrg && (
        <QRCodeModal
          organization={selectedQROrg}
          service={null}
          isOpen={!!selectedQROrg}
          onClose={() => setSelectedQROrg(null)}
        />
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-700 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">Add New Organization</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Metro Health Center"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="hospital">Hospital / Clinic</option>
                  <option value="bank">Bank / Financial Institution</option>
                  <option value="service_center">Customer Service Center</option>
                  <option value="government">Government Office</option>
                  <option value="retail">Retail / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 123 Main Street"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+1 (555) 000-0000"
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
