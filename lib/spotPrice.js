// lib/spotPrice.js
// Anlık fiyat çekme yardımcısı — Coinbase (kripto) + exchangerate-api (döviz) + Yahoo Finance (hisse/fon)

const CATEGORY_MAP = {
  CRYPTO: 'coinbase',
  FOREX: 'fx',
  GOLD: 'fx',
  STOCK: 'yahoo',
  FUND: 'yahoo',
};

// TRY karşılığı fiyat döner
export async function fetchSpotPriceTRY(symbol, category) {
  const source = CATEGORY_MAP[category] || 'manual';

  try {
    if (source === 'coinbase') {
      const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
      const data = await res.json();
      const usdPrice = parseFloat(data.data.amount);
      const tryRate = await getUsdTryRate();
      return usdPrice * tryRate;
    }

    if (source === 'fx') {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      const data = await res.json();
      if (symbol === 'XAU') {
        // Altın ons USD fiyatı ayrıca çekilmeli — burada yaklaşık
        return null;
      }
      return data.rates[symbol] ? 1 / data.rates[symbol] : null;
    }

    if (source === 'yahoo') {
      // Yahoo Finance gayri resmi endpoint
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (!price) return null;

      // BIST hisseleri zaten TRY, NYSE hisseleri USD
      const isTRY = symbol.endsWith('.IS'); // GARAN.IS, THYAO.IS vb.
      if (isTRY) return price;

      const tryRate = await getUsdTryRate();
      return price * tryRate;
    }
  } catch (e) {
    console.error('Spot fiyat alınamadı:', symbol, e);
    return null;
  }

  return null;
}

async function getUsdTryRate() {
  const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await res.json();
  return data.rates.TRY || 38;
}
