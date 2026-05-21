// app/dashboard/page.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';
import MarketWidget from '@/components/dashboard/MarketWidget';

export const metadata = { title: 'Dashboard — FileVault' };

export default async function DashboardPage() {
  const session = await auth();

  const [files, totalFiles, totalSizeResult, balance, assets, thisMonth] = await Promise.all([
    db.file.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.file.count({ where: { userId: session.user.id } }),
    db.file.aggregate({ where: { userId: session.user.id }, _sum: { size: true } }),
    db.balance.findUnique({ where: { userId: session.user.id } }),
    db.asset.findMany({ where: { userId: session.user.id } }),
    db.file.count({ where: { userId: session.user.id, createdAt: { gte: new Date(new Date().setDate(1)) } } }),
  ]);

  const totalSize = totalSizeResult._sum.size || 0;
  const totalCost = assets.reduce((s, a) => s + a.avgCost * a.quantity, 0);
  const assetCount = assets.length;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Karşılama */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Merhaba, {session.user.name?.split(' ')[0] || 'Kullanıcı'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Kişisel panelinize hoş geldiniz.</p>
      </div>

      {/* Üst stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Dosya" value={totalFiles} icon="📁" color="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" />
        <StatCard label="Depolama" value={formatFileSize(totalSize)} icon="💾" color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" />
        <StatCard label="Portföy Varlıkları" value={`${assetCount} adet`} icon="📊" color="bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" href="/dashboard/portfolio" />
        <StatCard label="Serbest TL" value={balance ? `₺${balance.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}` : '₺0'} icon="💰" color="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" href="/dashboard/portfolio" />
      </div>

      {/* Ana içerik — 3+2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Sol: Dosyalar + Portföy özeti */}
        <div className="lg:col-span-3 space-y-6">

          {/* Son dosyalar */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Son Yüklenen Dosyalar</h2>
              <Link href="/dashboard/files" className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors">
                Tümünü Gör →
              </Link>
            </div>
            {files.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-slate-400 text-sm">Henüz dosya yüklemediniz.</p>
                <Link href="/dashboard/files" className="inline-block mt-3 text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                  İlk Dosyayı Yükle
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="text-xl">
                      {file.mimeType.startsWith('image/') ? '🖼️' :
                       file.mimeType === 'application/pdf' ? '📄' :
                       file.mimeType.includes('word') ? '📝' :
                       file.mimeType.includes('excel') ? '📊' : '📎'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portföy özet */}
          {assetCount > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Portföy Özeti</h2>
                <Link href="/dashboard/portfolio" className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors">
                  Portföye Git →
                </Link>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Toplam Maliyet</p>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      ₺{totalCost.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Varlık Sayısı</p>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{assetCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Serbest Bakiye</p>
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      ₺{(balance?.amount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {assets.slice(0, 4).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{a.symbol}</span>
                        <span className="text-xs text-slate-400">{a.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {a.quantity.toFixed(4).replace(/\.?0+$/, '')} adet
                      </span>
                    </div>
                  ))}
                  {assetCount > 4 && (
                    <p className="text-xs text-slate-400 pt-1">+{assetCount - 4} varlık daha</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Piyasa widgeti */}
        <div className="lg:col-span-2">
          <MarketWidget />
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, href }) {
  const content = (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-lg ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
