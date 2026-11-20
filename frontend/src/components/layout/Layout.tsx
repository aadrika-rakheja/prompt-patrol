import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar />
      <main className="lg:ml-60">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-16 sm:px-6 lg:px-8 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
