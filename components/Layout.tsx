
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">Ω</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Gemini Sensei</h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-500">
            <span className="hover:text-indigo-600 cursor-pointer">Philosophy</span>
            <span className="hover:text-indigo-600 cursor-pointer">Methodology</span>
            <span className="hover:text-indigo-600 cursor-pointer">About</span>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 mt-20 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 Gemini Sensei • Cognitive Reasoning Engine</p>
          <p className="mt-1 italic">"We fix the mind, and the answers follow."</p>
        </div>
      </footer>
    </div>
  );
};
