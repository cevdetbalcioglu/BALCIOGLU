'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Sabitler ──────────────────────────────────────────────
const CATEGORIES = [
  { key: 'ALL', label: 'Tümü' },
  { key: 'FOREX', label: 'Döviz' },
  { key: 'GOLD', label: 'Altın' },
  { key: 'STOCK', label: 'Hisse' },
  { key: 'FUND', label: 'Fon' },
  { key: 'CRYPTO', label: 'Kripto' },
];

const CATEGORY_LABELS = {
  FOREX: 'Döviz', GOLD: 'Altın', STOCK: 'Hisse', FUND: 'Fon', CRYPTO: 'Kripto', OTHER: 'Diğer',
};

const CATEGORY_COLORS = {
  FOREX: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  GOLD: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  STOCK: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  FUND: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  CRYPTO: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  OTHER: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// ── Yardımcı ──────────────────────────────────────────────
function fmt(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtTRY(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PnlBadge({ value }) {
  if (value === null || isNaN(value)) return <span className="text-slate-400 text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span className={`text-xs font-medium ${pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {pos ? '▲' : '▼'} {pos ? '+' : ''}{fmt(value)}%
    </span>
  );
}

// ── Ana Bileşen ──────────────────────────────────────────
export default function PortfolioPage() {
  const [assets, setAssets] = useState([]);
  const [balance, setBalance] = useState({ amount: 0, movements: [] });
  const [spotPrices, setSpotPrices] = useState({});
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modal, setModal] = useState(null); // 'buy' | 'sell' | 'balance' | 'note'
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Veri çekme ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [assetsRes, balanceRes] = await Promise.all([
      fetch('/api/portfolio/assets'),
      fetch('/api/portfolio/balance'),
    ]);
    const assetsData = await assetsRes.json();
    const balanceData = await balanceRes.json();
    setAssets(Array.isArray(assetsData) ? assetsData : []);
    setBalance(balanceData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Spot fiyatları çek — sunucu taraflı API üzerinden (CORS yok)
  useEffect(() => {
    async function fetchSpots() {
      if (assets.length === 0) return;
      try {
        const symbols = assets.map(a => a.symbol).join(',');
        const r = await fetch(`/api/portfolio/spot?symbols=${symbols}`);
        const data = await r.json();
        setSpotPrices(data);
      } catch {}
    }

    fetchSpots();
    const t = setInterval(fetchSpots, 30_000);
    return () => clearInterval(t);
  }, [assets]);

  // ── Hesaplamalar ──────────────────────────────────────
  function getCurrentPrice(asset) {
    return spotPrices[asset.symbol] || null;
  }

  function getCurrentValue(asset) {
    const p = getCurrentPrice(asset);
    if (!p) return null;
    return p * asset.quantity;
  }

  function getPnlPct(asset) {
    const p = getCurrentPrice(asset);
    if (!p || !asset.avgCost) return null;
    return ((p - asset.avgCost) / asset.avgCost) * 100;
  }

  function getTotalPortfolioValue() {
    return assets.reduce((sum, a) => {
      const v = getCurrentValue(a);
      return v ? sum + v : sum;
    }, 0);
  }

  function getTotalCost() {
    return assets.reduce((sum, a) => sum + (a.avgCost * a.quantity), 0);
  }

  // ── Filtre ──────────────────────────────────────────────
  const filtered = activeCategory === 'ALL'
    ? assets
    : assets.filter(a => a.category === activeCategory);

  // Kategoriye göre grupla
  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  // ── Form submit ──────────────────────────────────────────
  async function handleBuy(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: form.symbol?.toUpperCase(),
          name: form.name,
          category: form.category,
          quantity: parseFloat(form.quantity),
          pricePerUnit: parseFloat(form.pricePerUnit),
          spotPrice: spotPrices[form.symbol?.toUpperCase()] || null,
          transactedAt: form.transactedAt || new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      await loadData();
      setModal(null);
      setForm({});
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSell(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/assets/${selectedAsset.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(form.quantity),
          pricePerUnit: parseFloat(form.pricePerUnit),
          spotPrice: getCurrentPrice(selectedAsset),
          transactedAt: form.transactedAt || new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      await loadData();
      setModal(null);
      setForm({});
      setSelectedAsset(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBalance(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          type: form.balanceType || 'DEPOSIT',
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      await loadData();
      setModal(null);
      setForm({});
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNote(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/assets/${selectedAsset.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.noteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      await loadData();
      // selectedAsset'i güncelle
      setSelectedAsset(prev => ({ ...prev, notes: [data, ...(prev.notes || [])] }));
      setForm({});
      setModal(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Anlık fiyatı forma doldur
  function fillSpotPrice(symbol) {
    const spot = spotPrices[symbol?.toUpperCase()];
    if (spot) setForm(f => ({ ...f, pricePerUnit: spot.toFixed(4) }));
  }

  // ── UI ──────────────────────────────────────────────────
  const totalValue = getTotalPortfolioValue();
  const totalCost = getTotalCost();
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full mr-3" />
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Üst özet kartları ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Portföy Değeri" value={fmtTRY(totalValue)} sub={<PnlBadge value={totalPnlPct} />} color="blue" />
        <SummaryCard label="Toplam Maliyet" value={fmtTRY(totalCost)} sub={`${assets.length} varlık`} color="slate" />
        <SummaryCard
          label="Kâr / Zarar"
          value={fmtTRY(Math.abs(totalPnl))}
          sub={<span className={totalPnl >= 0 ? 'text-emerald-600 text-xs' : 'text-red-500 text-xs'}>{totalPnl >= 0 ? '▲ Kârda' : '▼ Zararda'}</span>}
          color={totalPnl >= 0 ? 'emerald' : 'red'}
        />
        <SummaryCard
          label="Yatırılabilir TL"
          value={fmtTRY(balance.amount)}
          sub={
            <button onClick={() => { setModal('balance'); setForm({ balanceType: 'DEPOSIT' }); }}
              className="text-xs text-blue-500 hover:underline">Bakiye güncelle</button>
          }
          color="violet"
        />
      </div>

      {/* ── Araç çubuğu ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                activeCategory === c.key
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent font-medium'
                  : 'bg-white dark:bg-gray-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setModal('buy'); setForm({ transactedAt: new Date().toISOString().slice(0, 16) }); }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
          + Varlık Ekle
        </button>
      </div>

      {/* ── Varlık listesi ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-500">Henüz varlık eklenmedi.</p>
          <button onClick={() => setModal('buy')}
            className="mt-4 text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            İlk Varlığı Ekle
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${CATEGORY_COLORS[cat]}`}>
                {CATEGORY_LABELS[cat]}
              </span>
              <span className="text-xs text-slate-400">{items.length} varlık</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-6 py-3 font-medium">Sembol</th>
                    <th className="text-right px-4 py-3 font-medium">Miktar</th>
                    <th className="text-right px-4 py-3 font-medium">Ort. Maliyet</th>
                    <th className="text-right px-4 py-3 font-medium">Anlık Fiyat</th>
                    <th className="text-right px-4 py-3 font-medium">Güncel Değer</th>
                    <th className="text-right px-4 py-3 font-medium">K/Z</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {items.map(asset => {
                    const spot = getCurrentPrice(asset);
                    const value = getCurrentValue(asset);
                    const pnlPct = getPnlPct(asset);
                    const pnlAbs = spot ? (spot - asset.avgCost) * asset.quantity : null;
                    const isSelected = selectedAsset?.id === asset.id;

                    return (
                      <>
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(isSelected ? null : asset)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{asset.symbol}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[120px]">{asset.name}</div>
                          </td>
                          <td className="text-right px-4 py-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                            {fmt(asset.quantity, 6).replace(/\.?0+$/, '')}
                          </td>
                          <td className="text-right px-4 py-4 text-slate-600 dark:text-slate-400 text-xs font-mono">
                            {fmtTRY(asset.avgCost)}
                          </td>
                          <td className="text-right px-4 py-4 text-slate-800 dark:text-slate-100 text-xs font-mono">
                            {spot ? fmtTRY(spot) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="text-right px-4 py-4 font-medium text-slate-800 dark:text-slate-100 text-xs">
                            {value ? fmtTRY(value) : '—'}
                          </td>
                          <td className="text-right px-4 py-4">
                            <div><PnlBadge value={pnlPct} /></div>
                            {pnlAbs !== null && (
                              <div className={`text-xs font-mono ${pnlAbs >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                {pnlAbs >= 0 ? '+' : ''}{fmtTRY(pnlAbs)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={ev => { ev.stopPropagation(); setSelectedAsset(asset); setModal('sell'); setForm({ quantity: '', pricePerUnit: spot?.toFixed(4) || '', transactedAt: new Date().toISOString().slice(0, 16) }); }}
                                className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
                                Sat
                              </button>
                              <button
                                onClick={ev => { ev.stopPropagation(); setSelectedAsset(asset); setModal('note'); setForm({}); }}
                                className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
                                Not
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Detay paneli */}
                        {isSelected && (
                          <tr key={`${asset.id}-detail`}>
                            <td colSpan={7} className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
                              <DetailPanel asset={asset} onClose={() => setSelectedAsset(null)} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Kategori footer — toplam değerler */}
            {(() => {
              const catTotalCost  = items.reduce((s, a) => s + a.avgCost * a.quantity, 0);
              const catTotalValue = items.reduce((s, a) => { const v = getCurrentValue(a); return v ? s + v : s; }, 0);
              const catTotalPnl   = catTotalValue - catTotalCost;
              const catPnlPct     = catTotalCost > 0 ? (catTotalPnl / catTotalCost) * 100 : null;
              const hasSpot       = items.some(a => getCurrentPrice(a) !== null);
              return (
                <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">
                    {items.length} varlık · Toplam Maliyet: <span className="text-slate-600 dark:text-slate-300">{fmtTRY(catTotalCost)}</span>
                  </span>
                  <div className="flex items-center gap-4">
                    {hasSpot && catTotalValue > 0 && (
                      <>
                        <span className="text-xs text-slate-400">
                          Güncel Değer: <span className="font-medium text-slate-700 dark:text-slate-200">{fmtTRY(catTotalValue)}</span>
                        </span>
                        <span className={`text-xs font-medium ${catTotalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {catTotalPnl >= 0 ? '▲' : '▼'} {catTotalPnl >= 0 ? '+' : ''}{fmtTRY(catTotalPnl)}
                          {catPnlPct !== null && <span className="ml-1 opacity-75">({catTotalPnl >= 0 ? '+' : ''}{fmt(catPnlPct, 2)}%)</span>}
                        </span>
                      </>
                    )}
                    {!hasSpot && (
                      <span className="text-xs text-slate-400 italic">Anlık fiyat bekleniyor...</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ))
      )}

      {/* ── Modaller ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setModal(null); setForm({}); setFormError(''); }}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>

            {/* Alış Modalı */}
            {modal === 'buy' && (
              <form onSubmit={handleBuy} className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Varlık Satın Al</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Kategori</label>
                    <select value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none">
                      <option value="">Seç</option>
                      <option value="FOREX">Döviz</option>
                      <option value="GOLD">Altın</option>
                      <option value="STOCK">Hisse</option>
                      <option value="FUND">Fon</option>
                      <option value="CRYPTO">Kripto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Sembol</label>
                    <input value={form.symbol || ''} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                      onBlur={e => fillSpotPrice(e.target.value)}
                      placeholder="BTC, USD, GARAN.IS..." required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Varlık Adı</label>
                  <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Bitcoin, Amerikan Doları..." required
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Miktar</label>
                    <input type="number" step="any" min="0" value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Birim Fiyat (TRY)
                      {spotPrices[form.symbol] && (
                        <button type="button" onClick={() => fillSpotPrice(form.symbol)}
                          className="ml-2 text-blue-500 hover:underline">Anlık: {fmtTRY(spotPrices[form.symbol])}</button>
                      )}
                    </label>
                    <input type="number" step="any" min="0" value={form.pricePerUnit || ''} onChange={e => setForm(f => ({ ...f, pricePerUnit: e.target.value }))} required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">İşlem Tarihi</label>
                  <input type="datetime-local" value={form.transactedAt || ''} onChange={e => setForm(f => ({ ...f, transactedAt: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                </div>
                {form.quantity && form.pricePerUnit && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg px-4 py-3 text-sm">
                    <span className="text-slate-500">Toplam tutar: </span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {fmtTRY(parseFloat(form.quantity) * parseFloat(form.pricePerUnit))}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">(bakiyeden düşülecek)</span>
                  </div>
                )}
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setModal(null); setForm({}); }} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">İptal</button>
                  <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                    {submitting ? 'Kaydediliyor...' : 'Satın Al'}
                  </button>
                </div>
              </form>
            )}

            {/* Satış Modalı */}
            {modal === 'sell' && selectedAsset && (
              <form onSubmit={handleSell} className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Sat — {selectedAsset.symbol}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Elinde: {fmt(selectedAsset.quantity, 6).replace(/\.?0+$/, '')} {selectedAsset.symbol}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Miktar</label>
                    <input type="number" step="any" min="0" max={selectedAsset.quantity}
                      value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      Satış Fiyatı (TRY)
                      {getCurrentPrice(selectedAsset) && (
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, pricePerUnit: getCurrentPrice(selectedAsset).toFixed(4) }))}
                          className="ml-1 text-blue-500 hover:underline text-xs">Anlık kullan</button>
                      )}
                    </label>
                    <input type="number" step="any" min="0" value={form.pricePerUnit || ''} onChange={e => setForm(f => ({ ...f, pricePerUnit: e.target.value }))} required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">İşlem Tarihi</label>
                  <input type="datetime-local" value={form.transactedAt || ''} onChange={e => setForm(f => ({ ...f, transactedAt: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                </div>
                {form.quantity && form.pricePerUnit && (
                  <div className="rounded-lg px-4 py-3 text-sm space-y-1 bg-slate-50 dark:bg-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Satış tutarı:</span>
                      <span className="font-medium">{fmtTRY(parseFloat(form.quantity) * parseFloat(form.pricePerUnit))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Maliyet:</span>
                      <span>{fmtTRY(parseFloat(form.quantity) * selectedAsset.avgCost)}</span>
                    </div>
                    {(() => {
                      const profit = (parseFloat(form.pricePerUnit) - selectedAsset.avgCost) * parseFloat(form.quantity);
                      return (
                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500">Kâr / Zarar:</span>
                          <span className={`font-medium ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}{fmtTRY(profit)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setModal(null); setForm({}); }} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">İptal</button>
                  <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium">
                    {submitting ? 'Kaydediliyor...' : 'Sat'}
                  </button>
                </div>
              </form>
            )}

            {/* Bakiye Modalı */}
            {modal === 'balance' && (
              <form onSubmit={handleBalance} className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Bakiye Güncelle</h3>
                <div className="flex gap-2">
                  {['DEPOSIT', 'WITHDRAW'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, balanceType: t }))}
                      className={`flex-1 text-sm py-2 rounded-lg border font-medium transition-all ${
                        form.balanceType === t
                          ? t === 'DEPOSIT' ? 'bg-emerald-500 text-white border-transparent' : 'bg-red-500 text-white border-transparent'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}>
                      {t === 'DEPOSIT' ? '+ Yükle' : '- Çek'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tutar (TRY)</label>
                  <input type="number" step="any" min="0" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Açıklama (opsiyonel)</label>
                  <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Maaş, birikim, vb."
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-sm flex justify-between">
                  <span className="text-slate-500">Mevcut bakiye:</span>
                  <span className="font-medium">{fmtTRY(balance.amount)}</span>
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setModal(null); setForm({}); }} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">İptal</button>
                  <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                    {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            )}

            {/* Not Modalı */}
            {modal === 'note' && selectedAsset && (
              <form onSubmit={handleNote} className="space-y-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Not Ekle — {selectedAsset.symbol}</h3>
                <textarea
                  value={form.noteContent || ''} onChange={e => setForm(f => ({ ...f, noteContent: e.target.value }))}
                  placeholder="Bu varlık hakkında notunuzu yazın..." rows={4} required
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none resize-none" />
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setModal(null); setForm({}); }} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">İptal</button>
                  <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                    {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Özet Kart ───────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    slate: 'bg-slate-50 dark:bg-slate-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950',
    red: 'bg-red-50 dark:bg-red-950',
    violet: 'bg-violet-50 dark:bg-violet-950',
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color] || colors.slate}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
      <div className="mt-1">{typeof sub === 'string' ? <span className="text-xs text-slate-400">{sub}</span> : sub}</div>
    </div>
  );
}

// ── Detay Paneli ─────────────────────────────────────────────
function DetailPanel({ asset }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* İşlem geçmişi */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">İşlem Geçmişi</p>
        {asset.transactions.length === 0 ? (
          <p className="text-xs text-slate-400">Henüz işlem yok.</p>
        ) : (
          <div className="space-y-2">
            {asset.transactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    tx.type === 'BUY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>{tx.type === 'BUY' ? 'AL' : 'SAT'}</span>
                  <span className="text-slate-500">{new Date(tx.transactedAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="text-right">
                  <div className="text-slate-700 dark:text-slate-300 font-mono">
                    {tx.quantity} × ₺{tx.pricePerUnit.toFixed(2)}
                  </div>
                  <div className="text-slate-400">= ₺{tx.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notlar */}
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Notlar</p>
        {asset.notes.length === 0 ? (
          <p className="text-xs text-slate-400">Henüz not eklenmedi.</p>
        ) : (
          <div className="space-y-2">
            {asset.notes.map(note => (
              <div key={note.id} className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-700 dark:text-slate-300">{note.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(note.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
