import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { BookMarked, ShieldCheck, Users, Layers, ArrowLeft, ArrowRight, ShoppingCart, Info, Instagram, Youtube, Facebook, Check, Loader2, X, Calendar, Book as BookIcon, Hash, User, Building2, Target, Tag, ExternalLink, Menu, Play, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { getYouTubeEmbedUrl } from '../utils/youtube';

import Header from './Header';

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  logoUrl?: string;
  slogan?: string;
  marqueeItems: string;
  whatsappNumber: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface Post {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  imageAlt?: string;
  videoUrl?: string;
  videoKeywords?: string;
  metaKeywords?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId?: string;
  slug: string;
  imageUrl: string;
  imageAlt?: string;
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
  isFeatured?: boolean;
  isOffer?: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  characteristics: string[];
  buyUrl: string;
  images: string[];
  imageAlt?: string;
  videoUrl?: string;
  videoKeywords?: string;
  badge?: string;
  metaKeywords?: string;
}

export default function LandingPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let title = settings?.metaTitle || settings?.heroTitle || "Sandro G. - Tradição Reformada";
    let description = settings?.metaDescription || settings?.heroSubtitle || "";
    let keywords = settings?.metaKeywords || "";

    if (selectedPost) {
      title = `${selectedPost.title} | ${title}`;
      description = selectedPost.excerpt;
      keywords = selectedPost.metaKeywords || keywords;
    } else if (selectedBook) {
      title = `${selectedBook.title} - ${selectedBook.author} | ${title}`;
      description = selectedBook.synopsis || description;
      keywords = selectedBook.metaKeywords || keywords;
    } else if (selectedProduct) {
      title = `${selectedProduct.title} | ${title}`;
      description = selectedProduct.description;
      keywords = selectedProduct.metaKeywords || keywords;
    }

    document.title = title;

    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
  }, [settings, selectedPost, selectedBook, selectedProduct]);



  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('subscriptions').insert({
        email,
        created_at: new Date().toISOString()
      });
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (error) {
      console.error("Erro ao assinar newsletter:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
        setSettings({
          heroTitle: "Livros Cristãos Baseados no Ensino Reformado Com Fidelidade às Escrituras",
          heroSubtitle: "Um bom livro cristão é aquele que conduz o leitor de volta à Palavra de Deus e o ajuda a amar mais a Cristo.",
          heroImage: "https://images.unsplash.com/photo-1507738911748-9c7846274f3d?q=80&w=2070&auto=format&fit=crop",
          marqueeItems: "Teologia Reformada, Clássicos Cristãos, Vida Devocional, Estudo Bíblico, Doutrina Saudável, Amadurecimento Espiritual",
          logoUrl: "",
          whatsappNumber: "5548991709438"
        });
      }
    };
    // fetchSettings postponed to loadAll

    const fetchPosts = async () => {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) console.log('Erro detalhado: posts -', error);
      if (data) {
        setPosts(data.map((p: any) => ({
          id: String(p.id || ''),
          title: p.title || '',
          category: p.category || '',
          excerpt: p.excerpt || '',
          content: p.content || '',
          imageUrl: p.image_url || p.imageUrl || '',
          imageAlt: p.image_alt || p.imageAlt || '',
          videoUrl: p.video_url || p.videoUrl || '',
          videoKeywords: p.video_keywords || p.videoKeywords || '',
          metaKeywords: p.meta_keywords || p.metaKeywords || '',
          createdAt: {
            seconds: Math.floor(new Date(p.created_at || Date.now()).getTime() / 1000),
            nanoseconds: 0
          }
        })));
      }
    };
    // fetchPosts postponed to loadAll
    const fetchBooks = async () => {
      try {
        const [booksResponse, catsResponse] = await Promise.all([
          supabase.from('books').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*')
        ]);

        if (booksResponse.error || catsResponse.error) {
          console.log('Erro detalhado: books/categories -', booksResponse.error || catsResponse.error);
        }

        if (!booksResponse.data) {
          setBooks([]);
          return;
        }

        const catsData = catsResponse.data || [];

        const mappedBooks = booksResponse.data.map((b: any) => {
          const catName = catsData.find(c => String(c.id) === String(b.category || b.categoryId || b.categoria_id))?.nome || 'Sem Categoria';
          return {
            id: String(b.id || ''),
            title: b.title || b.titulo || '',
            author: b.author || b.autor || '',
            category: catName,
            categoryId: b.category || b.categoryId || b.categoria_id || '',
            slug: b.slug || '',
            imageUrl: b.cover_url || b.imageUrl || b.capa_url_new || '',
            imageAlt: b.cover_alt || '',
            videoUrl: b.videoUrl || b.video_url || '',
            buyUrl: b.amazon_url || b.buyUrl || b.buy_url || b.link_compra || '',
            publisher: b.publisher || b.editora || '',
            year: b.year || b.ano || '',
            pages: b.pages || b.paginas || '',
            synopsis: b.synopsis || b.sinopse || '',
            targetAudience: b.target_audience || b.targetAudience || b.indicacao || '',
            themes: b.main_themes || b.themes || b.temas || '',
            badge: b.badge || '',
            metaKeywords: b.seo_keywords || b.metaKeywords || b.meta_keywords || '',
            isFeatured: b.is_featured === true,
            isOffer: b.is_offer === true
          } as Book;
        });

        setBooks(mappedBooks);
      } catch (err) {
        console.error("Erro geral na busca de livros da Landing:", err);
      }
    };
    // fetchBooks postponed to loadAll


    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) console.log('Erro detalhado: products -', error);
      if (data) setProducts(data.map((d: any) => ({
        id: String(d.id || ''),
        title: d.title || '',
        description: d.description || '',
        characteristics: d.characteristics || [],
        buyUrl: d.buy_url || d.buyUrl || '',
        images: d.images || [],
        imageAlt: d.image_alt || d.imageAlt || '',
        videoUrl: d.video_url || d.videoUrl || '',
        videoKeywords: d.video_keywords || d.videoKeywords || '',
        metaKeywords: d.meta_keywords || d.metaKeywords || '',
        badge: d.badge || '',
        isFeatured: d.is_featured === true,
        isOffer: d.is_offer === true,
        createdAt: d.created_at || ''
      })));
    };
    // fetchProducts postponed to loadAll

    const loadAll = async () => {
      setIsLoading(true);
      setFetchError(null);
      await Promise.all([
        fetchSettings(),
        fetchPosts(),
        fetchBooks(),
        fetchProducts()
      ]);
      setIsLoading(false);
    };
    loadAll();

    return () => {
      // Nothing to cleanup
    };
  }, []);

  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-[#8B5E3C]/30 border-t-[#8B5E3C] rounded-full animate-spin"></div>
      <div className="space-y-3 flex flex-col items-center">
        <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse"></div>
        <div className="h-4 w-32 bg-white/5 rounded-lg animate-pulse"></div>
        <p className="text-[#8B5E3C] tracking-[0.2em] font-serif uppercase text-sm mt-4 animate-pulse">Preparando Biblioteca...</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center space-y-8 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <ShieldCheck className="w-12 h-12 text-red-500" />
      </div>
      <div>
        <h2 className="text-3xl md:text-5xl font-serif text-white mb-2">Ops! Acesso Negado</h2>
        <p className="text-[#8B5E3C] tracking-[0.2em] font-serif uppercase text-xs">Aviso de Segurança (Código 42501)</p>
      </div>
      <div className="max-w-lg mx-auto bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-white/70 leading-relaxed mb-4">
          Ocorreu um erro ao carregar os dados do painel. As configurações de segurança atuais do seu banco de dados (RLS) estão bloqueando o acesso público à biblioteca.
        </p>
        <p className="text-white/90 text-sm bg-black/50 p-4 rounded-lg">
          <strong className="text-[#D4C3A3]">Para corrigir agora mesmo:</strong><br />
          Vá ao seu painel do Supabase, acesse o módulo de <strong>SQL Editor</strong>, cole todo o conteúdo do arquivo <code>migration_fix.sql</code> e aperte em <strong>Run</strong>.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-10 py-5 bg-[#8B5E3C] text-white font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
      >
        Tentar Novamente
      </button>
    </div>
  );

  if (!settings) return null;

  // Safe Fallback Logic
  const heroTitle = String(settings.heroTitle || "Livros Cristãos Baseados no Ensino Reformado Com Fidelidade às Escrituras");
  const heroSubtitle = String(settings.heroSubtitle || "Um bom livro cristão é aquele que conduz o leitor de volta à Palavra de Deus e o ajuda a amar mais a Cristo.");
  const heroImage = settings.heroImage || "https://images.unsplash.com/photo-1507738911748-9c7846274f3d?q=80&w=2070&auto=format&fit=crop";
  const logoUrl = settings.logoUrl || "https://seudominio.com/imagens/logo.png";
  const slogan = settings.slogan || "Tradição Reformada & Sabedoria Cristã";
  const marqueeItemsRaw = settings.marqueeItems || "Teologia Reformada, Clássicos Cristãos, Vida Devocional, Estudo Bíblico, Doutrina Saudável, Amadurecimento Espiritual";
  const marqueeItemsString = Array.isArray(marqueeItemsRaw) ? marqueeItemsRaw.join(', ') : String(marqueeItemsRaw);
  const marqueeItems = marqueeItemsString.split(',').map(item => item.trim()).filter(item => item !== "");
  const whatsappNumber = String(settings.whatsappNumber || "5548991709438");



  // ESTANTE
  const safeProducts = products.map(p => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? (p.images as string).split('\n').filter(i => i.trim()) : []),
    characteristics: Array.isArray(p.characteristics) ? p.characteristics : (typeof p.characteristics === 'string' ? (p.characteristics as string).split('\n').filter(c => c.trim()) : [])
  }));

  return (
    <div className="bg-[#050505] text-[#F5F5F5] font-sans overflow-x-hidden">
      <Header settings={settings} />

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-[85vh] md:min-h-screen flex items-start md:items-center pt-44 md:pt-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            src={heroImage || undefined}
            alt="Library Background"
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-7xl lg:text-8xl font-serif font-bold leading-[1.1] mb-8 tracking-tighter text-white break-words"
            >
              Livros Cristãos Baseados no Ensino <span className="italic text-[#A07855]">Reformado</span> Com Fidelidade às Escrituras
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-3xl text-white/60 font-light max-w-2xl mb-12 leading-relaxed"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <a href="#livros" className="cta-pulse px-10 py-5 bg-[#8B5E3C] text-white font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform">
                Explorar Acervo
              </a>
              <a href="#estantes" className="px-10 py-5 glass text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors">
                Produtos Destaques
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="py-16 md:py-32 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-20"
        >
          <h2 className="text-4xl md:text-7xl font-serif mb-6">Por que construir sua<br /><span className="text-[#8B5E3C] italic">biblioteca conosco?</span></h2>
          <div className="w-20 h-1 bg-[#8B5E3C]"></div>
          <div className="bento-grid">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-12 md:col-span-7 glass p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-end min-h-[400px] md:min-h-[500px] relative overflow-hidden group"
            >
              <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-1000" alt="Books" referrerPolicy="no-referrer" />
              <div className="relative z-10">
                <ShieldCheck className="text-[#8B5E3C] w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6" />
                <h3 className="text-2xl md:text-3xl font-serif mb-3 md:mb-4">Curadoria Criteriosa</h3>
                <p className="text-base md:text-lg text-white/50 font-light leading-relaxed max-w-md">
                  Cada recomendação passa por um filtro rigoroso de fidelidade às Escrituras e profundidade teológica. Não apenas listamos livros, entregamos fundamentos.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-12 md:col-span-5 glass p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-center bg-[#8B5E3C]/10 border-[#8B5E3C]/20"
            >
              <Users className="text-[#8B5E3C] w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6" />
              <h3 className="text-2xl md:text-3xl font-serif mb-3 md:mb-4">Comunidade de Leitores</h3>
              <p className="text-base md:text-lg text-white/50 font-light leading-relaxed">
                Junte-se a milhares de cristãos que buscam o amadurecimento espiritual através da leitura séria e do estudo bíblico constante.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="col-span-12 md:col-span-5 glass p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-center"
            >
              <Layers className="text-[#8B5E3C] w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6" />
              <h3 className="text-2xl md:text-3xl font-serif mb-3 md:mb-4">Recursos Digitais</h3>
              <p className="text-base md:text-lg text-white/50 font-light leading-relaxed">
                Indicações de Kindles, aplicativos de estudo e ferramentas que otimizam seu tempo e organização.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="col-span-12 md:col-span-7 glass p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden group"
            >
              <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-110 transition-transform duration-1000" alt="Study" referrerPolicy="no-referrer" />
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-serif mb-3 md:mb-4">Legado Espiritual</h3>
                <p className="text-base md:text-lg text-white/50 font-light leading-relaxed max-w-md">
                  Ajudamos você a formar uma biblioteca que não apenas decora sua estante, mas transforma sua vida e de sua família.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* LIVROS */}
      <section id="livros" className="py-16 md:py-32 bg-white/[0.01]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-[#8B5E3C] font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">O Acervo</span>
              <h2 className="text-4xl md:text-7xl font-serif">Obras que <span className="italic text-[#8B5E3C]">Edificam.</span></h2>
            </div>
            <div className="flex gap-4">
              <button className="p-4 glass rounded-full hover:bg-[#8B5E3C] transition-colors"><ArrowLeft /></button>
              <button className="p-4 glass rounded-full hover:bg-[#8B5E3C] transition-colors"><ArrowRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {books.length > 0 ? books.map(book => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative"
              >
                {/* Book Card */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 glass border-white/5 group-hover:border-[#8B5E3C]/30 transition-all duration-500">
                  <img src={book.imageUrl || '/placeholder-book.jpg'} onError={(e) => { e.currentTarget.src = '/placeholder-book.jpg'; }} alt={book.imageAlt || book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40" referrerPolicy="no-referrer" />

                  {/* Badge */}
                  {book.badge && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-[#8B5E3C] text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                        {book.badge}
                      </span>
                    </div>
                  )}

                  {/* Hover Info */}
                  <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-center p-8 text-center">
                    <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex flex-col gap-3">
                        <a
                          href={book.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-[#8B5E3C] text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#D4C3A3] transition-colors flex items-center justify-center"
                        >
                          Ver Preço na Amazon
                        </a>
                        <button
                          onClick={() => setSelectedBook(book)}
                          className="w-full py-3 glass text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                        >
                          Saiba Mais
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info (Static) */}
                <div className="px-2">
                  <span className="text-[#8B5E3C] text-[10px] font-bold uppercase tracking-widest mb-2 block">{book.category}</span>
                  <h4
                    onClick={() => setSelectedBook(book)}
                    className="text-xl font-serif mb-1 group-hover:text-[#8B5E3C] transition-colors cursor-pointer hover:underline decoration-[#8B5E3C]/30 underline-offset-4"
                  >
                    {book.title}
                  </h4>
                  <p className="text-white/40 text-sm italic">{book.author}</p>
                </div>
              </motion.div>
            )) : (
              <p className="text-white/30 col-span-full text-center">Nenhum livro cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* BOOK DETAILS MODAL */}
        {selectedBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedBook(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-5xl max-h-[90vh] glass rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row z-10 border-white/10"
            >
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-6 right-6 z-20 p-3 glass rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Left: Image or Video */}
              <div className="w-full md:w-2/5 h-64 md:h-auto relative bg-black/40">
                {(() => {
                  const youtubeUrl = selectedBook.videoUrl ? getYouTubeEmbedUrl(selectedBook.videoUrl) : null;
                  if (selectedBook.videoUrl) {
                    if (youtubeUrl) {
                      return (
                        <iframe
                          src={youtubeUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={selectedBook.title}
                        />
                      );
                    }
                    return (
                      <video
                        src={selectedBook.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster={selectedBook.imageUrl}
                      />
                    );
                  }
                  return (
                    <img src={selectedBook.imageUrl || undefined} className="w-full h-full object-cover" alt={selectedBook.imageAlt || selectedBook.title} referrerPolicy="no-referrer" />
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:hidden pointer-events-none"></div>
              </div>

              {/* Right: Content */}
              <div className="w-full md:w-3/5 p-8 md:p-16 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-[#8B5E3C]/20 text-[#8B5E3C] text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {selectedBook.category}
                    </span>
                    {selectedBook.badge && (
                      <span className="px-3 py-1 bg-[#8B5E3C] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {selectedBook.badge}
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">{selectedBook.title}</h2>
                  <p className="text-xl text-[#D4C3A3] italic font-serif">{selectedBook.author}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 py-8 border-y border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Editora
                    </span>
                    <p className="text-sm font-medium">{selectedBook.publisher || "---"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Publicação
                    </span>
                    <p className="text-sm font-medium">{selectedBook.year || "---"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Páginas
                    </span>
                    <p className="text-sm font-medium">{selectedBook.pages || "---"}</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-4">Sinopse</h4>
                    <p className="text-white/60 font-light leading-relaxed text-lg italic">
                      {selectedBook.synopsis || "Sinopse não disponível para este título."}
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-4">Para quem é indicado</h4>
                    <div className="flex items-start gap-4 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                      <Target className="w-6 h-6 text-[#8B5E3C] shrink-0 mt-1" />
                      <p className="text-white/70 font-light leading-relaxed">
                        {selectedBook.targetAudience || "Indicado para todos os que buscam crescimento na fé reformada."}
                      </p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-4">Principais Temas</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBook.themes || selectedBook.category).split(',').map((theme, i) => (
                        <span key={i} className="px-4 py-2 glass rounded-xl text-xs text-white/60 flex items-center gap-2">
                          <Tag className="w-3 h-3 text-[#8B5E3C]" /> {theme.trim()}
                        </span>
                      ))}
                    </div>
                  </section>

                  <div className="pt-10 flex flex-col sm:flex-row gap-4">
                    <a
                      href={selectedBook.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-5 bg-[#8B5E3C] text-white font-bold uppercase tracking-widest rounded-full hover:bg-[#D4C3A3] transition-colors flex items-center justify-center shadow-xl shadow-[#8B5E3C]/10"
                    >
                      Ver Preço na Amazon
                    </a>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="px-10 py-5 glass text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* ESTANTE */}
      <section id="estantes" className="py-16 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          {safeProducts.length > 0 ? safeProducts.map((product, index) => (
            <div key={product.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-start ${index > 0 ? 'mt-16 md:mt-64' : ''}`}>
              <div className={`relative ${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
                <div
                  className="aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden relative group shadow-2xl bg-black cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setCurrentImageIndex(product.videoUrl ? -1 : 0);
                  }}
                >
                  {product.videoUrl ? (
                    getYouTubeEmbedUrl(product.videoUrl) ? (
                      <div className="w-full h-full relative">
                        <img
                          src={product.images[0] || undefined}
                          alt={product.imageAlt || product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 md:w-12 md:h-12 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={product.videoUrl}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        muted
                        loop
                        playsInline
                        autoPlay
                        poster={product.images[0]}
                      />
                    )
                  ) : (
                    <img
                      src={product.images[0] || undefined}
                      alt={product.imageAlt || product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {product.videoUrl && (
                    <div className="absolute top-6 right-6 bg-[#8B5E3C] px-3 py-1 rounded-full shadow-lg z-10">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white flex items-center gap-1">
                        <Play className="w-2 h-2 fill-white" /> Vídeo
                      </span>
                    </div>
                  )}
                </div>
                {product.badge && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] md:translate-y-[85%] bg-black/60 backdrop-blur-xl p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl z-20 text-center w-[80%] md:w-[70%] max-w-[280px]">
                    <span className="text-xl md:text-4xl font-serif text-[#8B5E3C] block mb-1">{product.badge.split(' ')[0]}</span>
                    <span className="text-[7px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold text-white/90 leading-relaxed block">
                      {product.badge.split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                )}
              </div>

              <div className={`mt-12 md:mt-0 ${index % 2 !== 0 ? 'lg:order-1' : ''}`}>
                <span className="text-[#8B5E3C] font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-4 md:mb-6 block">Exclusividade Biblioteca Reformada</span>
                <h2 className="text-3xl md:text-7xl font-serif mb-6 md:mb-8 leading-tight">{product.title}</h2>
                <p className="text-white/50 text-lg md:text-2xl font-light mb-8 md:mb-12 leading-relaxed">
                  {product.description}
                </p>

                <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                  {product.characteristics.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-4 md:gap-5">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#8B5E3C]/20 flex items-center justify-center">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-[#8B5E3C]" />
                      </div>
                      <span className="text-base md:text-white/80 font-light">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                  <a
                    href={product.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 md:px-12 py-4 md:py-6 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-[#8B5E3C] hover:text-white transition-all duration-500 text-center text-xs md:text-base"
                  >
                    Encomendar Agora
                  </a>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentImageIndex(product.videoUrl ? -1 : 0);
                    }}
                    className="px-8 md:px-12 py-4 md:py-6 glass text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all duration-500 text-xs md:text-base"
                  >
                    Saiba Mais
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-20">
              <p className="text-white/30 italic">Nenhum produto artesanal cadastrado ainda.</p>
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS MODAL */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-6xl max-h-[90vh] glass rounded-[3rem] overflow-hidden flex flex-col lg:flex-row z-10 border-white/10"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-8 right-8 z-30 p-3 glass rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Left: Image Carousel or Video */}
              <div className="w-full lg:w-1/2 h-80 lg:h-auto relative bg-black/20">
                {(() => {
                  const youtubeUrl = selectedProduct.videoUrl ? getYouTubeEmbedUrl(selectedProduct.videoUrl) : null;
                  if (selectedProduct.videoUrl && currentImageIndex === -1) {
                    if (youtubeUrl) {
                      return (
                        <iframe
                          src={youtubeUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={selectedProduct.title}
                        />
                      );
                    }
                    return (
                      <video
                        src={selectedProduct.videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        autoPlay
                      />
                    );
                  }
                  return (
                    <motion.img
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={selectedProduct.images[currentImageIndex === -1 ? 0 : currentImageIndex] || undefined}
                      className="w-full h-full object-cover"
                      alt={selectedProduct.imageAlt || selectedProduct.title}
                    />
                  );
                })()}

                <div className="absolute inset-x-0 bottom-8 flex justify-center gap-3 z-20">
                  {selectedProduct.videoUrl && (
                    <button
                      onClick={() => setCurrentImageIndex(-1)}
                      className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${currentImageIndex === -1 ? 'bg-[#8B5E3C]' : 'bg-white/20 hover:bg-white/40'}`}
                    >
                      <Play className="w-4 h-4 text-white fill-white" />
                    </button>
                  )}
                  {selectedProduct.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-3 h-3 rounded-full transition-all ${i === currentImageIndex ? 'bg-[#8B5E3C] w-8' : 'bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>

                {selectedProduct.images.length > 1 && currentImageIndex !== -1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev <= 0 ? selectedProduct.images.length - 1 : prev - 1))}
                      className="absolute left-6 top-1/2 -translate-y-1/2 p-4 glass rounded-full hover:bg-white/10 transition-colors z-20"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev >= selectedProduct.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-4 glass rounded-full hover:bg-white/10 transition-colors z-20"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Right: Content */}
              <div className="w-full lg:w-1/2 p-10 lg:p-20 overflow-y-auto custom-scrollbar">
                <div className="mb-12">
                  {selectedProduct.badge && (
                    <span className="inline-block px-4 py-1.5 bg-[#8B5E3C] text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
                      {selectedProduct.badge}
                    </span>
                  )}
                  <h2 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">{selectedProduct.title}</h2>
                  <p className="text-white/50 text-xl font-light leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-12">
                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8B5E3C] mb-8">Características Técnicas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {selectedProduct.characteristics.map((char, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                          <Check className="w-5 h-5 text-[#8B5E3C] shrink-0" />
                          <span className="text-sm text-white/70 font-light">{char}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="pt-12 flex flex-col sm:flex-row gap-6">
                    <a
                      href={selectedProduct.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-6 bg-[#8B5E3C] text-white font-bold uppercase tracking-widest rounded-full hover:bg-[#D4C3A3] transition-colors flex items-center justify-center gap-3 shadow-2xl shadow-[#8B5E3C]/20"
                    >
                      Encomendar Agora
                    </a>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-12 py-6 glass text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* BLOG */}
      <section id="blog" className="py-16 md:py-32 bg-white/[0.01]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
            <div>
              <span className="text-[#8B5E3C] font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Conhecimento</span>
              <h2 className="text-4xl md:text-7xl font-serif">Artigos do <span className="italic text-[#8B5E3C]">Blog.</span></h2>
            </div>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-[#8B5E3C] pb-2 hover:text-[#8B5E3C] transition-colors">Ver Todos os Artigos</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {posts.length > 0 ? posts.map(post => (
              <article
                key={post.id}
                className="group cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <div className="aspect-video rounded-3xl overflow-hidden mb-8 relative">
                  <img src={post.imageUrl || undefined} alt={post.imageAlt || post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  {post.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white">Vídeo</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[#8B5E3C] text-[10px] font-bold uppercase tracking-widest mb-4 block">{post.category}</span>
                <h3 className="text-2xl font-serif mb-4 group-hover:text-[#D4C3A3] transition-colors leading-snug">{post.title}</h3>
                <p className="text-white/40 text-lg font-light line-clamp-2 leading-relaxed mb-6">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8B5E3C] group-hover:text-[#D4C3A3] transition-colors">
                  Ler Artigo Completo <ArrowRight className="w-3 h-3" />
                </div>
              </article>
            )) : (
              <p className="text-white/30 col-span-full text-center">Nenhum artigo publicado ainda.</p>
            )}
          </div>
        </div>

        {/* ARTICLE MODAL */}
        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPost(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] glass rounded-[3rem] overflow-hidden flex flex-col z-10 border-white/10"
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-8 right-8 z-30 p-3 glass rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto custom-scrollbar">
                  <div className="relative h-64 md:h-96 w-full bg-black">
                    {(() => {
                      const youtubeUrl = selectedPost.videoUrl ? getYouTubeEmbedUrl(selectedPost.videoUrl) : null;
                      if (selectedPost.videoUrl && youtubeUrl) {
                        return (
                          <iframe
                            src={youtubeUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={selectedPost.title}
                          />
                        );
                      }
                      return (
                        <>
                          <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt={selectedPost.imageAlt || selectedPost.title} referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                          {selectedPost.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                <Play className="w-10 h-10 text-white fill-white" />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {!(selectedPost.videoUrl && getYouTubeEmbedUrl(selectedPost.videoUrl)) && (
                      <div className="absolute bottom-12 left-8 md:left-16 right-8 md:right-16 pointer-events-none">
                        <span className="px-3 py-1 bg-[#8B5E3C] text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 inline-block">
                          {selectedPost.category}
                        </span>
                        <h2 className="text-3xl md:text-5xl font-serif leading-tight text-white drop-shadow-lg">{selectedPost.title}</h2>
                      </div>
                    )}
                  </div>

                  <div className="p-8 md:p-16 max-w-3xl mx-auto">
                    <header className="mb-12 text-center">
                      <span className="text-[#8B5E3C] text-xs font-bold uppercase tracking-[0.3em] mb-4 block">
                        {selectedPost.category}
                      </span>
                      <h1 className="text-4xl md:text-6xl font-serif mb-8 leading-tight text-white">
                        {selectedPost.title}
                      </h1>
                      <div className="flex items-center justify-center gap-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {Math.ceil((selectedPost.content?.split(' ').length || 0) / 200)} min de leitura
                        </span>
                        {selectedPost.createdAt && (
                          <span>
                            {new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </header>

                    <div className="rich-text-content">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(selectedPost.content || selectedPost.excerpt)
                        }}
                      />
                    </div>

                    {selectedPost.videoUrl && !getYouTubeEmbedUrl(selectedPost.videoUrl) && (
                      <div className="mt-12">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-6">Vídeo Relacionado</h4>
                        <div className="aspect-video rounded-3xl overflow-hidden glass border border-white/5">
                          <video src={selectedPost.videoUrl} controls className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    <div className="mt-16 pt-12 border-t border-white/5 flex justify-center">
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="px-12 py-5 bg-[#8B5E3C] text-white font-bold uppercase tracking-widest rounded-full hover:bg-[#D4C3A3] transition-colors shadow-xl shadow-[#8B5E3C]/20"
                      >
                        Voltar ao Blog
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* FOOTER */}
      <footer className="pt-12 md:pt-32 pb-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 mb-12 md:mb-32">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <div className="w-10 h-10 bg-[#8B5E3C] rounded-lg flex items-center justify-center">
                  <BookMarked className="text-white w-6 h-6" />
                </div>
                <span className="text-xl md:text-2xl font-serif font-bold tracking-tighter">
                  BIBLIOTECA<span className="text-[#8B5E3C]">REFORMADA</span>
                </span>
              </div>
              <p className="text-white/40 text-lg md:text-xl font-light leading-relaxed max-w-md mb-8 md:mb-10">
                Dedicados a promover a glória de Deus através da boa literatura cristã. Curadoria fiel às Escrituras e à tradição reformada.
              </p>
              <div className="flex gap-4 md:gap-6">
                <a href="#" className="w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center hover:bg-[#8B5E3C] transition-colors"><Instagram className="w-4 h-4 md:w-5 md:h-5" /></a>
                <a href="#" className="w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center hover:bg-[#8B5E3C] transition-colors"><Youtube className="w-4 h-4 md:w-5 md:h-5" /></a>
                <a href="#" className="w-10 h-10 md:w-12 md:h-12 glass rounded-full flex items-center justify-center hover:bg-[#8B5E3C] transition-colors"><Facebook className="w-4 h-4 md:w-5 md:h-5" /></a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-10">Navegação</h5>
              <ul className="space-y-6 text-sm text-white/50 font-light">
                <li><a href="#home" className="hover:text-white transition-colors">Início</a></li>
                <li><a href="#livros" className="hover:text-white transition-colors">Livros Recomendados</a></li>
                <li><a href="#estantes" className="hover:text-white transition-colors">Produtos Destaques</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Artigos do Blog</a></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Painel Admin</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-10">Categorias</h5>
              <ul className="space-y-6 text-sm text-white/50 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Teologia</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vida Cristã</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hermenêutica</a></li>
                <li><a href="#" className="hover:text-white transition-colors">História</a></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8B5E3C] mb-10">Newsletter</h5>
              <p className="text-white/40 text-sm font-light mb-8">Receba curadorias exclusivas e novos artigos diretamente no seu e-mail.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder={subscribed ? "Obrigado por assinar!" : "Seu melhor e-mail"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || subscribed}
                  className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#8B5E3C] transition-all ${subscribed ? 'border-green-500/50 text-green-400' : ''}`}
                />
                <button
                  type="submit"
                  disabled={submitting || subscribed}
                  className="w-full py-4 bg-[#8B5E3C] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : subscribed ? <Check className="w-4 h-4 mr-2" /> : null}
                  {subscribed ? "Inscrito com Sucesso" : "Assinar Newsletter"}
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-8">
            <p className="text-[9px] text-white/20 uppercase tracking-[0.4em]">
              &copy; 2026 Biblioteca Reformada. Todos os direitos reservados.
            </p>
            <div className="flex gap-10 text-[9px] text-white/20 uppercase tracking-[0.4em]">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>
      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group"
        title="Fale Conosco no WhatsApp"
      >
        <div className="absolute -left-32 bg-white text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl hidden md:block">
          Fale Conosco
        </div>
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
