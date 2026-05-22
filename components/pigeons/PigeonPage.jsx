'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Sabitler ─────────────────────────────────────────────
const TABS = [
  { key: 'pigeons',  label: '🐦 Kuşlarım'    },
  { key: 'teams',    label: '🏠 Takımlar'    },
  { key: 'hatch',    label: '🥚 Kuluçka'     },
  { key: 'pedigree', label: '🌳 Pedigri'     },
];

const GENDER_COLORS = {
  'Erkek': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'Dişi':  'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('tr-TR');
}

function Badge({ text, color }) {
  return text ? (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
      {text}
    </span>
  ) : null;
}

function InputField({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 transition-colors" />
    </div>
  );
}

// ── Modal wrapper ────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Pedigri ağacı bileşeni ───────────────────────────────
function PedigreeTree({ pigeon, pigeons, clutches, depth = 0 }) {
  if (depth > 2) return null;

  // Bu kuşun ebeveynlerini bul
  const egg = pigeon?.hatchedIn?.[0];
  const clutch = egg?.clutch;
  const father = clutch?.father;
  const mother = clutch?.mother;

  return (
    <div className="flex items-start gap-3">
      <div className={`rounded-lg border p-3 min-w-[160px] ${
        depth === 0
          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900'
      }`}>
        <p className="text-xs font-mono text-slate-400">{pigeon?.ringId || '?'}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5">{pigeon?.ringLabel || 'Bilinmiyor'}</p>
        {pigeon?.gender && <Badge text={pigeon.gender} color={GENDER_COLORS[pigeon.gender]} />}
        {clutch && (
          <p className="text-xs text-slate-400 mt-1">
            Takım {clutch.team?.teamNo} · Tur {clutch.round}
          </p>
        )}
      </div>

      {(father || mother) && depth < 2 && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 border-t border-slate-300" />
            <div className="text-xs text-slate-400">♂</div>
            <PedigreeTree pigeon={father} pigeons={pigeons} clutches={clutches} depth={depth + 1} />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 border-t border-slate-300" />
            <div className="text-xs text-slate-400">♀</div>
            <PedigreeTree pigeon={mother} pigeons={pigeons} clutches={clutches} depth={depth + 1} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana sayfa ────────────────────────────────────────────
export default function PigeonPage() {
  const [tab, setTab]         = useState('pigeons');
  const [pigeons, setPigeons] = useState([]);
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [pedigreeTarget, setPedigreeTarget] = useState(null);

  const F = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const safeJson = async (url) => {
        const r = await fetch(url);
        const text = await r.text();
        if (!text) return [];
        try { return JSON.parse(text); } catch { return []; }
      };
      const [pr, tr] = await Promise.all([safeJson('/api/pigeons'), safeJson('/api/pigeons/teams')]);
      setPigeons(Array.isArray(pr) ? pr : []);
      setTeams(Array.isArray(tr) ? tr : []);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Tüm clutch'ları düzleştir
  const allClutches = teams.flatMap(t => t.clutches || []);

  async function handleImport() {
    setImporting(true);
    try {
      const r = await fetch('/api/pigeons/import', { method: 'POST' });
      const d = await r.json();
      if (r.ok) { setImportDone(true); await load(); }
    } catch {}
    setImporting(false);
  }

  // ── Kuş ekle/düzenle ──────────────────────────────────
  async function savePigeon(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const isEdit = modal === 'editPigeon';
      const res = await fetch(isEdit ? `/api/pigeons/${selected.id}` : '/api/pigeons', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await load(); closeModal();
    } catch(err) { setError(err.message); }
    setSubmitting(false);
  }

  async function deletePigeon(id) {
    if (!confirm('Bu kuşu silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/pigeons/${id}`, { method: 'DELETE' });
    await load(); closeModal();
  }

  // ── Takım ekle ────────────────────────────────────────
  async function saveTeam(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const res = await fetch('/api/pigeons/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await load(); closeModal();
    } catch(err) { setError(err.message); }
    setSubmitting(false);
  }

  // ── Kuluçka ekle ──────────────────────────────────────
  async function saveClutch(e) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const res = await fetch('/api/pigeons/clutches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, chicks: form.chicks || [] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await load(); closeModal();
    } catch(err) { setError(err.message); }
    setSubmitting(false);
  }

  function closeModal() { setModal(null); setSelected(null); setForm({}); setError(''); }

  function openEditPigeon(p) {
    setSelected(p);
    setForm({ ringLabel: p.ringLabel, gender: p.gender, performance: p.performance, health: p.health, notes: p.notes });
    setModal('editPigeon');
  }

  // Filtreli kuş listesi
  const filteredPigeons = pigeons.filter(p => {
    const q = search.toLowerCase();
    return !q || p.ringId.toLowerCase().includes(q) || p.ringLabel.toLowerCase().includes(q) || p.gender?.toLowerCase().includes(q);
  });

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kuşlarım 🐦</h1>
          <p className="text-sm text-slate-400 mt-1">{pigeons.length} kuş · {teams.length} takım · {allClutches.length} kuluçka kaydı</p>
        </div>
        {!importDone && pigeons.length === 0 && (
          <button onClick={handleImport} disabled={importing}
            className="text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
            {importing ? '⏳ İçe aktarılıyor...' : '📥 Excel\'den İçe Aktar'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full mr-3" />
          Yükleniyor...
        </div>
      ) : (
        <>
          {/* ── KUŞLARIM ── */}
          {tab === 'pigeons' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Bileziğe veya isme göre ara..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 outline-none focus:border-blue-400 transition-colors text-slate-800 dark:text-slate-100" />
                <button onClick={() => { setForm({}); setModal('addPigeon'); }}
                  className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  + Kuş Ekle
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-6 py-3 font-medium">Bilezik ID</th>
                      <th className="text-left px-4 py-3 font-medium">Renk / Etiket</th>
                      <th className="text-center px-4 py-3 font-medium">Cinsiyet</th>
                      <th className="text-left px-4 py-3 font-medium">Ebeveyn Takım</th>
                      <th className="text-left px-4 py-3 font-medium">Not</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredPigeons.map(p => {
                      const egg = p.hatchedIn?.[0];
                      const parentInfo = egg?.clutch ? `Takım ${egg.clutch.team?.teamNo} · Tur ${egg.clutch.round}` : '—';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">{p.ringId}</td>
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{p.ringLabel}</td>
                          <td className="px-4 py-3 text-center">
                            {p.gender ? <Badge text={p.gender} color={GENDER_COLORS[p.gender]} /> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{parentInfo}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[150px] truncate">{p.notes || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => { setPedigreeTarget(p); setTab('pedigree'); }}
                                className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                🌳
                              </button>
                              <button onClick={() => openEditPigeon(p)}
                                className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredPigeons.length === 0 && (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    {pigeons.length === 0 ? 'Henüz kuş eklenmedi. Excel\'den içe aktar veya manuel ekle.' : 'Sonuç bulunamadı.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAKIMLAR ── */}
          {tab === 'teams' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setForm({}); setModal('addTeam'); }}
                  className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  + Takım Ekle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">Takım {team.teamNo}</span>
                        {team.season && <Badge text={team.season} />}
                      </div>
                      {team.ringColor && (
                        <span className="text-xs text-slate-400">{team.ringColor}</span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-pink-500 w-4">♀</span>
                        <span className="text-slate-700 dark:text-slate-300">{team.motherLabel || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 w-4">♂</span>
                        <span className="text-slate-700 dark:text-slate-300">{team.fatherLabel || '—'}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400">{team.clutches?.length || 0} kuluçka turu</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {team.clutches?.map(c => (
                          <span key={c.id} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                            Tur {c.round}: {c.eggs?.length || 0} yavru
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <div className="col-span-3 p-12 text-center text-slate-400 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    Henüz takım oluşturulmadı.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── KULUÇKA TAKİP ── */}
          {tab === 'hatch' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setForm({ chicks: [] }); setModal('addClutch'); }}
                  className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                  + Kuluçka Kaydı
                </button>
              </div>

              {teams.map(team => team.clutches?.length > 0 && (
                <div key={team.id} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Takım {team.teamNo}</span>
                    <span className="text-sm text-pink-500">♀ {team.motherLabel}</span>
                    <span className="text-sm text-blue-500">♂ {team.fatherLabel}</span>
                    {team.season && <Badge text={team.season} />}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left px-6 py-2 font-medium">Tur</th>
                        <th className="text-left px-4 py-2 font-medium">Yumurta Tarihi</th>
                        <th className="text-left px-4 py-2 font-medium">Çıkış Tarihi</th>
                        <th className="text-left px-4 py-2 font-medium">Yavrular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {team.clutches.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">Tur {c.round}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{fmt(c.eggDate)}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{fmt(c.hatchDate)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {c.eggs?.map(egg => (
                                <span key={egg.id} className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                                  {egg.pigeon?.ringLabel || egg.pigeon?.ringId || '?'}
                                </span>
                              ))}
                              {(!c.eggs || c.eggs.length === 0) && <span className="text-xs text-slate-300">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {allClutches.length === 0 && (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  Henüz kuluçka kaydı yok.
                </div>
              )}
            </div>
          )}

          {/* ── PEDİGRİ ── */}
          {tab === 'pedigree' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select value={pedigreeTarget?.id || ''}
                  onChange={e => setPedigreeTarget(pigeons.find(p => p.id === e.target.value) || null)}
                  className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none">
                  <option value="">Kuş seçin...</option>
                  {pigeons.map(p => (
                    <option key={p.id} value={p.id}>{p.ringId} — {p.ringLabel}</option>
                  ))}
                </select>
              </div>

              {pedigreeTarget ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-x-auto">
                  <p className="text-xs text-slate-400 mb-4">Soy ağacı (3 nesil)</p>
                  <PedigreeTree pigeon={pedigreeTarget} pigeons={pigeons} clutches={allClutches} />
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  Pedigrisini görmek istediğiniz kuşu seçin.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODALLER ── */}

      {/* Kuş ekle */}
      {(modal === 'addPigeon' || modal === 'editPigeon') && (
        <Modal title={modal === 'addPigeon' ? '+ Yeni Kuş' : 'Kuşu Düzenle'} onClose={closeModal}>
          <form onSubmit={savePigeon} className="space-y-4">
            {modal === 'addPigeon' && (
              <InputField label="Bilezik ID *" value={form.ringId} onChange={F('ringId')} placeholder="TR-26-T4-01" required />
            )}
            <InputField label="Bilezik Renk / Etiket *" value={form.ringLabel} onChange={F('ringLabel')} placeholder="Mavi - 15" required />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cinsiyet</label>
              <div className="flex gap-2">
                {['Erkek', 'Dişi'].map(g => (
                  <button key={g} type="button" onClick={() => F('gender')(g)}
                    className={`flex-1 text-sm py-2 rounded-lg border transition-all ${
                      form.gender === g ? 'bg-blue-500 text-white border-transparent' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>{g}</button>
                ))}
              </div>
            </div>
            <InputField label="Performans" value={form.performance} onChange={F('performance')} placeholder="İyi, Orta..." />
            <InputField label="Sağlık" value={form.health} onChange={F('health')} placeholder="Sağlıklı, Tedavide..." />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Not</label>
              <textarea value={form.notes || ''} onChange={e => F('notes')(e.target.value)} rows={2}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none resize-none" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              {modal === 'editPigeon' && (
                <button type="button" onClick={() => deletePigeon(selected.id)}
                  className="text-sm px-3 py-2 text-red-500 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 transition-colors">Sil</button>
              )}
              <button type="button" onClick={closeModal} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">İptal</button>
              <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Takım ekle */}
      {modal === 'addTeam' && (
        <Modal title="+ Yeni Takım" onClose={closeModal}>
          <form onSubmit={saveTeam} className="space-y-4">
            <InputField label="Takım No *" value={form.teamNo} onChange={F('teamNo')} placeholder="4" type="number" required />
            <InputField label="Sezon" value={form.season} onChange={F('season')} placeholder="2025-2026" />
            <InputField label="Anne (Bilezik Etiketi)" value={form.motherLabel} onChange={F('motherLabel')} placeholder="Siyah 081" />
            <InputField label="Baba (Bilezik Etiketi)" value={form.fatherLabel} onChange={F('fatherLabel')} placeholder="Kırmızı Çıt Hayrabolu" />
            <InputField label="Bilezik Rengi" value={form.ringColor} onChange={F('ringColor')} placeholder="Mor - Mor" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeModal} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">İptal</button>
              <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Kuluçka ekle */}
      {modal === 'addClutch' && (
        <Modal title="🥚 Kuluçka Kaydı" onClose={closeModal}>
          <form onSubmit={saveClutch} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Takım *</label>
              <select value={form.teamId || ''} onChange={e => F('teamId')(e.target.value)} required
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none">
                <option value="">Takım seçin</option>
                {teams.map(t => <option key={t.id} value={t.id}>Takım {t.teamNo} — {t.motherLabel} × {t.fatherLabel}</option>)}
              </select>
            </div>
            <InputField label="Tur *" value={form.round} onChange={F('round')} placeholder="1" type="number" required />
            <InputField label="Yumurta Tarihi" value={form.eggDate} onChange={F('eggDate')} type="date" />
            <InputField label="Çıkış Tarihi" value={form.hatchDate} onChange={F('hatchDate')} type="date" />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Yavrular (birden fazla seçilebilir)</label>
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                {pigeons.filter(p => !p.hatchedIn?.length).map(p => (
                  <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox"
                      checked={(form.chicks || []).includes(p.id)}
                      onChange={e => {
                        const curr = form.chicks || [];
                        F('chicks')(e.target.checked ? [...curr, p.id] : curr.filter(id => id !== p.id));
                      }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{p.ringId} — {p.ringLabel}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeModal} className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500">İptal</button>
              <button type="submit" disabled={submitting} className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium">
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}