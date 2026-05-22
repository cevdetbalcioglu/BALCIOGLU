'use client';

import { useState, useEffect, useCallback } from 'react';

const ROLES = ['ADMIN', 'USER'];
const ROLE_COLORS = {
  ADMIN: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800',
  USER:  'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export default function AdminPage() {
  const [tab, setTab]       = useState('menus'); // 'menus' | 'users'
  const [menus, setMenus]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Menü formu
  const [menuForm, setMenuForm] = useState({ label: '', href: '', icon: '', order: '' });
  const [menuSubmitting, setMenuSubmitting] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [editingMenu, setEditingMenu] = useState(null); // düzenlenen menü
  const [editForm, setEditForm] = useState({});

  // Seçili kullanıcı (istisna paneli)
  const [selectedUser, setSelectedUser] = useState(null);

  const loadMenus = useCallback(async () => {
    const r = await fetch('/api/admin/menus');
    const d = await r.json();
    setMenus(Array.isArray(d) ? d : []);
  }, []);

  const loadUsers = useCallback(async () => {
    const r = await fetch('/api/admin/users');
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadMenus(), loadUsers()]);
      setLoading(false);
    }
    init();
  }, [loadMenus, loadUsers]);

  // Rol izni toggle
  async function toggleRolePermission(menuId, role) {
    await fetch(`/api/admin/menus/${menuId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleRole: role }),
    });
    await loadMenus();
  }

  // Menü aktif/pasif toggle
  async function toggleMenuActive(menu) {
    await fetch(`/api/admin/menus/${menu.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !menu.isActive }),
    });
    await loadMenus();
  }

  // Menü düzenle kaydet
  async function handleEditMenu(e) {
    e.preventDefault();
    await fetch(`/api/admin/menus/${editingMenu.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editForm.label, href: editForm.href, icon: editForm.icon, order: parseInt(editForm.order) || editingMenu.order }),
    });
    setEditingMenu(null);
    setEditForm({});
    await loadMenus();
  }

  // Menü sil
  async function deleteMenu(id) {
    if (!confirm('Bu menüyü silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/admin/menus/${id}`, { method: 'DELETE' });
    await loadMenus();
  }

  // Yeni menü ekle
  async function handleAddMenu(e) {
    e.preventDefault();
    setMenuSubmitting(true);
    setMenuError('');
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menuForm, order: parseInt(menuForm.order) || 0 }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMenuForm({ label: '', href: '', icon: '', order: '' });
      await loadMenus();
    } catch (err) {
      setMenuError(err.message);
    } finally {
      setMenuSubmitting(false);
    }
  }

  // Kullanıcı rolü değiştir
  async function changeUserRole(userId, role) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    await loadUsers();
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => ({ ...prev, role }));
    }
  }

  // Kullanıcı menü istisnası toggle
  async function toggleException(userId, menuItemId, type) {
    await fetch(`/api/admin/users/${userId}/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuItemId, type }),
    });
    await loadUsers();
    // selectedUser'ı güncelle
    const updated = await fetch('/api/admin/users');
    const d = await updated.json();
    const fresh = d.find(u => u.id === userId);
    if (fresh) setSelectedUser(fresh);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="animate-spin w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full mr-3" />
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Yönetim Paneli ⚙️</h1>
        <p className="text-sm text-slate-400 mt-1">Menü ve kullanıcı yetki yönetimi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[{ key: 'menus', label: '📋 Menüler' }, { key: 'users', label: '👥 Kullanıcılar' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MENÜ YÖNETİMİ ── */}
      {tab === 'menus' && (
        <div className="space-y-5">
          {/* Menü listesi */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mevcut Menüler</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-3 font-medium">Menü</th>
                  <th className="text-left px-4 py-3 font-medium">URL</th>
                  <th className="text-center px-4 py-3 font-medium">ADMIN</th>
                  <th className="text-center px-4 py-3 font-medium">USER</th>
                  <th className="text-center px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {menus.map(menu => {
                  const adminGranted = menu.rolePermissions.some(p => p.role === 'ADMIN');
                  const userGranted  = menu.rolePermissions.some(p => p.role === 'USER');
                  return (
                    <tr key={menu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span>{menu.icon}</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{menu.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{menu.href}</td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={adminGranted} onChange={() => toggleRolePermission(menu.id, 'ADMIN')} color="red" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={userGranted} onChange={() => toggleRolePermission(menu.id, 'USER')} color="blue" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Toggle checked={menu.isActive} onChange={() => toggleMenuActive(menu)} color="green" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setEditingMenu(menu); setEditForm({ label: menu.label, href: menu.href, icon: menu.icon || '', order: menu.order }); }}
                            className="text-xs text-blue-400 hover:text-blue-600 transition-colors">
                            Düzenle
                          </button>
                          <button onClick={() => deleteMenu(menu.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors">
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Yeni menü ekle */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Yeni Menü Ekle</h2>
            <form onSubmit={handleAddMenu} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Etiket *</label>
                <input value={menuForm.label} onChange={e => setMenuForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Raporlar" required className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL *</label>
                <input value={menuForm.href} onChange={e => setMenuForm(f => ({ ...f, href: e.target.value }))}
                  placeholder="/dashboard/reports" required className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">İkon (emoji)</label>
                <input value={menuForm.icon} onChange={e => setMenuForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="📈" className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sıra</label>
                <input type="number" value={menuForm.order} onChange={e => setMenuForm(f => ({ ...f, order: e.target.value }))}
                  placeholder="10" className="input-sm w-full" />
              </div>
              {menuError && <p className="col-span-4 text-xs text-red-500">{menuError}</p>}
              <div className="col-span-4 flex justify-end">
                <button type="submit" disabled={menuSubmitting}
                  className="text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
                  {menuSubmitting ? 'Ekleniyor...' : '+ Menü Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── KULLANICI YÖNETİMİ ── */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kullanıcı listesi */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kullanıcılar</h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map(user => (
                <div key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`px-5 py-4 cursor-pointer transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {user.name || 'İsimsiz'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <select
                      value={user.role}
                      onChange={e => { e.stopPropagation(); changeUserRole(user.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-md border font-medium cursor-pointer ${ROLE_COLORS[user.role]}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  {user.menuExceptions.length > 0 && (
                    <p className="text-xs text-amber-500 mt-1">
                      {user.menuExceptions.length} özel istisna
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kullanıcı detay / istisna yönetimi */}
          <div className="lg:col-span-2">
            {!selectedUser ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center text-slate-400 text-sm">
                Kullanıcı seçin
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {selectedUser.name || 'İsimsiz'} — Menü İstisnaları
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rol: <span className={`font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[selectedUser.role]}`}>{selectedUser.role}</span>
                      {' '}· Rol iznini bireysel olarak geçersiz kılabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {menus.filter(m => m.isActive).map(menu => {
                    const roleGranted = menu.rolePermissions.some(p => p.role === selectedUser.role);
                    const exception   = selectedUser.menuExceptions.find(e => e.menuItemId === menu.id);
                    const effectiveAccess = exception
                      ? exception.type === 'GRANT'
                      : roleGranted;

                    return (
                      <div key={menu.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{menu.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{menu.label}</p>
                            <p className="text-xs text-slate-400 font-mono">{menu.href}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Rol izni göstergesi */}
                          <span className={`text-xs px-2 py-0.5 rounded border ${
                            roleGranted
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                          }`}>
                            Rol: {roleGranted ? '✓' : '✕'}
                          </span>

                          {/* İstisna butonları */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleException(selectedUser.id, menu.id, 'GRANT')}
                              title="Bireysel olarak ver"
                              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                                exception?.type === 'GRANT'
                                  ? 'bg-emerald-500 text-white border-transparent'
                                  : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 hover:border-emerald-300'
                              }`}>
                              +Ver
                            </button>
                            <button
                              onClick={() => toggleException(selectedUser.id, menu.id, 'REVOKE')}
                              title="Bireysel olarak engelle"
                              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                                exception?.type === 'REVOKE'
                                  ? 'bg-red-500 text-white border-transparent'
                                  : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 hover:border-red-300'
                              }`}>
                              −Engelle
                            </button>
                          </div>

                          {/* Efektif erişim */}
                          <span className={`text-xs font-medium w-16 text-right ${
                            effectiveAccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                          }`}>
                            {effectiveAccess ? '● Erişebilir' : '○ Erişemez'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Menü Düzenleme Modalı ── */}
      {editingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setEditingMenu(null); setEditForm({}); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Menü Düzenle</h3>
              <button onClick={() => { setEditingMenu(null); setEditForm({}); }} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleEditMenu} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">İkon (emoji)</label>
                <input value={editForm.icon || ''} onChange={e => setEditForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="📊" className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Menü Adı *</label>
                <input value={editForm.label || ''} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                  required placeholder="Yatırımlarım" className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL *</label>
                <input value={editForm.href || ''} onChange={e => setEditForm(f => ({ ...f, href: e.target.value }))}
                  required placeholder="/dashboard/portfolio" className="input-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sıra</label>
                <input type="number" value={editForm.order || ''} onChange={e => setEditForm(f => ({ ...f, order: e.target.value }))}
                  placeholder="5" className="input-sm w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setEditingMenu(null); setEditForm({}); }}
                  className="flex-1 text-sm py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 text-sm py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input-sm {
          font-size: 0.8rem;
          padding: 0.4rem 0.65rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(30 41 59);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-sm:focus { border-color: rgb(96 165 250); }
        @media (prefers-color-scheme: dark) {
          .input-sm { background: rgb(17 24 39); border-color: rgb(51 65 85); color: rgb(241 245 249); }
        }
      `}</style>
    </div>
  );
}

// Toggle bileşeni
function Toggle({ checked, onChange, color }) {
  const colors = {
    red:   checked ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700',
    blue:  checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700',
    green: checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700',
  };
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${colors[color]}`}>
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}
