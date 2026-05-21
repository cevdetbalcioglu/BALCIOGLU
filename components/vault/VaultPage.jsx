'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ── Kategori tanımları ──────────────────────────────────────
const CATEGORIES = [
  { key: 'all',   label: 'Tümü',    icon: '🗂️' },
  { key: 'login', label: 'Giriş',   icon: '🔐' },
  { key: 'card',  label: 'Kart',    icon: '💳' },
  { key: 'note',  label: 'Not',     icon: '📝' },
  { key: 'other', label: 'Diğer',   icon: '📦' },
];

const CAT_COLORS = {
  login: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  card:  'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  note:  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  other: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const CAT_ICONS = { login: '🔐', card: '💳', note: '📝', other: '📦' };

// ── İkonlar ────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

// ── Şifre gücü ─────────────────────────────────────────────
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Çok Zayıf', color: 'bg-red-500' },
    { label: 'Zayıf',     color: 'bg-orange-400' },
    { label: 'Orta',      color: 'bg-yellow-400' },
    { label: 'İyi',       color: 'bg-blue-400' },
    { label: 'Güçlü',     color: 'bg-emerald-500' },
    { label: 'Çok Güçlü', color: 'bg-emerald-600' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

// ── Rastgele şifre üretici ─────────────────────────────────
function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Kopyalama ──────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };
  return { copy, copied };
}

// ── Ana bileşen ────────────────────────────────────────────
export default function VaultPage() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [modal, setModal]         = useState(null); // 'add' | 'edit' | 'view'
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPasswords, setShowPasswords] = useState({}); // id → bool
  const [showFormPass, setShowFormPass]   = useState(false);
  const { copy, copied } = useCopy();

  // ── Veri çek ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/vault');
      const d = await r.json();
      setItems(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtre ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || item.title.toLowerCase().includes(q) ||
        item.username?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, search]);

  const favorites = filtered.filter(i => i.isFavorite);
  const rest      = filtered.filter(i => !i.isFavorite);

  // ── Form submit ──────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const isEdit = modal === 'edit' && selected;
      const url    = isEdit ? `/api/vault/${selected.id}` : '/api/vault';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      await load();
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
    closeModal();
  }

  async function toggleFavorite(item) {
    await fetch(`/api/vault/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: !item.isFavorite }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i));
  }

  function openAdd() {
    setForm({ category: 'login' });
    setShowFormPass(false);
    setFormError('');
    setModal('add');
  }

  function openEdit(item) {
    setSelected(item);
    setForm({ title: item.title, category: item.category, username: item.username || '', password: item.password, url: item.url || '', notes: item.notes || '' });
    setShowFormPass(false);
    setFormError('');
    setModal('edit');
  }

  function openView(item) {
    setSelected(item);
    setModal('view');
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setForm({});
    setFormError('');
    setShowFormPass(false);
  }

  function toggleShowPass(id) {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const strength = passwordStrength(form.password);

  // ── UI ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Başlık + ekle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Şifre Yönetimi 🔑</h1>
          <p className="text-sm text-slate-400 mt-0.5">{items.length} kayıt · AES-256 şifreli</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
          + Yeni Kayıt
        </button>
      </div>

      {/* Arama + kategori */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Site, kullanıcı adı, URL ara..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 transition-colors" />
        </div>
        <div className="flex gap-1.5">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                activeCategory === c.key
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent font-medium'
                  : 'bg-white dark:bg-gray-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Yükleniyor */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full mr-3" />
          Yükleniyor...
        </div>
      )}

      {/* Boş durum */}
      {!loading && items.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <p className="text-5xl mb-3">🔑</p>
          <p className="text-slate-500 mb-4">Henüz kayıt eklenmedi.</p>
          <button onClick={openAdd} className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            İlk Kaydı Ekle
          </button>
        </div>
      )}

      {/* Favoriler */}
      {!loading && favorites.length > 0 && (
        <Section title="⭐ Favoriler" items={favorites}
          onView={openView} onEdit={openEdit} onFavorite={toggleFavorite}
          onCopy={copy} copied={copied} showPasswords={showPasswords} onTogglePass={toggleShowPass} />
      )}

      {/* Diğerleri */}
      {!loading && rest.length > 0 && (
        <Section title={favorites.length > 0 ? 'Diğer Kayıtlar' : 'Tüm Kayıtlar'} items={rest}
          onView={openView} onEdit={openEdit} onFavorite={toggleFavorite}
          onCopy={copy} copied={copied} showPasswords={showPasswords} onTogglePass={toggleShowPass} />
      )}

      {/* Arama sonucu boş */}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          "{search}" için sonuç bulunamadı.
        </div>
      )}

      {/* ── Modallar ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={e => e.stopPropagation()}>

            {/* Ekle / Düzenle */}
            {(modal === 'add' || modal === 'edit') && (
              <form onSubmit={handleSave}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {modal === 'add' ? '+ Yeni Kayıt' : 'Kaydı Düzenle'}
                  </h3>
                  <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {/* Kategori */}
                  <div className="flex gap-2">
                    {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                      <button key={c.key} type="button"
                        onClick={() => setForm(f => ({ ...f, category: c.key }))}
                        className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all ${
                          form.category === c.key
                            ? 'bg-blue-500 text-white border-transparent'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Başlık */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Başlık *</label>
                    <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Gmail, Garanti İnternet Bankacılığı..."
                      required className="input-base w-full" />
                  </div>

                  {/* Kullanıcı adı / URL */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Kullanıcı Adı / E-posta</label>
                      <input value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        placeholder="ornek@mail.com" className="input-base w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">URL</label>
                      <input value={form.url || ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        placeholder="https://..." className="input-base w-full" />
                    </div>
                  </div>

                  {/* Şifre */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Şifre *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showFormPass ? 'text' : 'password'}
                          value={form.password || ''}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          required className="input-base w-full pr-10" />
                        <button type="button" onClick={() => setShowFormPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <EyeIcon open={showFormPass} />
                        </button>
                      </div>
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                        title="Rastgele şifre üret"
                        className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap transition-colors">
                        🎲 Üret
                      </button>
                    </div>
                    {/* Güç göstergesi */}
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0,1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength.score ? strength.color : 'bg-slate-100 dark:bg-slate-800'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Not */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Not (opsiyonel)</label>
                    <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2} placeholder="Güvenlik sorusu, pin, ekstra bilgi..."
                      className="input-base w-full resize-none" />
                  </div>

                  {formError && <p className="text-xs text-red-500">{formError}</p>}
                </div>

                <div className="flex gap-2 px-6 pb-6">
                  {modal === 'edit' && (
                    <button type="button" onClick={() => handleDelete(selected.id)}
                      className="text-sm px-3 py-2 text-red-500 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                      Sil
                    </button>
                  )}
                  <button type="button" onClick={closeModal}
                    className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                    İptal
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium transition-colors">
                    {submitting ? 'Kaydediliyor...' : modal === 'add' ? 'Kaydet' : 'Güncelle'}
                  </button>
                </div>
              </form>
            )}

            {/* Görüntüle */}
            {modal === 'view' && selected && (
              <div>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CAT_ICONS[selected.category] || '📦'}</span>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{selected.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${CAT_COLORS[selected.category]}`}>
                      {CATEGORIES.find(c => c.key === selected.category)?.label}
                    </span>
                  </div>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {selected.username && (
                    <ViewRow label="Kullanıcı Adı" value={selected.username}
                      onCopy={() => copy(selected.username, `${selected.id}-user`)}
                      copied={copied === `${selected.id}-user`} />
                  )}

                  {/* Şifre satırı */}
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Şifre</p>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                      <span className="flex-1 font-mono text-sm text-slate-800 dark:text-slate-100 tracking-wider">
                        {showPasswords[selected.id] ? selected.password : '••••••••••••'}
                      </span>
                      <button onClick={() => toggleShowPass(selected.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                        <EyeIcon open={showPasswords[selected.id]} />
                      </button>
                      <button onClick={() => copy(selected.password, `${selected.id}-pass`)}
                        className={`p-1 transition-colors ${copied === `${selected.id}-pass` ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
                        {copied === `${selected.id}-pass` ? '✓' : <CopyIcon />}
                      </button>
                    </div>
                    {/* Güç göstergesi */}
                    {(() => {
                      const s = passwordStrength(selected.password);
                      return (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex gap-0.5">
                            {[0,1,2,3,4].map(i => (
                              <div key={i} className={`h-1 w-6 rounded-full ${i < s.score ? s.color : 'bg-slate-100 dark:bg-slate-700'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{s.label}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {selected.url && (
                    <ViewRow label="URL" value={selected.url}
                      onCopy={() => copy(selected.url, `${selected.id}-url`)}
                      copied={copied === `${selected.id}-url`}
                      isLink />
                  )}

                  {selected.notes && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Not</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 whitespace-pre-wrap">{selected.notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    Oluşturulma: {new Date(selected.createdAt).toLocaleDateString('tr-TR')} ·
                    Güncelleme: {new Date(selected.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                <div className="flex gap-2 px-6 pb-6">
                  <button onClick={() => toggleFavorite(selected)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
                      selected.isFavorite
                        ? 'text-amber-500 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950'
                        : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                    <StarIcon filled={selected.isFavorite} />
                    {selected.isFavorite ? 'Favoride' : 'Favoriye Ekle'}
                  </button>
                  <button onClick={closeModal}
                    className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Kapat
                  </button>
                  <button onClick={() => openEdit(selected)}
                    className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">
                    Düzenle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .input-base {
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(30 41 59);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: rgb(96 165 250); }
        @media (prefers-color-scheme: dark) {
          .input-base { background: rgb(17 24 39); border-color: rgb(51 65 85); color: rgb(241 245 249); }
        }
      `}</style>
    </div>
  );
}

// ── Section bileşeni ──────────────────────────────────────
function Section({ title, items, onView, onEdit, onFavorite, onCopy, copied, showPasswords, onTogglePass }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h2>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {items.map(item => (
          <VaultRow key={item.id} item={item}
            onView={onView} onEdit={onEdit} onFavorite={onFavorite}
            onCopy={onCopy} copied={copied}
            showPassword={showPasswords[item.id]}
            onTogglePass={onTogglePass} />
        ))}
      </div>
    </div>
  );
}

// ── Satır bileşeni ────────────────────────────────────────
function VaultRow({ item, onView, onEdit, onFavorite, onCopy, copied, showPassword, onTogglePass }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
      {/* İkon */}
      <div className="text-xl w-8 shrink-0">{CAT_ICONS[item.category] || '📦'}</div>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onView(item)}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
          {item.isFavorite && <span className="text-amber-400 text-xs">⭐</span>}
        </div>
        <p className="text-xs text-slate-400 truncate">{item.username || item.url || '—'}</p>
      </div>

      {/* Şifre alanı */}
      <div className="hidden sm:flex items-center gap-1.5 font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5">
        <span className="tracking-wider">{showPassword ? item.password : '••••••••'}</span>
        <button onClick={() => onTogglePass(item.id)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1">
          <EyeIcon open={showPassword} />
        </button>
        <button onClick={() => onCopy(item.password, `${item.id}-row`)}
          className={`transition-colors ${copied === `${item.id}-row` ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          {copied === `${item.id}-row` ? '✓' : <CopyIcon />}
        </button>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onFavorite(item)}
          className={`p-1.5 rounded-lg transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}>
          <StarIcon filled={item.isFavorite} />
        </button>
        <button onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 transition-colors text-xs">
          ✏️
        </button>
      </div>
    </div>
  );
}

// ── Görüntüleme satırı ────────────────────────────────────
function ViewRow({ label, value, onCopy, copied, isLink }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-sm text-blue-500 hover:underline truncate">{value}</a>
        ) : (
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">{value}</span>
        )}
        <button onClick={onCopy}
          className={`shrink-0 p-1 transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          {copied ? '✓' : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}
