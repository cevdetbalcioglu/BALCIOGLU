'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const FX_LIST = [
  { sym: 'USD', name: 'Amerikan Doları', type: 'fx' },
  { sym: 'EUR', name: 'Euro', type: 'fx' },
  { sym: 'GBP', name: 'İngiliz Sterlini', type: 'fx' },
  { sym: 'CHF', name: 'İsviçre Frangı', type: 'fx' },
  { sym: 'JPY', name: 'Japon Yeni', type: 'fx' },
  { sym: 'SAR', name: 'S. Arabistan Riyali', type: 'fx' },
  { sym: 'AED', name: 'BAE Dirhemi', type: 'fx' },
  { sym: 'XAU', name: 'Altın (ons/TRY)', type: 'fx' },
];

const CRYPTO_LIST = [
  { sym: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { sym: 'ETH', name: 'Ethereum', type: 'crypto' },
  { sym: 'BNB', name: 'BNB', type: 'crypto' },
  { sym: 'SOL', name: 'Solana', type: 'crypto' },
  { sym: 'XRP', name: 'XRP', type: 'crypto' },
  { sym: 'DOGE', name: 'Dogecoin', type: 'crypto' },
  { sym: 'ADA', name: 'Cardano', type: 'crypto' },
  { sym: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { sym: 'DOT', name: 'Polkadot', type: 'crypto' },
  { sym: 'LINK', name: 'Chainlink', type: 'crypto' },
];

const ALL_LIST = [...FX_LIST, ...CRYPTO_LIST];

const FX_FALLBACK = {
  USD: 38.2, EUR: 41.5, GBP: 48.1, CHF: 43.2,
  JPY: 0.254, SAR: 10.18, AED: 10.4, XAU: 78200,
};

function formatPrice(sym, val) {
  if (!val) return '—';
  if (sym === 'JPY') return val.toFixed(3);
  if (sym === 'XAU') return val.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  if (['BTC', 'ETH', 'BNB', 'SOL', 'AVAX'].includes(sym))
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val < 0.01) return '$' + val.toFixed(6);
  if (val < 1) return '$' + val.toFixed(4);
  if (val < 100) return '$' + val.toFixed(2);
  return val.toFixed(4);
}

function formatChange(cur, prev) {
  if (!prev || !cur) return { text: '—', type: 'neutral' };
  const pct = ((cur - prev) / prev) * 100;
  const sign = pct > 0 ? '+' : '';
  const type = pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : 'neutral';
  const arrow = pct > 0.005 ? '▲' : pct < -0.005 ? '▼' : '—';
  return { text: `${arrow} ${sign}${pct.toFixed(2)}%`, type };
}

const CHANGE_COLORS = {
  up: 'text-emerald-700 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-slate-400',
};

function StarIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MarketCard({ item, price, prevPrice, isStarred, onToggleStar }) {
  const change = formatChange(price, prevPrice);
  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-xl border transition-all p-3
      ${isStarred ? 'border-amber-300 dark:border-amber-600' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
      <button
        onClick={() => onToggleStar(item.sym)}
        className={`absolute top-2 right-2 p-1 rounded transition-colors
          ${isStarred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
        aria-label={isStarred ? 'Yıldızı kaldır' : 'Yıldızla'}
      >
        <StarIcon filled={isStarred} />
      </button>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{item.sym}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 pr-5 truncate">{item.name}</p>
      <p className="text-base font-medium text-slate-800 dark:text-slate-100 tracking-tight">
        {formatPrice(item.sym, price)}
      </p>
      <p className={`text-xs mt-0.5 ${CHANGE_COLORS[change.type]}`}>{change.text}</p>
    </div>
  );
}

const TABS = [
  { key: 'starred', label: 'Yıldızlarım' },
  { key: 'fx', label: 'Döviz' },
  { key: 'crypto', label: 'Kripto' },
  { key: 'all', label: 'Tümü' },
];

export default function MarketWidget() {
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [starred, setStarred] = useState(['USD', 'EUR', 'BTC', 'ETH']);
  const [tab, setTab] = useState('starred');
  const [search, setSearch] = useState('');
  const [clock, setClock] = useState('');
  const [updateCount, setUpdateCount] = useState(0);
  const prevRef = useRef({});

  // Load starred from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mkt_starred');
      if (saved) setStarred(JSON.parse(saved));
    } catch {}
  }, []);

  function toggleStar(sym) {
    setStarred(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      try { localStorage.setItem('mkt_starred', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const fetchFX = useCallback(async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      const data = await res.json();
      setPrices(prev => {
        const next = { ...prev };
        FX_LIST.forEach(item => {
          if (item.sym === 'XAU') return;
          if (data.rates[item.sym]) next[item.sym] = 1 / data.rates[item.sym];
        });
        if (!next['XAU']) next['XAU'] = FX_FALLBACK.XAU;
        return next;
      });
    } catch {
      setPrices(prev => ({ ...FX_FALLBACK, ...prev }));
    }
  }, []);

  const fetchCrypto = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        CRYPTO_LIST.map(c =>
          fetch(`https://api.coinbase.com/v2/prices/${c.sym}-USD/spot`).then(r => r.json())
        )
      );
      setPrices(prev => {
        const next = { ...prev };
        results.forEach((res, i) => {
          if (res.status === 'fulfilled' && res.value?.data?.amount) {
            next[CRYPTO_LIST[i].sym] = parseFloat(res.value.data.amount);
          }
        });
        return next;
      });
    } catch {}
  }, []);

  // Tick every 5 seconds — only crypto (FX every 5 min)
  useEffect(() => {
    let fxTimer;
    async function init() {
      await fetchFX();
      await fetchCrypto();
      setUpdateCount(c => c + 1);
      fxTimer = setInterval(fetchFX, 300_000);
    }
    init();

    const cryptoTimer = setInterval(async () => {
      setPrevPrices({ ...prevRef.current });
      await fetchCrypto();
      setUpdateCount(c => c + 1);
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    }, 5_000);

    const clockTimer = setInterval(() => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    }, 1_000);

    return () => {
      clearInterval(fxTimer);
      clearInterval(cryptoTimer);
      clearInterval(clockTimer);
    };
  }, [fetchFX, fetchCrypto]);

  // Keep prevRef in sync
  useEffect(() => { prevRef.current = prices; }, [prices]);

  function getList() {
    const base = tab === 'fx' ? FX_LIST : tab === 'crypto' ? CRYPTO_LIST : ALL_LIST;
    if (!search) return tab === 'starred' ? ALL_LIST.filter(i => starred.includes(i.sym)) : base;
    const q = search.toLowerCase();
    return base.filter(i => i.sym.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  }

  const list = getList();
  const fxItems = list.filter(i => i.type === 'fx');
  const cryptoItems = list.filter(i => i.type === 'crypto');
  const showSections = tab === 'starred' || tab === 'all';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Piyasa Takibi</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">{clock}</span>
          <span className="text-xs text-slate-400">{updateCount} güncelleme</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              tab === t.key
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 font-medium'
                : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}>
            {t.key === 'starred' && '★ '}{t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === 'all' || tab === 'crypto' || tab === 'fx') && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sembol veya isim ara..."
          className="w-full mb-4 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
        />
      )}

      {/* Cards */}
      {tab === 'starred' && list.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          <p className="text-2xl mb-2">☆</p>
          Henüz yıldızlanmış varlık yok.<br />
          Döviz veya Kripto sekmesinden ekleyin.
        </div>
      ) : showSections ? (
        <div className="space-y-4">
          {fxItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Döviz</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fxItems.map(item => (
                  <MarketCard key={item.sym} item={item}
                    price={prices[item.sym]} prevPrice={prevPrices[item.sym]}
                    isStarred={starred.includes(item.sym)} onToggleStar={toggleStar} />
                ))}
              </div>
            </div>
          )}
          {cryptoItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Kripto</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cryptoItems.map(item => (
                  <MarketCard key={item.sym} item={item}
                    price={prices[item.sym]} prevPrice={prevPrices[item.sym]}
                    isStarred={starred.includes(item.sym)} onToggleStar={toggleStar} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {list.map(item => (
            <MarketCard key={item.sym} item={item}
              price={prices[item.sym]} prevPrice={prevPrices[item.sym]}
              isStarred={starred.includes(item.sym)} onToggleStar={toggleStar} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mt-4">
        Coinbase (kripto, ~5sn) · exchangerate-api.com (döviz, 5dk)
      </p>
    </div>
  );
}
