import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Info, ChevronLeft, Calendar, User, Building2, Target, Tag, ExternalLink, Play, Book as BookIcon, Hash } from 'lucide-react';
import Header from './Header';
import { getYouTubeEmbedUrl } from '../utils/youtube';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId?: string;
  slug: string;
  imageUrl: string;
  videoUrl?: string;
  buyUrl: string;
  publisher?: string;
  year?: string;
  pages?: string;
  synopsis?: string;
  targetAudience?: string;
  themes?: string;
  badge?: string;
  metaKeywords?: string;
}

export default function BookDetail() {
  const { slug } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (error) console.log('Erro detalhado: settings -', error);
      if (data && !error) {
        setSettings({
          heroTitle: data.hero_title || '',
          heroSubtitle: data.hero_subtitle || '',
          heroImage: data.hero_image || '',
          logoUrl: data.logo_url || '',
          slogan: data.slogan || '',
          marqueeItems: data.marquee_items || '',
          whatsappNumber: data.whatsapp_number || '',
          metaTitle: data.meta_title || '',
          metaDescription: data.meta_description || '',
          metaKeywords: data.meta_keywords || ''
        });
      } else {
        setSettings({});
      }
    };
    fetchSettings();

    const fetchBookData = async () => {
      setLoading(true);
      try {
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('slug', slug)
          .limit(1)
          .maybeSingle();

        if (bookError || !bookData) {
          console.log("Erro detalhado: book -", bookError);
          setBook(null);
          setLoading(false);
          return;
        }

        let catName = 'Sem Categoria';
        const rawCategoryId = bookData.category || bookData.categoryId || bookData.category_id || bookData.categoria_id;
        if (rawCategoryId) {
          const { data: catData } = await supabase
            .from('categories')
            .select('nome')
            .eq('id', rawCategoryId)
            .maybeSingle();
          if (catData) catName = catData.nome || 'Sem Categoria';
        }

        const mappedBook = {
          id: String(bookData.id || ''),
          title: bookData.title || bookData.titulo || '',
          author: bookData.author || bookData.autor || '',
          category: catName,
          categoryId: rawCategoryId || bookData.category || '',
          slug: bookData.slug || '',
          imageUrl: bookData.cover_url || bookData.capa_url_new || '',
          imageAlt: bookData.cover_alt || '',
          videoUrl: bookData.video_url || '',
          buyUrl: bookData.amazon_url || bookData.link_compra || '',
          publisher: bookData.publisher || bookData.editora || '',
          year: bookData.year || bookData.ano || '',
          pages: bookData.pages || bookData.paginas || '',
          synopsis: bookData.synopsis || bookData.sinopse || '',
          targetAudience: bookData.target_audience || bookData.targetAudience || bookData.indicacao || '',
          themes: bookData.main_themes || bookData.themes || bookData.temas || '',
          badge: bookData.badge || '',
          metaKeywords: bookData.seo_keywords || ''
        } as Book;

        setBook(mappedBook);

        if (rawCategoryId) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('books')
            .select('*')
            .eq('category', rawCategoryId)
            .neq('slug', slug)
            .limit(4);

          if (!relatedError && relatedData) {
            const mappedRelated = relatedData.map((b: any) => ({
              id: String(b.id || ''),
              title: b.title || b.titulo || '',
              author: b.author || b.autor || '',
              category: catName,
              categoryId: b.category || b.categoryId || b.category_id || '',
              slug: b.slug || '',
              imageUrl: b.cover_url || b.imageUrl || b.capa_url_new || '',
              buyUrl: b.amazon_url || b.buyUrl || b.buy_url || b.link_compra || '',
            })) as Book[];
            setRelatedBooks(mappedRelated);
          } else if (relatedError) {
             console.error("Related books error:", relatedError);
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao buscar detalhes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();

    return () => {
      // Nothing to cleanup on fetch
    };
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;
  if (!book) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
    <h2 className="text-4xl font-serif">Livro não encontrado</h2>
    <Link to="/biblioteca" className="px-8 py-3 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors">Voltar para Biblioteca</Link>
  </div>;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans">
      <Header settings={settings} />

      <main className="pt-32 md:pt-48 pb-20 container mx-auto px-6">
        <Link to="/biblioteca" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-[#8B5E3C] transition-colors mb-12">
          <ChevronLeft className="w-4 h-4" /> Voltar para Biblioteca
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: Image and Quick Info */}
          <div className="lg:col-span-5 space-y-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5"
            >
              <img
                src={book.imageUrl || '/placeholder-book.jpg'}
                onError={(e) => { e.currentTarget.src = '/placeholder-book.jpg'; }}
                alt={book.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {book.badge && (
                <div className="absolute top-8 right-8 bg-[#8B5E3C] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {book.badge}
                </div>
              )}
            </motion.div>

            {book.videoUrl && (
              <div className="glass p-8 rounded-[2rem] border-[#8B5E3C]/20">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                  <Play className="text-[#8B5E3C] w-5 h-5 fill-current" /> Trailer da Obra
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    src={getYouTubeEmbedUrl(book.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen
                    title="Trailer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-7 space-y-12">
            <header>
              <span className="text-[#8B5E3C] font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">{book.category}</span>
              <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">{book.title}</h1>
              <div className="flex items-center gap-4 text-xl text-white/50 font-light">
                <User className="w-5 h-5 text-[#8B5E3C]" />
                <span>{book.author}</span>
              </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="glass p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                <Building2 className="w-5 h-5 text-[#8B5E3C]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Editora</span>
                <span className="text-xs font-medium">{book.publisher || "N/A"}</span>
              </div>
              <div className="glass p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                <Calendar className="w-5 h-5 text-[#8B5E3C]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Ano</span>
                <span className="text-xs font-medium">{book.year || "N/A"}</span>
              </div>
              <div className="glass p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                <BookIcon className="w-5 h-5 text-[#8B5E3C]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Páginas</span>
                <span className="text-xs font-medium">{book.pages || "N/A"}</span>
              </div>
              <div className="glass p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                <Tag className="w-5 h-5 text-[#8B5E3C]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Formato</span>
                <span className="text-xs font-medium">Físico</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-serif text-[#8B5E3C]">Sinopse</h3>
              <p className="text-lg text-white/60 font-light leading-relaxed whitespace-pre-line">
                {book.synopsis || "Nenhuma sinopse disponível para esta obra."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8B5E3C] flex items-center gap-2">
                  <Target className="w-4 h-4" /> Público-alvo
                </h4>
                <p className="text-sm text-white/50">{book.targetAudience || "Geral"}</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8B5E3C] flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Temas Principais
                </h4>
                <p className="text-sm text-white/50">{book.themes || "Teologia, Vida Cristã"}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-6">
              <a
                href={book.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-5 bg-[#8B5E3C] text-white rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-[#D4C3A3] transition-all duration-300 shadow-xl shadow-[#8B5E3C]/20"
              >
                <ShoppingCart className="w-5 h-5" /> Adquirir Obra Agora
              </a>
              <button className="px-10 py-5 glass rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-white/5 transition-colors">
                Compartilhar
              </button>
            </div>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="mt-32">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-[#8B5E3C] font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Sugestões</span>
                <h2 className="text-4xl md:text-5xl font-serif">Obras <span className="italic text-[#8B5E3C]">Relacionadas</span></h2>
              </div>
              <Link to="/biblioteca" className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">Ver Tudo</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedBooks.map(b => (
                <Link key={b.id} to={`/livro/${b.slug}`} className="glass p-4 rounded-3xl group hover:border-[#8B5E3C]/30 transition-all duration-500">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                    <img src={b.imageUrl || '/placeholder-book.jpg'} onError={(e) => { e.currentTarget.src = '/placeholder-book.jpg'; }} alt={b.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <h4 className="font-serif text-lg mb-1 group-hover:text-[#8B5E3C] transition-colors line-clamp-1">{b.title}</h4>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{b.author}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="py-12 border-t border-white/5 text-center text-white/20 text-xs uppercase tracking-widest">
        <p>&copy; 2026 Biblioteca Reformada. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
