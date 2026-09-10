import type { ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-layout__main">
        <div className="app-layout__content">
          {children}
        </div>
      </main>
    </div>
  );
}
