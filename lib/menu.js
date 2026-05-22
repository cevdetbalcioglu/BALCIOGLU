// lib/menu.js
// Kullanıcının görebileceği menüleri döner
// Önce role iznine bakar, sonra bireysel istisnaları uygular

import { db } from '@/lib/db';

export async function getUserMenus(userId, role) {
  // 1. Role'e ait menüler
  const roleMenus = await db.roleMenuPermission.findMany({
    where: { role },
    include: { menuItem: { include: { children: { where: { isActive: true }, orderBy: { order: 'asc' } } } } },
  });

  // 2. Kullanıcıya özel istisnalar
  const exceptions = await db.userMenuException.findMany({
    where: { userId },
    include: { menuItem: true },
  });

  const grantedIds  = new Set(roleMenus.map(r => r.menuItemId));
  const exceptionMap = new Map(exceptions.map(e => [e.menuItemId, e.type]));

  // İstisnaları uygula
  for (const [menuId, type] of exceptionMap) {
    if (type === 'GRANT')  grantedIds.add(menuId);
    if (type === 'REVOKE') grantedIds.delete(menuId);
  }

  // Tüm aktif menüleri çek, yetkilileri filtrele
  const allMenus = await db.menuItem.findMany({
    where: { isActive: true, parentId: null }, // sadece ana menüler
    orderBy: { order: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  // Yetkili olanları filtrele
  return allMenus
    .filter(m => grantedIds.has(m.id))
    .map(m => ({
      ...m,
      children: m.children.filter(c => grantedIds.has(c.id)),
    }));
}

// Admin kontrolü
export function isAdmin(role) {
  return role === 'ADMIN';
}
