// app/api/portfolio/spot/route.js
// Tüm anlık fiyat istekleri buradan geçer — CORS sorunu olmaz

import { NextResponse } from 'next/server';

// GET /api/portfolio/spot?symbols=ENJSA.IS,GARAN.IS,XAU,BTC
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) || [];

  if (symbols.length === 0) return NextResponse.json({});

  const results = {};

  // --- USD/TRY kuru (her şey için lazım) ---
  let usdTry = 38;
  let tryRates = {};
  try {
    const fxRes = await fetch('https://api.exchangerate-api.com/v4/latest/TRY', {
      next: { revalidate: 300 }, // 5 dk cache
    });
    const fxData = await fxRes.json();
    tryRates = fxData.rates || {};
    if (tryRates.USD) usdTry = 1 / tryRates.USD;
  } catch {}

  // Sembolleri kategoriye göre ayır
  const cryptos = symbols.filter(s => isCrypto(s));
  const bist    = symbols.filter(s => s.endsWith('.IS') || (!s.includes('.') && isBIST(s)));
  const nyse    = symbols.filter(s => s.includes('.') && !s.endsWith('.IS') && !isCrypto(s));
  const fxSyms  = symbols.filter(s => isFX(s));
  const isGold  = symbols.filter(s => isGoldSymbol(s));

  // --- Kripto (Coinbase) ---
  await Promise.allSettled(cryptos.map(async sym => {
    try {
      const r = await fetch(`https://api.coinbase.com/v2/prices/${sym}-USD/spot`);
      const d = await r.json();
      if (d.data?.amount) results[sym] = parseFloat(d.data.amount) * usdTry;
    } catch {}
  }));

  // --- Döviz (exchangerate-api) ---
  fxSyms.forEach(sym => {
    if (tryRates[sym]) results[sym] = 1 / tryRates[sym];
  });

  // --- Altın (Gold-API ücretsiz endpoint) ---
  await Promise.allSettled(isGold.map(async sym => {
    try {
      // metals-api.com yerine: frankfurter desteklemiyor, gold-api.com ücretsiz tier
      const r = await fetch('https://api.gold-api.com/price/XAU');
      const d = await r.json();
      if (d.price) results[sym] = (d.price/31.1) * usdTry; // USD/oz → TRY/gram değil ons
    } catch {
      // Fallback: Yahoo Finance ile XAU=X
      try {
        const r = await fetch(
          'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d'
        );
        const d = await r.json();
        const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) results[sym] = price * usdTry;
      } catch {}
    }
  }));

  // --- BIST Hisseleri (Yahoo Finance sunucu tarafı) ---
  const bistYahoo = bist.map(s => s.endsWith('.IS') ? s : `${s}.IS`);
  await Promise.allSettled(bistYahoo.map(async (yahooSym, i) => {
    const originalSym = bist[i];
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const d = await r.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) results[originalSym] = price; // BIST zaten TRY
    } catch {}
  }));

  // --- NYSE/NASDAQ Hisseleri ---
  await Promise.allSettled(nyse.map(async sym => {
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const d = await r.json();
      const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) results[sym] = price * usdTry; // USD → TRY
    } catch {}
  }));

  return NextResponse.json(results);
}

// Yardımcı fonksiyonlar
function isCrypto(sym) {
  return ['BTC','ETH','BNB','SOL','XRP','DOGE','ADA','AVAX','DOT','LINK',
          'MATIC','UNI','LTC','ATOM','NEAR'].includes(sym.toUpperCase());
}

function isFX(sym) {
  return ['USD','EUR','GBP','CHF','JPY','SAR','AED','CAD','AUD'].includes(sym.toUpperCase());
}

function isGoldSymbol(sym) {
  return ['XAU','GOLD','GC'].includes(sym.toUpperCase()) ||
         sym.toUpperCase().includes('ALTIN') ||
         sym.toUpperCase().includes('GOLD');
}

function isBIST(sym) {
  // Büyük harfli, 4-6 karakter, yaygın BIST sembolleri
  return /^[A-Z]{3,6}$/.test(sym) && !isCrypto(sym) && !isFX(sym);
}
