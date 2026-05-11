import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ProblemSection from './components/ProblemSection.jsx';
import SolutionSection from './components/SolutionSection.jsx';
import Features from './components/Features.jsx';
import AudienceSection from './components/AudienceSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import ProductMockup from './components/ProductMockup.jsx';
import Benefits from './components/Benefits.jsx';
import Pricing from './components/Pricing.jsx';
import DemoForm from './components/DemoForm.jsx';
import FAQ from './components/FAQ.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <Features />
        <AudienceSection />
        <HowItWorks />
        <ProductMockup />
        <Benefits />
        <Pricing />
        <DemoForm />
        <FAQ />
        <section className="bg-navy px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-panel sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Bugün başlayın</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                Operasyonel süreçlerinizi daha düzenli yönetmeye bugün başlayın
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Görevleri, talepleri, onayları ve personel evraklarını tek panelde toplayarak işletmenizde kontrolü artırın.
              </p>
            </div>
            <a
              href="#demo"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-action px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:bg-green-500"
            >
              Ücretsiz Demo Talep Et
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
