import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    redirect('/admin');
  }

  return <AdminDashboardClient />;
}
