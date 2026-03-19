import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { BookMarked, Menu, X } from 'lucide-react';

interface HeaderProps {
  settings: {
    logoUrl?: string;
    slogan?: string;
    whatsappNumber?: string;
  } | null;
}

export default function Header({ settings }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const logoUrl = settings?.logoUrl || "https://seudominio.com/imagens/logo.png";
  const slogan = settings?.slogan || "Tradição Reformada & Sabedoria Cristã";
  const whatsappNumber = settings?.whatsappNumber || "5548991709438";

  const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const isExternal = href.startsWith('http') || href.startsWith('#');
    
    if (isExternal && isHome) {
      return (
        <a href={href} onClick={onClick} className="hover:text-white transition-colors">
          {children}
        </a>
      );
    }

    return (
      <Link to={href.startsWith('#') ? `/${href}` : href} onClick={onClick} className="hover:text-white transition-colors">
        {children}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-500 py-3 md:py-4 glass">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <Link to="/" className="flex flex-col">
          <div className="flex items-center gap-2 md:gap-3">
            {logoUrl && !logoUrl.includes('seudominio.com') ? (
              <img src={logoUrl} alt="Logo" className="h-20 md:h-32 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
            ) : (
              <>
                <div className="w-14 h-14 md:w-20 md:h-20 bg-[#8B5E3C] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-[#8B5E3C]/20">
                  <BookMarked className="text-white w-8 h-8 md:w-12 md:h-12" />
                </div>
                <span className="text-2xl md:text-4xl font-serif font-bold tracking-tighter text-white">
                  BIBLIOTECA<span className="text-[#8B5E3C]">REFORMADA</span>
                </span>
              </>
            )}
          </div>
          {slogan && (
            <span className="text-[11px] md:text-[14px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-[#8B5E3C] font-bold mt-1 md:mt-1.5 ml-0.5 md:ml-1">
              {slogan}
            </span>
          )}
        </Link>
        
        <nav className="hidden lg:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
          <NavLink href="/">Início</NavLink>
          <NavLink href="/biblioteca">Biblioteca</NavLink>
          <NavLink href="#livros">Recomendados</NavLink>
          <NavLink href="#estantes">Produtos</NavLink>
          <NavLink href="#blog">Blog</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block px-4 md:px-8 py-2 md:py-3 glass rounded-full text-[9px] md:text-[11px] font-bold uppercase tracking-widest hover:bg-[#8B5E3C] hover:text-white transition-all duration-300 text-white">
            Fale Conosco
          </a>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 glass rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6 text-sm font-bold uppercase tracking-[0.2em]">
              <NavLink href="/" onClick={() => setIsMenuOpen(false)}>Início</NavLink>
              <NavLink href="/biblioteca" onClick={() => setIsMenuOpen(false)}>Biblioteca</NavLink>
              <NavLink href="#livros" onClick={() => setIsMenuOpen(false)}>Livros Recomendados</NavLink>
              <NavLink href="#estantes" onClick={() => setIsMenuOpen(false)}>Produtos Destaques</NavLink>
              <NavLink href="#blog" onClick={() => setIsMenuOpen(false)}>Artigos do Blog</NavLink>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-[#8B5E3C] hover:text-[#D4C3A3] transition-colors">Fale Conosco</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
