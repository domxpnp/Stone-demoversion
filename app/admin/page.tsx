import type { Metadata } from 'next';
import AdminApp from './AdminApp';
import './admin.css';

export const metadata: Metadata = {
  title: 'STONECLUB Admin · Back office',
};

export default function AdminPage() {
  return (
    <div className="admin-app">
      <AdminApp />
    </div>
  );
}
