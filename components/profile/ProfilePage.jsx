'use client';

import { useState, useEffect } from 'react';
function InputField({ label, type = 'text', value, onChange, placeholder, hint, required }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors pr-10"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {show ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    error:   'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  };
  const icons = { success: '✓', error: '✕' };
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span className="font-bold">{icons[type]}</span>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  // Profil form
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Şifre form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg]         = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isOAuth, setIsOAuth] = useState(false);

  useEffect(() => {
    async function load() {
      const r = await fetch('/api/profile');
      const d = await r.json();
      setName(d.name || '');
      setEmail(d.email || '');
      setIsOAuth(!d.hasPassword);
    }
    load();
  }, []);

  // Şifre gücü
  function pwStrength(pw) {
    if (!pw) return null;
    let s = 0;
    if (pw.length >= 8)  s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const levels = [
      { label: 'Çok Zayıf', color: 'bg-red-500' },
      { label: 'Zayıf',     color: 'bg-orange-400' },
      { label: 'Orta',      color: 'bg-yellow-400' },
      { label: 'İyi',       color: 'bg-blue-400' },
      { label: 'Güçlü',     color: 'bg-emerald-500' },
      { label: 'Çok Güçlü', color: 'bg-emerald-600' },
    ];
    return { score: s, ...levels[Math.min(s, 5)] };
  }

  const strength = pwStrength(newPassword);

  async function handleProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName(data.name || '');
      setEmail(data.email || '');
      setProfileMsg({ type: 'success', text: 'Bilgileriniz güncellendi.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Şifreniz başarıyla değiştirildi.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  }

  // Avatar baş harfleri
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hesap Ayarları</h1>
        <p className="text-sm text-slate-400 mt-1">Profil bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.</p>
      </div>

      {/* Avatar + özet */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{name || '—'}</p>
          <p className="text-sm text-slate-400">{email}</p>
          {isOAuth && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              OAuth hesabı
            </span>
          )}
        </div>
      </div>

      {/* Profil bilgileri */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Profil Bilgileri</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <InputField label="Ad Soyad" value={name} onChange={setName} placeholder="Adınız Soyadınız" required />
          <InputField label="E-posta" type="email" value={email} onChange={setEmail} placeholder="ornek@mail.com" required />
          <Alert type={profileMsg.type} message={profileMsg.text} />
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={profileLoading}
              className="px-5 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors">
              {profileLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Şifre değiştir */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Şifre Değiştir</h2>
        {isOAuth ? (
          <p className="text-sm text-slate-400 mt-2">
            Google veya GitHub ile giriş yaptığınız için şifre değiştirme mevcut değil.
          </p>
        ) : (
          <form onSubmit={handlePassword} className="space-y-4 mt-5">
            <InputField label="Mevcut Şifre" type="password" value={currentPassword}
              onChange={setCurrentPassword} placeholder="••••••••" required />
            <InputField label="Yeni Şifre" type="password" value={newPassword}
              onChange={setNewPassword} placeholder="En az 8 karakter" required
              hint="" />
            {/* Şifre gücü göstergesi */}
            {newPassword && strength && (
              <div className="-mt-2">
                <div className="flex gap-1 mb-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength.score ? strength.color : 'bg-slate-100 dark:bg-slate-800'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">{strength.label}</p>
              </div>
            )}
            <InputField label="Yeni Şifre (Tekrar)" type="password" value={confirmPassword}
              onChange={setConfirmPassword} placeholder="••••••••" required />
            {/* Eşleşme kontrolü */}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 -mt-2">Şifreler eşleşmiyor.</p>
            )}
            <Alert type={passwordMsg.type} message={passwordMsg.text} />
            <div className="flex justify-end pt-1">
              <button type="submit"
                disabled={passwordLoading || (confirmPassword && newPassword !== confirmPassword)}
                className="px-5 py-2.5 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors">
                {passwordLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Hesap bilgileri */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Hesap Bilgileri</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Giriş yöntemi</span>
            <span className="text-slate-700 dark:text-slate-300">{isOAuth ? 'OAuth (Google / GitHub)' : 'E-posta & Şifre'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">E-posta</span>
            <span className="text-slate-700 dark:text-slate-300">{email}</span>
          </div>
        </div>
      </div>

    </div>
  );
}