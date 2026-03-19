import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Info, Search, Filter, ChevronRight, Book as BookIcon, X } from 'lucide-react';
import Header from './Header';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId?: string;
  slug: string;
  imageUrl: string;
  buyUrl: string;
  synopsis?: string;
  badge?: string;
}

export default function Library() {
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) setSettings(snapshot.docs[0].data());
    });

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categorias').select('*');
        if (error || !data) {
          console.error("Erro ao buscar categorias no Supabase:", error);
          setCategories([]);
          return;
        }
        const cats = data.map(d => ({
          id: String(d.id || d.firebase_id || ''),
          name: d.nome || '',
          slug: d.slug || '',
          description: d.descricao || '',
          imageUrl: d.url_imagem || '' 
        })) as Category[];
        
        setCategories(cats);
        
        if (categorySlug) {
          const active = cats.find(c => c.slug === categorySlug);
          if (active) setActiveCategory(active);
        } else {
          setActiveCategory(null);
        }
      } catch (err) {
        console.error("Falha inesperada ao buscar categorias:", err);
        setCategories([]);
      }
    };
    
    fetchCategories();

    return () => {
      unsubSettings();
    };
  }, [categorySlug]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        let q = supabase.from('livros').select('*');
        if (activeCategory) {
          q = q.eq('categoria_id', activeCategory.id);
        }
        
        const { data, error } = await q;
        if (error || !data) {
          console.error("Erro ao buscar livros no Supabase:", error);
          setBooks([]);
          return;
        }
        
        const mappedBooks = data.map((b: any) => {
          const catName = categories.find(c => c.id === String(b.categoria_id))?.name || 'Sem Categoria';
          return {
            id: String(b.id || b.firebase_id || ''),
            title: b.titulo || '',
            author: b.autor || '',
            category: catName,
            categoryId: b.categoria_id || '',
            slug: b.slug || '',
            imageUrl: b.capa_url || '',
            videoUrl: b.video_url || '',
            buyUrl: b.link_compra || '',
            publisher: b.editora || '',
            year: b.ano || '',
            pages: b.paginas || '',
            synopsis: b.sinopse || '',
            targetAudience: b.indicacao || '',
            themes: b.temas || '',
            badge: b.badge || '',
            metaKeywords: b.seo_keywords || ''
          } as Book;
        });
        
        setBooks(mappedBooks);
      } catch (err) {
        console.error("Falha inesperada ao buscar livros:", err);
        setBooks([]);
      }
    };
    
    fetchBooks();
  }, [activeCategory, categories]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAuthor = !activeAuthor || book.author === activeAuthor;
    return matchesSearch && matchesAuthor;
  });

  const uniqueAuthors = Array.from(new Set(books.map(b => b.author))).sort();

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans">
      <Header settings={settings} />

      <main className="pt-32 md:pt-48 pb-20 container mx-auto px-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-8">
          <Link to="/" className="hover:text-[#8B5E3C] transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/biblioteca" className={`hover:text-[#8B5E3C] transition-colors ${!activeCategory ? 'text-[#8B5E3C]' : ''}`}>Biblioteca</Link>
          {activeCategory && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#8B5E3C]">{activeCategory.name}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex gap-4 mb-6">
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 glass py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-[#8B5E3C]"
            >
              <Filter className="w-4 h-4" /> Filtrar por Categoria
            </button>
          </div>

          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-10 sticky top-32 h-fit">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-6">Categorias</h3>
              <div className="flex flex-col gap-2">
                <Link 
                  to="/biblioteca"
                  className={`px-4 py-3 rounded-xl text-sm transition-all ${!activeCategory ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                >
                  Todas as Obras
                </Link>
                {categories.map(cat => (
                  <Link 
                    key={cat.id}
                    to={`/biblioteca/${cat.slug}`}
                    className={`px-4 py-3 rounded-xl text-sm transition-all ${activeCategory?.id === cat.id ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-6">Autores</h3>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <button 
                  onClick={() => setActiveAuthor(null)}
                  className={`px-4 py-3 rounded-xl text-sm text-left transition-all ${!activeAuthor ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                >
                  Todos os Autores
                </button>
                {uniqueAuthors.map(author => (
                  <button 
                    key={author}
                    onClick={() => setActiveAuthor(author)}
                    className={`px-4 py-3 rounded-xl text-sm text-left transition-all ${activeAuthor === author ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                  >
                    {author}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border-[#8B5E3C]/20">
              <h4 className="font-serif text-lg mb-4">Busca Rápida</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Título ou autor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                />
              </div>
            </div>
          </aside>

          {/* Mobile Filters Drawer */}
          <AnimatePresence>
            {isMobileFiltersOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
                />
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-[#050505] z-[70] lg:hidden p-8 overflow-y-auto border-r border-white/5"
                >
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-serif">Filtros</h3>
                    <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 glass rounded-full">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-6">Categorias</h4>
                      <div className="flex flex-col gap-2">
                        <Link 
                          to="/biblioteca"
                          onClick={() => setIsMobileFiltersOpen(false)}
                          className={`px-4 py-3 rounded-xl text-sm transition-all ${!activeCategory ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                        >
                          Todas as Obras
                        </Link>
                        {categories.map(cat => (
                          <Link 
                            key={cat.id}
                            to={`/biblioteca/${cat.slug}`}
                            onClick={() => setIsMobileFiltersOpen(false)}
                            className={`px-4 py-3 rounded-xl text-sm transition-all ${activeCategory?.id === cat.id ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-6">Autores</h4>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => { setActiveAuthor(null); setIsMobileFiltersOpen(false); }}
                          className={`px-4 py-3 rounded-xl text-sm text-left transition-all ${!activeAuthor ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                        >
                          Todos os Autores
                        </button>
                        {uniqueAuthors.map(author => (
                          <button 
                            key={author}
                            onClick={() => { setActiveAuthor(author); setIsMobileFiltersOpen(false); }}
                            className={`px-4 py-3 rounded-xl text-sm text-left transition-all ${activeAuthor === author ? 'bg-[#8B5E3C] text-white shadow-lg shadow-[#8B5E3C]/20' : 'hover:bg-white/5 text-white/50'}`}
                          >
                            {author}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass p-6 rounded-2xl border-[#8B5E3C]/20">
                      <h4 className="font-serif text-lg mb-4">Busca Rápida</h4>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input 
                          type="text" 
                          placeholder="Título ou autor..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            <header className="mb-12">
              <h1 className="text-4xl md:text-6xl font-serif mb-4">
                {activeCategory ? activeCategory.name : "Nossa Biblioteca"}
              </h1>
              <p className="text-white/50 text-lg max-w-2xl font-light leading-relaxed">
                {activeCategory?.description || "Explore nosso acervo completo de obras selecionadas para o seu crescimento espiritual e teológico."}
              </p>
            </header>

            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredBooks.map((book, index) => (
                    <motion.div 
                      key={book.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass p-6 rounded-[2rem] flex flex-col group hover:border-[#8B5E3C]/50 transition-all duration-500"
                    >
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl">
                        <img 
                          src={book.imageUrl} 
                          alt={book.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        {book.badge && (
                          <div className="absolute top-4 right-4 bg-[#8B5E3C] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                            {book.badge}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                           <Link 
                            to={`/livro/${book.slug}`}
                            className="p-4 bg-white text-black rounded-full hover:bg-[#8B5E3C] hover:text-white transition-colors"
                            title="Ver Detalhes"
                          >
                            <Info className="w-6 h-6" />
                          </Link>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <span className="text-[#8B5E3C] font-bold uppercase tracking-widest text-[9px] mb-2">{book.category}</span>
                        <h3 className="text-xl font-serif mb-1 group-hover:text-[#8B5E3C] transition-colors">{book.title}</h3>
                        <p className="text-white/40 text-sm mb-4">{book.author}</p>
                        
                        <div className="mt-auto flex flex-col gap-3">
                          <a 
                            href={book.buyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-[#8B5E3C] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-[#D4C3A3] transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" /> Comprar Agora
                          </a>
                          <Link 
                            to={`/livro/${book.slug}`}
                            className="w-full py-3 border border-white/10 text-white/50 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            Ver Detalhes
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-white/20">
                <BookIcon className="w-16 h-16 mb-4" />
                <p className="text-xl font-serif">Nenhum livro encontrado</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer (Simplified) */}
      <footer className="py-12 border-t border-white/5 text-center text-white/20 text-xs uppercase tracking-widest">
        <p>&copy; 2026 Biblioteca Reformada. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
