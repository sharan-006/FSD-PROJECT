import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  X,
  Building2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Wifi
} from 'lucide-react';
import { adminApi } from '../../services/api';

export function QRCodeModal({ organization, service, isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [networkIp, setNetworkIp] = useState('');
  const [useNetworkIp, setUseNetworkIp] = useState(true);

  // Fetch reachable LAN IP for phone scanning
  useEffect(() => {
    if (!isOpen) return;
    adminApi.getNetworkInfo()
      .then((res) => {
        if (res.success && res.data?.primaryIp) {
          setNetworkIp(res.data.primaryIp);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !organization) return null;

  const orgId = organization._id || organization.id;
  const srvId = service ? (service._id || service.id) : null;

  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  const baseUrl = (useNetworkIp && networkIp)
    ? `${protocol}//${networkIp}${port}`
    : window.location.origin;

  // Construct clean, valid join URL
  const joinUrl = srvId
    ? `${baseUrl}/join/${orgId}/${srvId}`
    : `${baseUrl}/join/${orgId}`;

  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
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
        if (!err) setQrDataUrl(url);
      }
    );
  }, [joinUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const namePart = service 
      ? `${organization.name.replace(/\s+/g, '_')}_${service.name.replace(/\s+/g, '_')}`
      : `${organization.name.replace(/\s+/g, '_')}_Main_Entrance`;
    link.download = `${namePart}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="glass-panel max-w-lg w-full rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up text-slate-100 my-8">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">{organization.name}</h3>
              <p className="text-xs text-purple-300 font-semibold">
                {service ? `${service.name} (Prefix: ${service.prefix})` : 'Main Entrance / All Services QR'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Counter Standee Layout */}
        <div className="p-6 space-y-5 print:p-0 print:m-0" id="printable-standee">
          {/* Host toggle for phone camera vs localhost */}
          {networkIp && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Phone Camera Mode:
              </span>
              <button
                type="button"
                onClick={() => setUseNetworkIp(!useNetworkIp)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  useNetworkIp
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {useNetworkIp ? `LAN IP (${networkIp})` : 'localhost'}
              </button>
            </div>
          )}

          {/* Printable Standee Card */}
          <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 text-center shadow-lg print:border-none print:shadow-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{service ? 'Digital Queue Fast Pass' : 'Digital Entrance Fast Pass'}</span>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {organization.name}
            </h2>
            <p className="text-sm font-bold text-brand-600">
              {service ? service.name : 'Welcome Desk • All Departments'}
            </p>

            {/* High-Res QR Code Image */}
            <div className="my-4 inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${service ? service.name : organization.name} QR Code`}
                  className="w-56 h-56 mx-auto object-contain"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating Real QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                {service ? `Scan with your phone to join the ${service.name} line` : 'Scan with your phone camera to select department & join queue'}
              </span>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                No app download required. Receive an instant digital token and monitor your wait time remotely.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
              {service ? <span>Avg Wait: ~{service.averageServiceTime}m</span> : <span>All Services Available</span>}
              <span>•</span>
              <span>QVeue Smart System</span>
            </div>
          </div>

          {/* Secure URL Display */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-2">
            <div className="truncate font-mono text-[11px] text-slate-300">
              {joinUrl}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-brand-200 shrink-0 flex items-center gap-1 transition-colors"
                title="Test Scan Link in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold hidden sm:inline">Test</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 flex items-center gap-1 transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Standee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
