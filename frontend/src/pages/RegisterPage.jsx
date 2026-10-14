import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Layers, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { validateAndNormalizePhone } from '../utils/phoneValidator';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast({ title: 'Validation', message: 'Please enter your name.', type: 'warning' });
      return;
    }

    let normalizedPhone = '';
    if (formData.phone && formData.phone.trim()) {
      const phoneValidation = validateAndNormalizePhone(formData.phone);
      if (!phoneValidation.isValid) {
        showToast({
          title: 'Invalid Phone Number',
          message: 'Please enter a valid 10-digit phone number.',
          type: 'warning'
        });
        return;
      }
      normalizedPhone = phoneValidation.normalized;
    }

    setLoading(true);
    try {
      const user = await register({
        ...formData,
        name: formData.name.trim(),
        phone: normalizedPhone
      });
      showToast({ title: 'Welcome to QVeue!', message: `Account created for ${user.name}`, type: 'success' });
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'staff') navigate('/staff/dashboard');
      else navigate('/customer/dashboard');
    } catch (err) {
      showToast({ title: 'Registration Failed', message: err.message || 'Error creating account', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white">QVeue</span>
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Create Your Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Join digital queues, track waiting times, and receive real-time notifications.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Shankar Kumar"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mobile Phone (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              10-digit Indian mobile number for SMS notifications and queue check-ins.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Account Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
            >
              <option value="customer">Customer (Join & Track Queues)</option>
              <option value="staff">Staff Operator (Manage Counters)</option>
              <option value="admin">Administrator (Manage System)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
