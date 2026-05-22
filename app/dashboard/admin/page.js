// app/dashboard/admin/page.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminPage from '@/components/admin/AdminPage';

export const metadata = { title: 'Yönetim — CB' };

export default async function Page() {
  const session = await auth();
  if (!session) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Admin değilse dashboard'a yönlendir
  if (user?.role !== 'ADMIN') redirect('/dashboard');

  return <AdminPage />;
}
