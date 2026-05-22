// prisma/seed.js
// Çalıştır: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('Menüler oluşturuluyor...');

  // Mevcut menüleri temizle
  await db.roleMenuPermission.deleteMany();
  await db.menuItem.deleteMany();

  // Ana menü öğeleri
  const menus = [
    { label: 'Dashboard',    href: '/dashboard',           icon: '🏠', order: 1 },
    { label: 'Dosyalarım',   href: '/dashboard/files',     icon: '📁', order: 2 },
    { label: 'Yatırımlarım', href: '/dashboard/portfolio', icon: '📊', order: 3 },
    { label: 'Şifrelerim',   href: '/dashboard/vault',     icon: '🔑', order: 4 },
    { label: 'Yönetim',      href: '/dashboard/admin',     icon: '⚙️', order: 5 },
  ];

  const created = [];
  for (const m of menus) {
    const item = await db.menuItem.create({ data: m });
    created.push(item);
  }

  // ADMIN — tüm menülere erişim
  for (const item of created) {
    await db.roleMenuPermission.create({
      data: { role: 'ADMIN', menuItemId: item.id },
    });
  }

  // USER — Yönetim hariç
  for (const item of created.filter(m => m.href !== '/dashboard/admin')) {
    await db.roleMenuPermission.create({
      data: { role: 'USER', menuItemId: item.id },
    });
  }

  console.log(`✅ ${created.length} menü oluşturuldu.`);
  console.log('ℹ️  Kendinizi ADMIN yapmak için:');
  console.log('   npx prisma studio → User tablosu → role alanını ADMIN yapın');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
