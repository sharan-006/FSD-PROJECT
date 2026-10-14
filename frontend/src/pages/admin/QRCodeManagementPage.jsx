import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Sliders,
  Wifi,
  Globe,
  Monitor,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Layers,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { orgApi, serviceApi, adminApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export function QRCodeManagementPage() {
  const { showToast } = useNotifications();

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(''); // '' means Entrance / All Services
  const [loading, setLoading] = useState(true);

  // Network IP detection & Host configuration from environment
  const envUrl = import.meta.env.VITE_FRONTEND_URL || '';
  const [configuredUrl, setConfiguredUrl] = useState(envUrl);
  const [networkIp, setNetworkIp] = useState('');
  const [hostMode, setHostMode] = useState(envUrl ? 'env' : 'network'); // 'env' | 'network' | 'current' | 'custom'
  const [customHost, setCustomHost] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrHeroDataUrl, setQrHeroDataUrl] = useState('');
  const [batchQrUrls, setBatchQrUrls] = useState({});

  const printableRef = useRef(null);

  // Load organizations and network IP on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        // Fetch organizations
        const orgRes = await orgApi.getAll();
        if (orgRes.success && orgRes.data && orgRes.data.length > 0) {
          setOrganizations(orgRes.data);
          setSelectedOrgId(orgRes.data[0]._id || orgRes.data[0].id);
        }

        // Fetch network IP info & configured URL from backend
        try {
          const netRes = await adminApi.getNetworkInfo();
          if (netRes.success && netRes.data) {
            if (netRes.data.primaryIp) setNetworkIp(netRes.data.primaryIp);
            if (netRes.data.configuredFrontendUrl) {
              setConfiguredUrl(netRes.data.configuredFrontendUrl);
              setHostMode('env');
            }
          }
        } catch {
          console.warn('Could not fetch backend network-info, using window.location.hostname');
        }
      } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Failed to load organization data.', type: 'alert' });
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [showToast]);

  // Load services whenever selectedOrgId changes
  useEffect(() => {
    if (!selectedOrgId) return;

    async function loadServices() {
      try {
        const res = await serviceApi.getByOrg(selectedOrgId);
        if (res.success && res.data) {
          setServices(res.data);
          // Default to first service or keep all-services
          if (res.data.length > 0 && selectedServiceId && !res.data.some(s => (s._id || s.id) === selectedServiceId)) {
            setSelectedServiceId(res.data[0]._id || res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load services for org:', err);
      }
    }

    loadServices();
  }, [selectedOrgId]);

  // Calculate the active Base URL according to hostMode
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  const activeBaseUrl = useMemo(() => {
    if (hostMode === 'env' && (configuredUrl || envUrl)) {
      return (configuredUrl || envUrl).replace(/\/+$/, '');
    }
    if (hostMode === 'network' && networkIp) {
      return `${protocol}//${networkIp}${port}`;
    }
    if (hostMode === 'custom' && customHost.trim()) {
      return customHost.trim().replace(/\/+$/, '');
    }
    if (configuredUrl || envUrl) {
      return (configuredUrl || envUrl).replace(/\/+$/, '');
    }
    if (networkIp) {
      return `${protocol}//${networkIp}${port}`;
    }
    // Default to current browser origin
    return window.location.origin;
  }, [hostMode, configuredUrl, envUrl, networkIp, port, protocol, customHost]);

  // Active Organization & Service objects
  const currentOrg = useMemo(() => {
    return organizations.find((o) => (o._id || o.id) === selectedOrgId) || organizations[0];
  }, [organizations, selectedOrgId]);

  const currentService = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((s) => (s._id || s.id) === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Target URL encoded in the Hero QR code
  const targetJoinUrl = useMemo(() => {
    if (!currentOrg) return '';
    const orgId = currentOrg._id || currentOrg.id;
    if (currentService) {
      const srvId = currentService._id || currentService.id;
      return `${activeBaseUrl}/join/${orgId}/${srvId}`;
    }
    return `${activeBaseUrl}/join/${orgId}`;
  }, [activeBaseUrl, currentOrg, currentService]);

  // Generate Hero QR Code
  useEffect(() => {
    if (!targetJoinUrl) return;

    QRCode.toDataURL(
      targetJoinUrl,
      {
        width: 1024,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#070d1e',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err) {
          setQrHeroDataUrl(url);
        } else {
          console.error('QR code generation error:', err);
        }
      }
    );
  }, [targetJoinUrl]);

  // Generate batch QR codes for all services in the organization
  useEffect(() => {
    if (!currentOrg || services.length === 0) return;
    const orgId = currentOrg._id || currentOrg.id;

    const urls = {};
    const promises = services.map((srv) => {
      const srvId = srv._id || srv.id;
      const srvUrl = `${activeBaseUrl}/join/${orgId}/${srvId}`;
      return QRCode.toDataURL(srvUrl, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#070d1e', light: '#ffffff' }
      }).then((dataUrl) => {
        urls[srvId] = { dataUrl, url: srvUrl };
      });
    });

    Promise.all(promises).then(() => {
      setBatchQrUrls(urls);
    });
  }, [activeBaseUrl, currentOrg, services]);

  // Download QR Code PNG
  const handleDownload = (dataUrl, filename) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename || 'QVeue_QR'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      title: 'QR Code Downloaded',
      message: `${link.download} saved to your device.`,
      type: 'success'
    });
  };

  // Copy URL to clipboard
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast({
      title: 'URL Copied',
      message: 'Direct join link copied to clipboard.',
      type: 'success'
    });
  };

  // Print Standee
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading QR Code Management...</p>
      </div>
    );
  }

  const heroFilename = currentOrg
    ? currentService
      ? `${currentOrg.name.replace(/\s+/g, '_')}_${currentService.name.replace(/\s+/g, '_')}_QR`
      : `${currentOrg.name.replace(/\s+/g, '_')}_Entrance_Pass_QR`
    : 'QVeue_QR';

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>Smart QR System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              QR Code Management & Standee Generator
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Generate real, high-resolution QR codes encoding actual service URLs. Customers can scan directly using any smartphone camera to take a digital token and track live wait times.
            </p>
          </div>

          {/* Network IP status pill */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-3 shrink-0 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                LAN Scannable IP
              </div>
              <div className="font-mono text-emerald-400 font-bold">
                {networkIp ? `${networkIp}${port}` : 'Detecting network...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Organization Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Select Organization</span>
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              {organizations.map((org) => (
                <option key={org._id || org.id} value={org._id || org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>

          {/* Service Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Select Service / Queue</span>
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="">🏢 Main Entrance Pass (All Services Menu)</option>
              {services.map((srv) => (
                <option key={srv._id || srv.id} value={srv._id || srv.id}>
                  [{srv.prefix}] {srv.name} (~{srv.averageServiceTime}m avg)
                </option>
              ))}
            </select>
          </div>

          {/* QR Base Host Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Network / Host for Phone Scan</span>
            </label>
            <select
              value={hostMode}
              onChange={(e) => setHostMode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              {(configuredUrl || envUrl) && (
                <option value="env">
                  ⚙️ Configured Environment URL ({configuredUrl || envUrl}) — from .env
                </option>
              )}
              <option value="network">
                📱 Wi-Fi LAN IP ({networkIp ? `${networkIp}${port}` : 'Auto-detected'}) — Recommended
              </option>
              <option value="current">
                💻 Current Browser Origin ({window.location.origin})
              </option>
              <option value="custom">🌐 Custom Public Domain / Tunnel</option>
            </select>
          </div>
        </div>

        {/* Custom Host input if 'custom' is selected */}
        {hostMode === 'custom' && (
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Custom Base URL (e.g., https://my-qveue-deployment.com or ngrok tunnel)
            </label>
            <input
              type="text"
              value={customHost}
              onChange={(e) => setCustomHost(e.target.value)}
              placeholder="https://qveue.example.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        )}

        {/* Help Tip */}
        <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>For Physical Phone Camera Testing:</strong> Mobile phones cannot reach{' '}
            <code className="text-amber-300 font-mono">localhost</code> on your computer. When set to{' '}
            <strong className="text-white">Wi-Fi LAN IP ({networkIp || '192.168.x.x'})</strong>, the QR code encodes the reachable LAN address so any phone connected to the same Wi-Fi network scans and opens the real live queue page immediately!
          </p>
        </div>
      </div>

      {/* Main Standee Preview & Actions Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Printable Counter Standee Preview (8 cols on large) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Physical Standee Display & Live QR</span>
            </h2>
            <span className="text-xs text-slate-400">High-Resolution Vector Rendering</span>
          </div>

          {/* Standee Physical Card (Pure White Card with Crisp High-Contrast Standee Design) */}
          <div
            ref={printableRef}
            id="printable-standee"
            className="p-8 sm:p-10 rounded-3xl bg-white text-slate-900 border-2 border-slate-200 shadow-2xl text-center relative overflow-hidden transition-all print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-extrabold uppercase tracking-widest text-brand-700 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>
                {currentService ? `Digital Fast Pass • ${currentService.prefix} Line` : 'Digital Entrance Fast Pass'}
              </span>
            </div>

            {/* Org and Service Name */}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {currentOrg ? currentOrg.name : 'QVeue Organization'}
            </h2>
            <p className="text-base font-extrabold text-brand-600 mt-1">
              {currentService ? currentService.name : 'Welcome Desk • All Departments'}
            </p>

            {/* Service Description or Tagline */}
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {currentService?.description || currentOrg?.tagline || 'Scan with your smartphone camera to join queue'}
            </p>

            {/* Real QR Code Image Container */}
            <div className="my-6 inline-block p-4 rounded-3xl bg-white border-2 border-slate-300 shadow-md">
              {qrHeroDataUrl ? (
                <img
                  id="rendered-qr-code-image"
                  src={qrHeroDataUrl}
                  alt={`${currentService?.name || currentOrg?.name} QR Code`}
                  className="w-64 h-64 sm:w-72 sm:h-72 mx-auto object-contain block"
                />
              ) : (
                <div className="w-64 h-64 sm:w-72 sm:h-72 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating real QR code...
                </div>
              )}
            </div>

            {/* Clear Instructions for Camera */}
            <div className="space-y-1.5 max-w-sm mx-auto">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Point Phone Camera to Scan</span>
              </div>
              <p className="text-[12px] text-slate-600 font-medium">
                No app installation required. Get your digital token instantly and wait comfortably anywhere.
              </p>
            </div>

            {/* Standee Footer Stats */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {currentService ? `Avg Wait: ~${currentService.averageServiceTime}m` : 'Direct Department Selection'}
                </span>
              </div>
              <div className="font-bold text-slate-800">
                QVeue Smart Queue System
              </div>
            </div>
          </div>
        </div>

        {/* Details, Encoded URL & Action Buttons (5 cols on large) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>QR Verification & Actions</span>
          </h2>

          {/* Encoded URL Verification Box */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Actual Encoded Join URL
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                Active & Live
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-brand-300 break-all select-all">
              {targetJoinUrl}
            </div>

            {/* Test Link & Copy Link Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={targetJoinUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Open Join Page in a new tab to test customer flow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Scan Link</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopy(targetJoinUrl)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Download & Print Primary Action Cards */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Production Export
            </span>

            {/* Download PNG Button */}
            <button
              type="button"
              id="download-qr-btn"
              onClick={() => handleDownload(qrHeroDataUrl, heroFilename)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res PNG (1024px)</span>
            </button>

            {/* Print Standee Button */}
            <button
              type="button"
              id="print-qr-btn"
              onClick={handlePrint}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Counter Standee</span>
            </button>
          </div>

          {/* Quick Specifications Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2.5 text-xs text-slate-400">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              QR Code Engine Specifications
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span>Standard Format</span>
              <span className="font-bold text-white">ISO/IEC 18004 Compliant</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span>Error Correction</span>
              <span className="font-bold text-emerald-400">Level H (30% Damage Recovery)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span>Contrast Ratio</span>
              <span className="font-bold text-white">#070d1e on Pure White (21:1)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Phone Camera Support</span>
              <span className="font-bold text-sky-400">iOS Camera, Android Google Lens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch All Services QR Codes Section */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>All Service Lines in {currentOrg?.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Direct access QR codes for every department line under this organization.
            </p>
          </div>
          <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20 shrink-0">
            {services.length} Service {services.length === 1 ? 'Line' : 'Lines'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {services.map((srv) => {
            const srvId = srv._id || srv.id;
            const batchItem = batchQrUrls[srvId];
            const srvFilename = `${currentOrg?.name.replace(/\s+/g, '_')}_${srv.name.replace(/\s+/g, '_')}_QR`;

            return (
              <div
                key={srvId}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-[10px] font-bold mb-1">
                      Prefix: {srv.prefix}
                    </span>
                    <h4 className="font-bold text-sm text-white">{srv.name}</h4>
                    <span className="text-[11px] text-slate-400">
                      Avg wait: ~{srv.averageServiceTime} mins
                    </span>
                  </div>
                </div>

                {/* QR preview thumbnail */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 inline-block mx-auto text-center">
                  {batchItem?.dataUrl ? (
                    <img
                      src={batchItem.dataUrl}
                      alt={`${srv.name} QR`}
                      className="w-36 h-36 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      Loading QR...
                    </div>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 truncate bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                  {batchItem?.url}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={batchItem?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-center text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDownload(batchItem?.dataUrl, srvFilename)}
                    className="py-1.5 px-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-center text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>PNG</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QRCodeManagementPage;
