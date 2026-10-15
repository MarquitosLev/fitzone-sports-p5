import { AppProvider } from './context/AppContext';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ToastContainer } from './components/ui/ToastContainer';

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-manrope text-slate-900 selection:bg-[#F26D6D] selection:text-white">
        <header className="sticky top-0 z-40 bg-[#1B2A55] text-white shadow-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F26D6D] flex items-center justify-center font-outfit font-black text-xl text-white shadow-sm">
                FZ
              </div>
              <div className="font-outfit font-black text-lg tracking-tight leading-none text-white">
                FitZone Sports
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <PlaygroundPage />
        </main>

        <ToastContainer />
      </div>
    </AppProvider>
  );
}
