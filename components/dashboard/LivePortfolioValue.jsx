'use client';

import { useState, useEffect } from 'react';

export default function LivePortfolioValue({ assets }) {
  const [totalValue, setTotalValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assets || assets.length === 0) { setLoading(false); return; }

    async function fetch_() {
      try {
        const symbols = assets.map(a => a.symbol).join(',');
        const r = await fetch(`/api/portfolio/spot?symbols=${symbols}`);
        const prices = await r.json();

        const total = assets.reduce((sum, a) => {
          const p = prices[a.symbol];
          return p ? sum + p * a.quantity : sum;
        }, 0);

        setTotalValue(total);
      } catch {}
      setLoading(false);
    }

    fetch_();
    const t = setInterval(fetch_, 30_000);
    return () => clearInterval(t);
  }, [assets]);

  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">Portföy Değeri</p>
      {loading ? (
        <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
      ) : totalValue !== null ? (
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
          ₺{totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
        </p>
      ) : (
        <p className="text-base font-semibold text-slate-400">—</p>
      )}
    </div>
  );
}
