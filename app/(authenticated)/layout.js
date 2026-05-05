import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Dashboard — CineCumbres',
};

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </SessionProvider>
  );
}
