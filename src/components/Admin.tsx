import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { LayoutDashboard, Settings, BookOpen, FileText, LogOut, Plus, Trash2, Save, ExternalLink, Mail, Pencil, X, Package, Image as ImageIcon, Loader2, Check, Video, Film, Lock, User as UserIcon, Users, Tag } from 'lucide-react';
import { processImage, fileToBase64 } from '../utils/imageProcessor';
import { getYouTubeThumbnail } from '../utils/youtube';
import { generateSlug } from '../utils/slug';

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'posts' | 'books' | 'categories' | 'subs' | 'products' | 'users'>('settings');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isSuperAdmin = user?.email?.toLowerCase() === "sandrog3@gmail.com";
  const isAdminUser = isSuperAdmin || role === 'admin' || role === 'editor';

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: ""
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Users Management State
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: "", password: "", displayName: "", role: "user" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    logoUrl: "",
    slogan: "",
    whatsappNumber: "",
    marqueeItems: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: ""
  });

  // Posts State
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({
    title: "",
    category: "",
    excerpt: "",
    content: "",
    imageUrl: "",
    imageAlt: "",
    videoUrl: "",
    videoKeywords: "",
    metaKeywords: ""
  });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Books State
  const [books, setBooks] = useState<any[]>([]);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    categoryId: "",
    imageUrl: "",
    imageAlt: "",
    videoUrl: "",
    buyUrl: "",
    publisher: "",
    year: "",
    pages: "",
    synopsis: "",
    targetAudience: "",
    themes: "",
    badge: "",
    metaKeywords: "",
    slug: "",
    isFeatured: false,
    isOffer: false
  });
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    characteristics: "",
    buyUrl: "",
    images: "",
    imageAlt: "",
    videoUrl: "",
    videoKeywords: "",
    metaKeywords: "",
    badge: "",
    isFeatured: false,
    isOffer: false
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  const handleDatabaseError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: user?.id || '',
        email: user?.email || ''
      }
    };
    console.error('Database Error: ', JSON.stringify(errInfo));
    if (operationType !== OperationType.GET) {
      showNotification(`Erro (${operationType}): ${errInfo.error}. Verifique se todos os campos obrigatórios estão preenchidos corretamente.`, 'error');
    }
    throw new Error(JSON.stringify(errInfo));
  };

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchUsers = async () => {
    // No longer needed, using onSnapshot
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUsersLoading(true);
    try {
      const sessionSnap = await supabase.auth.getSession();
      const token = sessionSnap.data.session?.access_token;

      if (editingUserId) {
        const response = await fetch(`/api/users/${editingUserId}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: newUser.role, displayName: newUser.displayName })
        });
        if (!response.ok) throw new Error("Erro na API ao atualizar permissões.");
        showNotification("Usuário atualizado com permissões elevadas!");
      } else {
        // Criar usuário diretamente usando a API de Admin do Supabase via Backend
        const response = await fetch(`/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: newUser.email, role: newUser.role, displayName: newUser.displayName, password: newUser.password })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Falha ao criar/autorizar usuário.");
        }
        showNotification("O usuário foi criado e autorizado com sucesso no fluxo do Supabase!");
      }

      setNewUser({ email: "", password: "", displayName: "", role: "user" });
      setEditingUserId(null);
    } catch (error: any) {
      console.error('Error saving user:', error);
      showNotification(error?.message || 'Erro ao processar a inclusão da autorização de usuário', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserDelete = async (uid: string) => {
    if (!user) return;
    askConfirm("Tem certeza que deseja excluir este usuário?", async () => {
      setUsersLoading(true);
      try {
        await supabase.from("users").delete().eq("id", uid);
        showNotification("Usuário excluído!");
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Erro ao excluir usuário.', 'error');
      } finally {
        setUsersLoading(false);
      }
    });
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const updateStateWithURL = (type: string, fileType: string, url: string) => {
    if (type === 'book') {
      if (fileType === 'image') setNewBook(prev => ({ ...prev, imageUrl: url }));
      else setNewBook(prev => ({ ...prev, videoUrl: url }));
    } else if (type === 'product') {
      if (fileType === 'image') {
        const currentImages = newProduct.images.split('\n').filter(i => i.trim());
        setNewProduct(prev => ({ ...prev, images: [...currentImages, url].join('\n') }));
      } else {
        setNewProduct(prev => ({ ...prev, videoUrl: url }));
      }
    } else if (type === 'post') {
      if (fileType === 'image') setNewPost(prev => ({ ...prev, imageUrl: url }));
      else setNewPost(prev => ({ ...prev, videoUrl: url }));
    } else if (type === 'hero') {
      setSiteSettings(prev => ({ ...prev, heroImage: url }));
    } else if (type === 'logo') {
      setSiteSettings(prev => ({ ...prev, logoUrl: url }));
    } else if (type === 'category') {
      if (fileType === 'image') setNewCategory(prev => ({ ...prev, imageUrl: url }));
    }
  };

  useEffect(() => {
    // No longer needed, using onSnapshot
  }, []);

  const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('biblioteca-public')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'application/octet-stream'
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw new Error(error.message);
      }

      const { data: publicData } = supabase.storage
        .from('biblioteca-public')
        .getPublicUrl(path);

      return publicData.publicUrl;
    } catch (e: any) {
      throw new Error(e.message || 'Erro no upload direto para o Supabase');
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'book' | 'product' | 'post' | 'hero' | 'logo' | 'category',
    fileType: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size (e.g., 50MB for videos, 5MB for images)
    const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification(`Arquivo muito grande. Limite: ${fileType === 'video' ? '50MB' : '5MB'}`, 'error');
      return;
    }

    setIsUploading(true);
    const uploadId = `${type}-${fileType}`;
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

    try {
      let fileToUpload = file;


      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;

      let basePath = '';
      if (type === 'hero' || type === 'logo') {
        basePath = `branding/${type}`;
      } else if (type === 'book') {
        basePath = 'books/capas';
      } else if (type === 'category') {
        basePath = 'categories';
      } else {
        basePath = `${type}s`;
        // type === 'post' -> 'posts', type === 'product' -> 'products'
      }

      const path = `${basePath}/${fileName}`;
      console.log(`Iniciando upload proxy para Supabase: ${path}`);

      try {
        const downloadURL = await uploadFile(fileToUpload, path);
        console.log("Upload universal concluído:", downloadURL);

        updateStateWithURL(type, fileType, downloadURL);
        showNotification(`${fileType === 'image' ? 'Imagem' : 'Vídeo'} enviado via Supabase!`);
      } catch (error: any) {
        console.error(`Erro no upload do ${fileType}:`, error);

        // Fallback for images if proxy fails
        if (fileType === 'image') {
          console.log("Tentando fallback para Base64 devido a erro de API...");
          try {
            const base64 = await fileToBase64(fileToUpload as File);
            updateStateWithURL(type, fileType, base64);
            showNotification("Imagem carregada (via fallback Base64).", 'info');
          } catch (fallbackErr) {
            console.error("Erro no fallback Base64:", fallbackErr);
            showNotification(`Erro no upload: ${error.message || 'Erro desconhecido'}`, 'error');
          }
        } else {
          showNotification(`Erro no upload do vídeo: ${error.message || 'Erro desconhecido'}`, 'error');
        }
      }
    } catch (error: any) {
      console.error("Erro geral no upload:", error);
      showNotification(`Erro ao processar arquivo: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
      e.target.value = '';
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        await performExport(tokens);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [subscriptions]);

  const performExport = async (tokens: any) => {
    setExporting(true);
    try {
      const response = await fetch('/api/export/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, data: subscriptions })
      });
      const result = await response.json();
      if (result.url) {
        setSheetUrl(result.url);
        window.open(result.url, '_blank');
      } else {
        showNotification("Erro ao exportar: " + result.error, 'error');
      }
    } catch (e) {
      showNotification("Erro na exportação: " + e, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleGoogleExport = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (e) {
      showNotification("Erro ao iniciar autenticação: " + e, 'error');
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user;
      setUser(u as any);
      // Controle de segurança simplificado a pedido do usuário: se está logado, entra.
      setRole(u ? 'admin' : null);
      setLoading(false);
    });

    const fetchAdminSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (data && !error) {
        setSiteSettings({
          heroTitle: data.hero_title || "",
          heroSubtitle: data.hero_subtitle || "",
          heroImage: data.hero_image || "",
          logoUrl: data.logo_url || "",
          slogan: data.slogan || "",
          whatsappNumber: data.whatsapp_number || "",
          marqueeItems: data.marquee_items || "",
          metaTitle: data.meta_title || "",
          metaDescription: data.meta_description || "",
          metaKeywords: data.meta_keywords || ""
        });
      }
    };
    fetchAdminSettings();

    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data.map((d: any) => ({
        id: String(d.id || ''),
        title: d.title || '',
        category: d.category || '',
        excerpt: d.excerpt || '',
        content: d.content || '',
        imageUrl: d.image_url || d.imageUrl || '',
        imageAlt: d.image_alt || d.imageAlt || '',
        videoUrl: d.video_url || d.videoUrl || '',
        videoKeywords: d.video_keywords || d.videoKeywords || '',
        metaKeywords: d.meta_keywords || d.metaKeywords || '',
        createdAt: d.created_at || ''
      })));
    };
    fetchPosts();

    const fetchSupabaseBooks = async () => {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        setBooks(data.map((b: any) => ({
          id: String(b.id || ''),
          title: b.title || '',
          author: b.author || '',
          category: b.category ? String(b.category) : 'Sem Categoria',
          categoryId: String(b.category || ''),
          slug: b.slug || '',
          imageUrl: b.cover_url || '',
          imageAlt: b.cover_alt || '',
          videoUrl: b.video_url || '',
          buyUrl: b.amazon_url || '',
          publisher: b.publisher || '',
          year: b.year || '',
          pages: b.pages || '',
          synopsis: b.synopsis || '',
          targetAudience: b.target_audience || '',
          themes: b.main_themes || '',
          badge: b.badge || '',
          metaKeywords: b.seo_keywords || ''
        })));
      }
    };
    fetchSupabaseBooks();

    fetchCategories();
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (data) setProducts(data.map((d: any) => ({
        id: String(d.id || ''),
        title: d.title || '',
        description: d.description || '',
        characteristics: Array.isArray(d.characteristics) ? d.characteristics.join('\n') : (d.characteristics || ''),
        buyUrl: d.buy_url || d.buyUrl || '',
        images: Array.isArray(d.images) ? d.images.join('\n') : (d.images || ''),
        imageAlt: d.image_alt || d.imageAlt || '',
        videoUrl: d.video_url || d.videoUrl || '',
        videoKeywords: d.video_keywords || d.videoKeywords || '',
        metaKeywords: d.meta_keywords || d.metaKeywords || '',
        badge: d.badge || '',
        createdAt: d.created_at || ''
      })));
    };
    fetchProducts();
    // Observação: movido fetchUsersList para um useEffect independente

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Matrix vazia conforme solicitado

  useEffect(() => {
    if (isAdminUser) {
      // Busca da dados de usúario removida temporariamente a pedido do usuário.
    }
  }, [isAdminUser]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const login = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: "google" });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        showNotification("Erro: Domínio não autorizado. Adicione 'bibliotecareformada.com' nos domínios autorizados do Supabase.", 'error');
      } else {
        showNotification(`Erro ao entrar: ${error.message}`, 'error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await supabase.auth.signUp({ email, password });
        showNotification("Conta criada com sucesso! Você já pode acessar o painel.");
      } else {
        await supabase.auth.signInWithPassword({ email, password });
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      let msg = "Erro na autenticação.";

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "Credenciais inválidas. Verifique seu e-mail e senha. IMPORTANTE: Se o administrador autorizou seu e-mail recentemente, você ainda precisa clicar na aba 'CADASTRAR' acima para criar sua senha pela primeira vez.";
      } else if (error.code === 'auth/email-already-in-use') {
        msg = "Este e-mail já está cadastrado. Mudando para modo de login...";
        setIsRegistering(false);
      } else if (error.code === 'auth/weak-password') {
        msg = "Senha muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = "O login por e-mail está desativado. Ative 'Email/Password' no Supabase > Authentication > Sign-in method.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Muitas tentativas malsucedidas. Tente novamente mais tarde ou redefina sua senha.";
      } else if (error.code === 'auth/user-disabled') {
        msg = "Esta conta foi desativada. Entre em contato com o suporte.";
      } else if (error.code === 'auth/network-request-failed') {
        msg = "Erro de rede. Verifique sua conexão com a internet.";
      } else {
        msg = `Erro: ${error.message}`;
      }

      showNotification(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
  };
  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetPassword = async () => {
    if (!email) {
      showNotification("Digite seu e-mail para recuperar a senha.", 'error');
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email);
      showNotification("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Reset password error:", error);
      showNotification("Erro ao enviar e-mail de recuperação.", 'error');
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleBrandingUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'logo') => {
    return handleFileUpload(e, type, 'image');
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(siteSettings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao persistir no DB');
      }

      showNotification("Branding global salvo no banco Definitivo com rigorosa segurança!");
    } catch (e: any) {
      console.error("Bridge RLS failure:", e);
      showNotification(`Erro ao gravar configurações: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addPost = async () => {
    if (!newPost.title || !newPost.category) {
      showNotification("Título e Categoria são obrigatórios.", 'error');
      return;
    }
    try {
      const postPayload = {
        title: newPost.title,
        category: newPost.category,
        excerpt: newPost.excerpt,
        content: newPost.content,
        image_url: newPost.imageUrl,
        image_alt: newPost.imageAlt,
        video_url: newPost.videoUrl,
        video_keywords: newPost.videoKeywords,
        meta_keywords: newPost.metaKeywords
      };

      if (editingPostId) {
        await supabase.from("posts").update({ ...postPayload, updated_at: new Date().toISOString() }).eq("id", editingPostId);
        setEditingPostId(null);
        showNotification("Postagem atualizada!");
      } else {
        await supabase.from("posts").insert({ ...postPayload, created_at: new Date().toISOString() });
        showNotification("Postagem adicionada!");
      }
      setNewPost({
        title: "",
        category: "",
        excerpt: "",
        content: "",
        imageUrl: "",
        imageAlt: "",
        videoUrl: "",
        videoKeywords: "",
        metaKeywords: ""
      });
    } catch (e: any) {
      showNotification(`Erro ao salvar postagem: ${e.message || e.code || 'Desconhecido'}`, 'error');
    }
  };

  const startEditPost = (post: any) => {
    setEditingPostId(post.id);
    setNewPost({
      title: post.title || "",
      category: post.category || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      imageAlt: post.imageAlt || "",
      videoUrl: post.videoUrl || "",
      videoKeywords: post.videoKeywords || "",
      metaKeywords: post.metaKeywords || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePost = async (id: string) => {
    askConfirm("Excluir postagem?", async () => {
      try {
        await supabase.from("posts").delete().eq("id", id);
        showNotification("Postagem excluída!");
      } catch (e: any) {
        showNotification(`Erro ao excluir postagem: ${e.message || e.code || 'Desconhecido'}`, 'error');
      }
    });
  };

  const addCategory = async () => {
    if (!newCategory.name) {
      showNotification("Nome da categoria é obrigatório.", 'error');
      return;
    }
    try {
      const slug = newCategory.slug || generateSlug(newCategory.name);
      const payload = {
        nome: newCategory.name,
        slug,
        descricao: newCategory.description,
        image_url: newCategory.imageUrl
      };

      if (editingCategoryId) {
        await supabase.from('categories').update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingCategoryId);
        setEditingCategoryId(null);
        showNotification("Categoria atualizada!");
      } else {
        await supabase.from("categories").insert({ ...payload, created_at: new Date().toISOString() });
        showNotification("Categoria adicionada!");
      }
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        imageUrl: ""
      });
      await fetchCategories();
    } catch (e: any) {
      showNotification(`Erro ao salvar categoria: ${e.message || e.code || 'Desconhecido'}`, 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    askConfirm("Excluir categoria? Livros vinculados a ela não serão excluídos, mas perderão o vínculo.", async () => {
      try {
        await supabase.from("categories").delete().eq("id", id);
        showNotification("Categoria excluída!");
        await fetchCategories();
      } catch (e: any) {
        showNotification(`Erro ao excluir categoria: ${e.message || e.code || 'Desconhecido'}`, 'error');
      }
    });
  };

  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setNewCategory({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      imageUrl: category.imageUrl || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setNewCategory({
      name: "",
      slug: "",
      description: "",
      imageUrl: ""
    });
  };

  const fetchSupabaseBooks = async () => {
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (data && !error) {
      setBooks(data.map((b: any) => ({
        id: String(b.id || ''),
        title: b.title || b.titulo || '',
        author: b.author || b.autor || '',
        category: b.category || b.categoryId || b.category_id || b.categoria_id ? String(b.category || b.categoryId || b.category_id || b.categoria_id) : 'Sem Categoria',
        categoryId: String(b.category || b.categoryId || b.category_id || b.categoria_id || ''),
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
        metaKeywords: b.seo_keywords || b.metaKeywords || b.meta_keywords || ''
      })));
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      console.error("Erro CRÍTICO no select das categories (401/42501):", error);
    }
    if (data) {
      setCategories(data.map((d: any) => ({ ...d, id: String(d.id), name: d.nome || d.name || '', slug: d.slug || '', description: d.descricao || d.description || '', imageUrl: d.image_url || d.url_imagem || '' })));
    }
  };

  const addBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.imageUrl || !newBook.buyUrl || !newBook.categoryId) {
      showNotification("Preencha os campos obrigatórios: Título, Autor, Categoria, URL da Capa e Link de Compra.", 'error');
      return;
    }
    try {
      const slug = newBook.slug || generateSlug(newBook.title);
      const supabasePayload: any = {
        title: newBook.title,
        author: newBook.author,
        synopsis: newBook.synopsis,
        target_audience: newBook.targetAudience,
        main_themes: newBook.themes,
        cover_url: newBook.imageUrl,
        cover_alt: newBook.imageAlt || '',
        seo_keywords: newBook.metaKeywords,
        amazon_url: newBook.buyUrl,
        category: newBook.categoryId, // UUID mapeado para field text ou foreign key
        slug: slug, // Fundamental para rotas
        publisher: newBook.publisher || '',
        year: newBook.year || null,
        pages: newBook.pages || null,
        is_featured: newBook.isFeatured === true,
        is_offer: newBook.isOffer === true
      };

      if (editingBookId) {
        supabasePayload.id = editingBookId; // Supabase UPSERT require a Primary Key match usually se onConflict for id for provisioned tables
      }

      const { error } = await supabase.from('books').upsert(supabasePayload);
      if (error) throw error;

      setEditingBookId(null);
      showNotification("Livro salvo com sucesso usando Upsert no Supabase!");

      await fetchSupabaseBooks(); // Atualizar tabela na UI

      setNewBook({
        title: "",
        author: "",
        category: "",
        categoryId: "",
        imageUrl: "",
        imageAlt: "",
        videoUrl: "",
        buyUrl: "",
        publisher: "",
        year: "",
        pages: "",
        synopsis: "",
        targetAudience: "",
        themes: "",
        badge: "",
        metaKeywords: "",
        slug: "",
        isFeatured: false,
        isOffer: false
      });
    } catch (e: any) {
      console.error("Erro no Supabase:", e);
      showNotification(`Falha ao salvar o Livro: ${e.message || e.code || 'Erro no Supabase'}`, 'error');
    }
  };

  const startEditBook = (book: any) => {
    setEditingBookId(book.id);

    // Fallback for categoryId if missing but category name exists
    let categoryId = book.categoryId || "";
    if (!categoryId && book.category) {
      const foundCat = categories.find(c => c.name === book.category);
      if (foundCat) categoryId = foundCat.id;
    }

    setNewBook({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      categoryId: categoryId,
      imageUrl: book.imageUrl || "",
      imageAlt: book.imageAlt || "",
      videoUrl: book.videoUrl || "",
      buyUrl: book.buyUrl || "",
      publisher: book.publisher || "",
      year: book.year || "",
      pages: book.pages || "",
      synopsis: book.synopsis || "",
      targetAudience: book.targetAudience || "",
      themes: book.themes || "",
      badge: book.badge || "",
      metaKeywords: book.metaKeywords || "",
      slug: book.slug || "",
      isFeatured: false,
      isOffer: false
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setNewBook({
      title: "",
      author: "",
      category: "",
      categoryId: "",
      imageUrl: "",
      imageAlt: "",
      videoUrl: "",
      buyUrl: "",
      publisher: "",
      year: "",
      pages: "",
      synopsis: "",
      targetAudience: "",
      themes: "",
      badge: "",
      metaKeywords: "",
      slug: "",
      isFeatured: false,
      isOffer: false
    });
  };

  const deleteBook = async (id: string) => {
    askConfirm("Excluir livro do Supabase?", async () => {
      try {
        const matchCol = "id";
        const { error } = await supabase.from('livros').delete().eq(matchCol, id);
        if (error) throw error;

        setBooks(prev => prev.filter(b => String(b.id) !== String(id)));
        showNotification("Livro excluído definitivamente!");
      } catch (e: any) {
        console.error("Erro na exclusão baseada no Supabase:", e);
        showNotification("Desculpe, falha ao deletar.", 'error');
      }
    });
  };

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.description || !newProduct.buyUrl || !newProduct.images) {
      showNotification("Por favor, preencha os campos obrigatórios: Título, Descrição, Link de Venda e pelo menos uma Imagem.", 'error');
      return;
    }

    try {
      const productPayload = {
        title: newProduct.title,
        description: newProduct.description,
        characteristics: newProduct.characteristics.split('\n').filter(c => c.trim()),
        buy_url: newProduct.buyUrl,
        images: newProduct.images.split('\n').filter(i => i.trim()),
        image_alt: newProduct.imageAlt,
        video_url: newProduct.videoUrl,
        video_keywords: newProduct.videoKeywords,
        meta_keywords: newProduct.metaKeywords,
        badge: newProduct.badge,
        is_featured: newProduct.isFeatured === true,
        is_offer: newProduct.isOffer === true
      };

      if (editingProductId) {
        await supabase.from('products').update({ ...productPayload, updated_at: new Date().toISOString() }).eq("id", editingProductId);
        setEditingProductId(null);
        showNotification("Produto atualizado!");
      } else {
        await supabase.from('products').insert({ ...productPayload, created_at: new Date().toISOString() });
        showNotification("Produto adicionado!");
      }
      setNewProduct({
        title: "",
        description: "",
        characteristics: "",
        buyUrl: "",
        images: "",
        imageAlt: "",
        videoUrl: "",
        videoKeywords: "",
        metaKeywords: "",
        badge: "",
        isFeatured: false,
        isOffer: false
      });
    } catch (e: any) {
      showNotification(`Erro ao salvar produto: ${e.message || e.code || 'Desconhecido'}`, 'error');
    }
  };

  const startEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setNewProduct({
      title: product.title || "",
      description: product.description || "",
      characteristics: product.characteristics || "",
      buyUrl: product.buyUrl || "",
      images: product.images || "",
      imageAlt: product.imageAlt || "",
      videoUrl: product.videoUrl || "",
      videoKeywords: product.videoKeywords || "",
      metaKeywords: product.metaKeywords || "",
      badge: product.badge || "",
      isFeatured: product.is_featured || product.isFeatured || false,
      isOffer: product.is_offer || product.isOffer || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setNewProduct({
      title: "",
      description: "",
      characteristics: "",
      buyUrl: "",
      images: "",
      imageAlt: "",
      videoUrl: "",
      videoKeywords: "",
      metaKeywords: "",
      badge: "",
      isFeatured: false,
      isOffer: false
    });
  };

  const deleteProduct = async (id: string) => {
    askConfirm("Excluir produto?", async () => {
      try {
        await supabase.from("products").delete().eq("id", id);
        showNotification("Produto excluído!");
      } catch (e: any) {
        showNotification(`Erro ao excluir produto: ${e.message || e.code || 'Desconhecido'}`, 'error');
      }
    });
  };

  const deleteSub = async (id: string) => {
    askConfirm("Remover inscrito?", async () => {
      try {
        await supabase.from("subscriptions").delete().eq("id", id);
        showNotification("Inscrito removido!");
      } catch (e) {
        showNotification("Erro ao remover inscrito.", 'error');
      }
    });
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;

  if (!user || !isAdminUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="glass p-6 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] text-center max-w-md w-full border-white/5">
          <LayoutDashboard className="w-16 h-16 text-[#8B5E3C] mx-auto mb-6" />
          <h1 className="text-3xl font-serif mb-4">Painel Administrativo</h1>
          <p className="text-white/50 mb-10 text-sm">Acesso restrito para administradores da Biblioteca Reformada.</p>

          <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
            <button
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 text-[10px] uppercase tracking-widest rounded-xl transition-all ${!isRegistering ? 'bg-[#8B5E3C] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-[10px] uppercase tracking-widest rounded-xl transition-all ${isRegistering ? 'bg-[#8B5E3C] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#8B5E3C] outline-none transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#8B5E3C] outline-none transition-colors"
                required
                minLength={6}
              />
            </div>

            <p className="text-[10px] text-white/40 text-left px-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              {isRegistering
                ? "💡 DICA: Use esta aba para criar sua senha. Mesmo que seu e-mail já tenha sido autorizado pelo administrador, você precisa cadastrar uma senha aqui no primeiro acesso."
                : "💡 DICA: Se você foi autorizado pelo administrador mas nunca criou uma senha, clique na aba 'CADASTRAR' acima para ativar sua conta."
              }
            </p>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-[#8B5E3C] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#D4C3A3] transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRegistering ? "Criar Minha Conta" : "Acessar Painel")}
            </button>

            {!isRegistering && (
              <button
                type="button"
                onClick={resetPassword}
                className="block w-full text-[10px] text-white/20 uppercase tracking-widest hover:text-white transition-colors mt-4"
              >
                Esqueci minha senha
              </button>
            )}
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-[#050505] px-4 text-white/20">Ou</span></div>
          </div>

          <button
            onClick={login}
            disabled={authLoading}
            className="w-full py-4 glass text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
          >
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserIcon className="w-4 h-4" /> Entrar com Google</>}
          </button>

          {window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app') && (
            <p className="text-[10px] text-white/20 mt-10 max-w-xs mx-auto leading-relaxed">
              Nota: Se o login do Google não abrir, certifique-se de adicionar o domínio <span className="text-[#D4C3A3]">{window.location.hostname}</span> na lista de "Domínios Autorizados" no Supabase.
            </p>
          )}
          {user && !isAdminUser && (
            <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-left">
              <div className="flex items-center gap-3 mb-3 text-red-400">
                <Lock className="w-5 h-5" />
                <p className="font-bold text-sm uppercase tracking-widest">Acesso Negado</p>
              </div>
              <p className="text-white/60 text-xs leading-relaxed mb-4">
                O e-mail <span className="text-white font-medium">{user.email}</span> está autenticado, mas não possui permissões de administrador.
              </p>
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">O que fazer?</p>
                <ul className="text-[10px] text-white/40 space-y-1 list-disc pl-4">
                  <li>Verifique se este é o e-mail correto que foi autorizado.</li>
                  <li>Peça ao administrador principal para verificar seu nível de acesso.</li>
                  <li>Tente sair e entrar com outra conta.</li>
                </ul>
              </div>
              <button
                onClick={logout}
                className="mt-6 w-full py-3 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          )}

          <div className="mt-12 p-6 bg-white/5 rounded-[2rem] text-left border border-white/5">
            <div className="flex items-center gap-3 mb-3 text-[#8B5E3C]">
              <UserIcon className="w-4 h-4" />
              <p className="font-bold text-[10px] uppercase tracking-widest">Dica Importante</p>
            </div>
            <p className="text-white/40 text-[10px] leading-relaxed">
              O cadastro de usuários no painel apenas **autoriza** o e-mail. Para acessar, o dono do e-mail deve criar sua própria senha na aba <span className="text-white">"Cadastrar"</span> acima ou usar o <span className="text-white">Google</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#050505] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8B5E3C] rounded flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-serif font-bold text-sm">ADMIN</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 border-r border-white/5 p-8 flex flex-col bg-[#050505]
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="hidden lg:flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-[#8B5E3C] rounded flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-serif font-bold">ADMIN PANEL</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => {
              setActiveTab('settings');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <Settings className="w-5 h-5" /> Configurações
          </button>
          <button
            onClick={() => {
              setActiveTab('posts');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'posts' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <FileText className="w-5 h-5" /> Postagens
          </button>
          <button
            onClick={() => {
              setActiveTab('books');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'books' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <BookOpen className="w-5 h-5" /> Livros
          </button>
          <button
            onClick={() => {
              setActiveTab('categories');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <Tag className="w-5 h-5" /> Categorias
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <Package className="w-5 h-5" /> Produtos
          </button>
          <button
            onClick={() => {
              setActiveTab('subs');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'subs' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
          >
            <Mail className="w-5 h-5" /> Inscritos
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveTab('users');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-[#8B5E3C] text-white' : 'hover:bg-white/5 text-white/50'}`}
            >
              <Users className="w-5 h-5" /> Usuários
            </button>
          )}
        </nav>

        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-white/30 hover:text-white transition-colors mt-auto">
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pt-8 lg:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-4xl font-serif">
            {activeTab === 'settings' && "Configurações do Site"}
            {activeTab === 'posts' && "Gerenciar Postagens"}
            {activeTab === 'books' && "Gerenciar Livros"}
            {activeTab === 'categories' && "Gerenciar Categorias"}
            {activeTab === 'products' && "Gerenciar Produtos"}
            {activeTab === 'subs' && "Inscritos na Newsletter"}
            {activeTab === 'users' && isSuperAdmin && "Gerenciar Usuários"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/40">{user.email}</span>
            <img src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (user?.email || "Admin")} className="w-10 h-10 rounded-full border border-white/10" alt="Avatar" referrerPolicy="no-referrer" />
          </div>
        </header>

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-8">
            <div className="glass p-4 lg:p-8 rounded-3xl space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Logo do Site</label>
                <p className="text-[10px] text-white/20 mb-3">Formato ideal: PNG transparente ou SVG</p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {siteSettings.logoUrl && (
                    <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={siteSettings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <input
                    value={siteSettings.logoUrl}
                    onChange={e => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                    placeholder="https://seudominio.com/imagens/logo.png"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                  />
                  <label className="cursor-pointer px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest relative overflow-hidden">
                    {uploadProgress['logo-image'] !== undefined ? (
                      <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                        <span className="text-[10px]">{uploadProgress['logo-image']}%</span>
                      </div>
                    ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {isUploading ? "..." : "Upload"}
                    <input type="file" accept="image/*" onChange={(e) => handleBrandingUpload(e, 'logo')} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Slogan do Site (abaixo do logo)</label>
                <input
                  value={siteSettings.slogan}
                  onChange={e => setSiteSettings({ ...siteSettings, slogan: e.target.value })}
                  placeholder="Ex: Tradição Reformada & Sabedoria Cristã"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Título Principal</label>
                <input
                  value={siteSettings.heroTitle}
                  onChange={e => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                  placeholder="Ex: Móveis que transformam seu ambiente"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Subtítulo Principal</label>
                <textarea
                  value={siteSettings.heroSubtitle}
                  onChange={e => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                  placeholder="Ex: Estantes e móveis em madeira premium para ambientes modernos"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40">URL Imagem Principal</label>
                  <span className="text-[9px] text-[#8B5E3C] font-bold uppercase tracking-wider">Dimensão ideal: 1920x1080px (16:9)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {siteSettings.heroImage && (
                    <div className="w-full sm:w-20 h-32 sm:h-12 rounded-lg border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={siteSettings.heroImage} alt="Hero Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <input
                    value={siteSettings.heroImage}
                    onChange={e => setSiteSettings({ ...siteSettings, heroImage: e.target.value })}
                    placeholder="https://seudominio.com/imagens/hero-home.jpg"
                    className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                  />
                  <label className="w-full sm:w-auto cursor-pointer px-6 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest relative overflow-hidden">
                    {uploadProgress['hero-image'] !== undefined ? (
                      <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                        <span className="text-[10px]">{uploadProgress['hero-image']}%</span>
                      </div>
                    ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {isUploading ? "..." : "Upload"}
                    <input type="file" accept="image/*,.webp" onChange={(e) => handleBrandingUpload(e, 'hero')} className="hidden" disabled={isUploading} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Itens do Marquee (separados por vírgula)</label>
                <p className="text-[10px] text-white/20 mb-3">Ex: Frete Grátis, Qualidade Premium, Design Exclusivo</p>
                <input
                  value={siteSettings.marqueeItems}
                  onChange={e => setSiteSettings({ ...siteSettings, marqueeItems: e.target.value })}
                  placeholder="Frete para todo o Brasil, Design premium, Madeira natural, Garantia de fábrica"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Número WhatsApp (apenas números)</label>
                <input
                  value={siteSettings.whatsappNumber}
                  onChange={e => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                />
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">SEO & Meta Tags</h4>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Meta Title (Título SEO)</label>
                  <input
                    value={siteSettings.metaTitle}
                    onChange={e => setSiteSettings({ ...siteSettings, metaTitle: e.target.value })}
                    placeholder="Título que aparece no Google"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Meta Description (Descrição SEO)</label>
                  <textarea
                    value={siteSettings.metaDescription}
                    onChange={e => setSiteSettings({ ...siteSettings, metaDescription: e.target.value })}
                    placeholder="Breve descrição para os resultados de busca"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Palavras-chave (separadas por vírgula)</label>
                  <input
                    value={siteSettings.metaKeywords}
                    onChange={e => setSiteSettings({ ...siteSettings, metaKeywords: e.target.value })}
                    placeholder="Ex: móveis, madeira, decoração, artesanal"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-[#8B5E3C] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-12">
            <div className="glass p-8 rounded-3xl">
              <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                {editingPostId ? <Pencil className="text-[#8B5E3C]" /> : <Plus className="text-[#8B5E3C]" />}
                {editingPostId ? "Editar Postagem" : "Nova Postagem"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input placeholder="Título" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <input placeholder="Categoria" value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-end mb-1 ml-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Imagem e Vídeo</label>
                    <span className="text-[9px] text-[#8B5E3C] font-bold uppercase tracking-wider">Ideal: 1200x675px (16:9)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {newPost.imageUrl && (
                        <div className="w-full sm:w-20 h-32 sm:h-12 rounded border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                          <img src={newPost.imageUrl} alt="Post Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <input placeholder="URL da Imagem" value={newPost.imageUrl} onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })} className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                        {uploadProgress['post-image'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[9px]">{uploadProgress['post-image']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        <input type="file" accept="image/*,.webp" onChange={(e) => handleFileUpload(e, 'post', 'image')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Link do YouTube (Ex: https://www.youtube.com/watch?v=...)"
                        value={newPost.videoUrl}
                        onChange={e => {
                          const url = e.target.value.trim();
                          const thumbnail = getYouTubeThumbnail(url);
                          if (thumbnail) {
                            setNewPost({
                              ...newPost,
                              videoUrl: url,
                              imageUrl: (!newPost.imageUrl || newPost.imageUrl.includes('img.youtube.com')) ? thumbnail : newPost.imageUrl
                            });
                          } else {
                            setNewPost({ ...newPost, videoUrl: url });
                          }
                        }}
                        className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                      />
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                        {uploadProgress['post-video'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[9px]">{uploadProgress['post-video']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                        <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'post', 'video')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
                <textarea placeholder="Resumo/Excerto (Aparece na listagem)" value={newPost.excerpt} onChange={e => setNewPost({ ...newPost, excerpt: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none col-span-1 md:col-span-2" rows={2} />
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 ml-1">Conteúdo do Artigo</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden min-h-[400px]">
                    <ReactQuill
                      theme="snow"
                      value={newPost.content}
                      onChange={(content) => setNewPost({ ...newPost, content })}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          [{ 'script': 'sub' }, { 'script': 'super' }],
                          [{ 'indent': '-1' }, { 'indent': '+1' }],
                          [{ 'direction': 'rtl' }],
                          [{ 'align': [] }],
                          ['link', 'image', 'video', 'blockquote', 'code-block'],
                          ['clean']
                        ],
                        clipboard: {
                          matchVisual: false,
                          matchers: [
                            ['BR', (node: any, delta: any) => {
                              // Convert single BR to newline, double BR to new paragraph
                              return delta;
                            }]
                          ]
                        }
                      }}
                      className="h-[350px] text-white"
                    />
                  </div>
                  <style>{`
                    .ql-container {
                      font-family: inherit;
                      font-size: 16px;
                      border: none !important;
                    }
                    .ql-toolbar {
                      background: rgba(255,255,255,0.05);
                      border: none !important;
                      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                    }
                    .ql-editor {
                      min-height: 350px;
                      color: white;
                    }
                    .ql-snow .ql-picker-options {
                      background-color: #1a1a1a !important;
                      border: 1px solid rgba(255,255,255,0.1) !important;
                    }
                    .ql-snow .ql-stroke {
                      stroke: rgba(255,255,255,0.6);
                    }
                    .ql-snow .ql-fill {
                      fill: rgba(255,255,255,0.6);
                    }
                    .ql-snow .ql-picker {
                      color: rgba(255,255,255,0.6);
                    }
                    .ql-snow.ql-toolbar button:hover .ql-stroke,
                    .ql-snow.ql-toolbar button:focus .ql-stroke {
                      stroke: #8B5E3C;
                    }
                    .ql-snow.ql-toolbar button.ql-active .ql-stroke {
                      stroke: #8B5E3C;
                    }
                    .ql-snow.ql-toolbar .ql-picker-label:hover,
                    .ql-snow.ql-toolbar .ql-picker-label.ql-active {
                      color: #8B5E3C;
                    }
                    .ql-snow.ql-toolbar .ql-picker-item:hover,
                    .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
                      color: #8B5E3C;
                    }
                  `}</style>
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Texto Alternativo da Imagem (SEO)" value={newPost.imageAlt} onChange={e => setNewPost({ ...newPost, imageAlt: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm" />
                  <input placeholder="Palavras-chave do Vídeo" value={newPost.videoKeywords} onChange={e => setNewPost({ ...newPost, videoKeywords: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm" />
                </div>
                <input placeholder="Palavras-chave do Artigo (Meta Keywords)" value={newPost.metaKeywords} onChange={e => setNewPost({ ...newPost, metaKeywords: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none col-span-1 md:col-span-2 text-sm" />
              </div>
              <div className="flex gap-4">
                <button onClick={addPost} className="px-8 py-3 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors">
                  {editingPostId ? "Atualizar Artigo" : "Publicar Artigo"}
                </button>
                {editingPostId && (
                  <button onClick={() => {
                    setEditingPostId(null);
                    setNewPost({
                      title: "",
                      category: "",
                      excerpt: "",
                      content: "",
                      imageUrl: "",
                      imageAlt: "",
                      videoUrl: "",
                      videoKeywords: "",
                      metaKeywords: ""
                    });
                  }} className="px-8 py-3 glass rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">Nenhum artigo encontrado.</div>
              ) : posts.map(post => (
                <div key={post.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
                  <div className="relative flex-shrink-0">
                    <img src={post.imageUrl || undefined} className="w-24 h-24 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                    {post.imageUrl?.startsWith('data:image') && (
                      <div className="absolute -top-2 -right-2 bg-[#8B5E3C] text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-[#050505] flex items-center gap-1">
                        <Check className="w-2 h-2" /> PRO
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-lg">{post.title}</h4>
                    <div className="flex items-center gap-3">
                      <p className="text-white/40 text-sm">{post.category}</p>
                      {post.videoUrl && (
                        <span className="flex items-center gap-1 text-[10px] bg-[#8B5E3C]/20 text-[#8B5E3C] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                          <Video className="w-3 h-3" /> Vídeo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEditPost(post)} className="p-3 text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-full transition-colors">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => deletePost(post.id)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-12">
            <div className={`glass p-8 rounded-3xl transition-all ${editingBookId ? 'border-[#8B5E3C] ring-1 ring-[#8B5E3C]/50' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif flex items-center gap-2">
                  {editingBookId ? <Pencil className="text-[#8B5E3C]" /> : <Plus className="text-[#8B5E3C]" />}
                  {editingBookId ? "Editar Livro" : "Novo Livro"}
                </h3>
                {editingBookId && (
                  <button onClick={cancelEditBook} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancelar Edição
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Título</label>
                  <input placeholder="Título" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Autor</label>
                  <input placeholder="Autor" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={newBook.categoryId}
                      onChange={e => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setNewBook({
                          ...newBook,
                          categoryId: e.target.value,
                          category: cat ? cat.name : ""
                        });
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] appearance-none"
                    >
                      <option value="" className="bg-[#050505]">Selecionar Categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#050505]">{cat.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className="p-3 glass rounded-xl hover:bg-white/10 transition-colors"
                      title="Gerenciar Categorias"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Slug (URL Amigável)</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="ex: teologia-sistematica-grudem"
                      value={newBook.slug}
                      onChange={e => setNewBook({ ...newBook, slug: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]"
                    />
                    <button
                      onClick={() => setNewBook({ ...newBook, slug: generateSlug(newBook.title) })}
                      className="px-3 glass rounded-xl hover:bg-white/10 transition-colors text-[10px] font-bold"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Editora</label>
                  <input placeholder="Editora" value={newBook.publisher} onChange={e => setNewBook({ ...newBook, publisher: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Ano</label>
                  <input placeholder="Ano" value={newBook.year} onChange={e => setNewBook({ ...newBook, year: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Páginas</label>
                  <input placeholder="Páginas" value={newBook.pages} onChange={e => setNewBook({ ...newBook, pages: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Selo (Opcional)</label>
                  <select
                    value={newBook.badge}
                    onChange={e => setNewBook({ ...newBook, badge: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] appearance-none"
                  >
                    <option value="" className="bg-[#050505]">Nenhum Selo</option>
                    <option value="Clássico Reformado" className="bg-[#050505]">Clássico Reformado</option>
                    <option value="Leitura Essencial" className="bg-[#050505]">Leitura Essencial</option>
                    <option value="Puritano" className="bg-[#050505]">Puritano</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-end mb-1 ml-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">Capa e Trailer</label>
                    <span className="text-[9px] text-[#8B5E3C] font-bold uppercase tracking-wider">Ideal: 900x1200px (3:4)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {newBook.imageUrl && (
                        <div className="w-full sm:w-10 h-32 sm:h-12 rounded border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                          <img src={newBook.imageUrl} alt="Book Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <input placeholder="URL da Capa" value={newBook.imageUrl} onChange={e => setNewBook({ ...newBook, imageUrl: e.target.value })} className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                        {uploadProgress['book-image'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[9px]">{uploadProgress['book-image']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        <input type="file" accept="image/*,.webp" onChange={(e) => handleFileUpload(e, 'book', 'image')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Link do YouTube (Ex: https://www.youtube.com/watch?v=...)"
                        value={newBook.videoUrl}
                        onChange={e => {
                          const url = e.target.value.trim();
                          const thumbnail = getYouTubeThumbnail(url);
                          if (thumbnail) {
                            setNewBook({
                              ...newBook,
                              videoUrl: url,
                              imageUrl: (!newBook.imageUrl || newBook.imageUrl.includes('img.youtube.com')) ? thumbnail : newBook.imageUrl
                            });
                          } else {
                            setNewBook({ ...newBook, videoUrl: url });
                          }
                        }}
                        className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                      />
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                        {uploadProgress['book-video'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[9px]">{uploadProgress['book-video']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                        <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'book', 'video')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Link de Compra</label>
                  <input placeholder="Link de Compra" value={newBook.buyUrl} onChange={e => setNewBook({ ...newBook, buyUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Sinopse</label>
                  <textarea placeholder="Sinopse (3 a 5 linhas)" value={newBook.synopsis} onChange={e => setNewBook({ ...newBook, synopsis: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" rows={4} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Para quem é indicado</label>
                  <input placeholder="Indicação de leitura" value={newBook.targetAudience} onChange={e => setNewBook({ ...newBook, targetAudience: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Principais Temas</label>
                  <input placeholder="Temas abordados" value={newBook.themes} onChange={e => setNewBook({ ...newBook, themes: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Texto Alt da Capa (SEO)</label>
                    <input placeholder="Descrição da imagem" value={newBook.imageAlt} onChange={e => setNewBook({ ...newBook, imageAlt: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Palavras-chave (SEO)</label>
                    <input placeholder="Ex: teologia, puritanos, fé" value={newBook.metaKeywords} onChange={e => setNewBook({ ...newBook, metaKeywords: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={addBook} className="px-8 py-3 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors">
                {editingBookId ? "Salvar Alterações" : "Adicionar Livro"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {books.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">Nenhum livro encontrado.</div>
              ) : books.map(book => (
                <div key={book.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-center group">
                  <div className="relative flex-shrink-0">
                    <img src={book.imageUrl || undefined} className="w-20 h-28 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
                    {book.imageUrl?.startsWith('data:image') && (
                      <div className="absolute -top-2 -right-2 bg-[#8B5E3C] text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-[#050505] flex items-center gap-1">
                        <Check className="w-2 h-2" /> PRO
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-lg">{book.title}</h4>
                    <div className="flex items-center gap-3">
                      <p className="text-white/40 text-sm">{book.author} • {book.category}</p>
                      {book.videoUrl && (
                        <span className="flex items-center gap-1 text-[10px] bg-[#8B5E3C]/20 text-[#8B5E3C] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                          <Video className="w-3 h-3" /> Vídeo
                        </span>
                      )}
                    </div>
                    <a href={book.buyUrl} target="_blank" rel="noopener noreferrer" className="text-[#8B5E3C] text-xs flex items-center gap-1 mt-2 hover:underline">
                      Link de Compra <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => showNotification(`Categoria: ${book.category || 'Sem categoria'}`, 'info')}
                      className="p-3 text-white/40 hover:text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-full transition-colors"
                      title="Ver Categoria"
                    >
                      <Tag className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => startEditBook(book)}
                      className="p-3 text-white/40 hover:text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-full transition-colors"
                      title="Editar Livro"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="p-3 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                      title="Excluir Livro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-12">
            <div className={`glass p-8 rounded-3xl transition-all ${editingCategoryId ? 'border-[#8B5E3C] ring-1 ring-[#8B5E3C]/50' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif flex items-center gap-2">
                  {editingCategoryId ? <Pencil className="text-[#8B5E3C]" /> : <Plus className="text-[#8B5E3C]" />}
                  {editingCategoryId ? "Editar Categoria" : "Nova Categoria"}
                </h3>
                {editingCategoryId && (
                  <button onClick={cancelEditCategory} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancelar Edição
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Nome da Categoria</label>
                  <input
                    placeholder="Ex: Teologia Sistemática"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Slug (URL Amigável)</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="ex: teologia-sistematica"
                      value={newCategory.slug}
                      onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]"
                    />
                    <button
                      onClick={() => setNewCategory({ ...newCategory, slug: generateSlug(newCategory.name) })}
                      className="px-3 glass rounded-xl hover:bg-white/10 transition-colors text-[10px] font-bold"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Descrição (Opcional)</label>
                  <textarea
                    placeholder="Breve descrição da categoria"
                    value={newCategory.description}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-end mb-1 ml-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">Capa da Categoria (Opcional)</label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {newCategory.imageUrl && (
                      <div className="w-full sm:w-10 h-32 sm:h-12 rounded border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                        <img src={newCategory.imageUrl} alt="Category Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <input
                      placeholder="URL da Imagem da Categoria"
                      value={newCategory.imageUrl}
                      onChange={e => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                      className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                    />
                    <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                      {uploadProgress['category-image'] !== undefined ? (
                        <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                          <span className="text-[9px]">{uploadProgress['category-image']}%</span>
                        </div>
                      ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <input type="file" accept="image/*,.webp" onChange={(e) => handleFileUpload(e, 'category', 'image')} className="hidden" disabled={isUploading} />
                    </label>
                  </div>
                </div>
              </div>
              <button onClick={addCategory} className="px-8 py-3 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors">
                {editingCategoryId ? "Salvar Alterações" : "Adicionar Categoria"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">Nenhuma categoria encontrada.</div>
              ) : categories.map(cat => (
                <div key={cat.id} className="glass p-6 rounded-2xl flex flex-col gap-4 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif text-lg">{cat.name}</h4>
                      <p className="text-white/40 text-xs font-mono">/{cat.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="p-2 text-white/40 hover:text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-full transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {cat.description && <p className="text-white/60 text-sm line-clamp-2">{cat.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-12">
            <div className={`glass p-8 rounded-3xl transition-all ${editingProductId ? 'border-[#8B5E3C] ring-1 ring-[#8B5E3C]/50' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif flex items-center gap-2">
                  {editingProductId ? <Pencil className="text-[#8B5E3C]" /> : <Plus className="text-[#8B5E3C]" />}
                  {editingProductId ? "Editar Produto" : "Novo Produto"}
                </h3>
                {editingProductId && (
                  <button onClick={cancelEditProduct} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancelar Edição
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Título do Produto</label>
                  <input placeholder="Ex: Estante Giratória Artesanal" value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Descrição</label>
                  <textarea placeholder="Descrição detalhada do produto" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" rows={4} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Características (uma por linha)</label>
                  <textarea placeholder="Ex: Madeira Maciça&#10;Rolamento Silencioso&#10;Acabamento Premium" value={newProduct.characteristics} onChange={e => setNewProduct({ ...newProduct, characteristics: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" rows={4} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-end mb-1 ml-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">Imagens e Vídeo do Produto</label>
                    <span className="text-[9px] text-[#8B5E3C] font-bold uppercase tracking-wider">Ideal: 1000x1000px (1:1)</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      {newProduct.images && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {newProduct.images.split('\n').filter(i => i.trim()).map((img, idx) => (
                            <div key={idx} className="w-16 h-16 rounded-lg border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 relative group">
                              <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                onClick={() => {
                                  const imgs = newProduct.images.split('\n').filter(i => i.trim());
                                  imgs.splice(idx, 1);
                                  setNewProduct({ ...newProduct, images: imgs.join('\n') });
                                }}
                                className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <textarea placeholder="URLs das Imagens (uma por linha)" value={newProduct.images} onChange={e => setNewProduct({ ...newProduct, images: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" rows={3} />
                      <label className="cursor-pointer w-full py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/20 relative overflow-hidden">
                        {uploadProgress['product-image'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[10px]">{uploadProgress['product-image']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {isUploading ? "Enviando..." : "Adicionar Foto (Upload)"}
                        <input type="file" accept="image/*,.webp" onChange={(e) => handleFileUpload(e, 'product', 'image')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Link do YouTube (Ex: https://www.youtube.com/watch?v=...)"
                        value={newProduct.videoUrl}
                        onChange={e => {
                          const url = e.target.value.trim();
                          const thumbnail = getYouTubeThumbnail(url);
                          if (thumbnail) {
                            // For products, images is a string with URLs separated by \n
                            const currentImages = newProduct.images.split('\n').filter(i => i.trim());
                            const hasYouTubeThumbnail = currentImages.some(img => img.includes('img.youtube.com'));

                            if (currentImages.length === 0 || hasYouTubeThumbnail) {
                              setNewProduct({
                                ...newProduct,
                                videoUrl: url,
                                images: thumbnail
                              });
                            } else {
                              setNewProduct({ ...newProduct, videoUrl: url });
                            }
                          } else {
                            setNewProduct({ ...newProduct, videoUrl: url });
                          }
                        }}
                        className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm"
                      />
                      <label className="w-full sm:w-auto cursor-pointer px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden">
                        {uploadProgress['product-video'] !== undefined ? (
                          <div className="absolute inset-0 bg-[#8B5E3C]/20 flex items-center justify-center">
                            <span className="text-[9px]">{uploadProgress['product-video']}%</span>
                          </div>
                        ) : isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                        <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'product', 'video')} className="hidden" disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Link de Venda / Encomenda</label>
                  <input placeholder="URL do WhatsApp ou Loja" value={newProduct.buyUrl} onChange={e => setNewProduct({ ...newProduct, buyUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Selo / Badge (Ex: 100% Madeira)</label>
                  <input placeholder="Ex: 100% Madeira Maciça" value={newProduct.badge} onChange={e => setNewProduct({ ...newProduct, badge: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C]" />
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Texto Alt Imagens (SEO)</label>
                    <input placeholder="Descrição das fotos" value={newProduct.imageAlt} onChange={e => setNewProduct({ ...newProduct, imageAlt: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Palavras-chave Vídeo</label>
                    <input placeholder="Tags do vídeo" value={newProduct.videoKeywords} onChange={e => setNewProduct({ ...newProduct, videoKeywords: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 ml-1">Palavras-chave Produto</label>
                    <input placeholder="Tags do produto" value={newProduct.metaKeywords} onChange={e => setNewProduct({ ...newProduct, metaKeywords: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#8B5E3C] text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={addProduct} className="px-8 py-3 bg-[#8B5E3C] rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors">
                {editingProductId ? "Salvar Alterações" : "Adicionar Produto"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">Nenhum produto encontrado.</div>
              ) : products.map(product => (
                <div key={product.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-center group">
                  <div className="relative flex-shrink-0">
                    <img src={product.images?.[0] || undefined} className="w-24 h-24 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                    {product.images?.[0]?.startsWith('data:image') && (
                      <div className="absolute -top-2 -right-2 bg-[#8B5E3C] text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-[#050505] flex items-center gap-1">
                        <Check className="w-2 h-2" /> PRO
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-serif text-lg">{product.title}</h4>
                    <p className="text-white/40 text-sm line-clamp-1">{product.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] bg-white/5 px-2 py-1 rounded uppercase tracking-widest text-white/40">
                        {product.images?.length || 0} imagens
                      </span>
                      {product.videoUrl && (
                        <span className="flex items-center gap-1 text-[9px] bg-[#8B5E3C]/20 text-[#8B5E3C] px-2 py-1 rounded uppercase tracking-widest font-bold">
                          <Video className="w-2.5 h-2.5" /> Vídeo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startEditProduct(product)}
                      className="p-3 text-white/40 hover:text-[#8B5E3C] hover:bg-[#8B5E3C]/10 rounded-full transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-3 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subs' && (
          <div className="space-y-8">
            <div className="glass p-4 lg:p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h3 className="text-xl font-serif">Lista de E-mails ({subscriptions.length})</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleGoogleExport}
                    disabled={exporting || subscriptions.length === 0}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8B5E3C] hover:underline disabled:opacity-50"
                  >
                    {exporting ? "Exportando..." : "Exportar para Google Sheets"}
                  </button>
                  <button
                    onClick={() => {
                      const csv = subscriptions.map(s => s.email).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'inscritos.csv';
                      a.click();
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:underline"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>

              {sheetUrl && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-green-400">Planilha criada com sucesso!</span>
                  <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-green-400 hover:underline flex items-center gap-1">
                    Abrir Planilha <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div className="space-y-4">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="font-medium">{sub.email}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">
                        Inscrito em: {sub.subscribedAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button onClick={() => deleteSub(sub.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {subscriptions.length === 0 && (
                  <p className="text-center py-12 text-white/20 italic">Nenhum inscrito ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <div className="space-y-12">
            <div className="glass p-8 rounded-3xl">
              <h3 className="text-xl font-serif mb-6">{editingUserId ? "Editar Usuário" : "Cadastrar Novo Usuário"}</h3>

              {!editingUserId && (
                <div className="mb-8 p-4 bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 rounded-2xl flex gap-4 items-start">
                  <UserIcon className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
                  <div className="text-xs text-white/60 leading-relaxed">
                    <p className="font-bold text-white/80 mb-1">Como funciona o cadastro:</p>
                    <p>Ao cadastrar um e-mail aqui, você está **autorizando** esse usuário a acessar o painel com o nível de acesso escolhido.</p>
                    <p className="mt-2">O usuário ainda precisará criar a própria conta (usando o mesmo e-mail) na tela de login, caso ainda não tenha uma.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Nome de Exibição</label>
                  <input
                    type="text"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#8B5E3C] outline-none transition-colors"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">E-mail</label>
                  <input
                    type="email"
                    value={newUser.email}
                    disabled={!!editingUserId}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#8B5E3C] outline-none transition-colors disabled:opacity-50"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Nível de Acesso</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-[#8B5E3C] outline-none transition-colors"
                  >
                    <option value="user" className="bg-[#050505]">Usuário Comum</option>
                    <option value="editor" className="bg-[#050505]">Editor</option>
                    <option value="admin" className="bg-[#050505]">Administrador</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={usersLoading}
                    className="w-full sm:w-auto px-8 py-3 bg-[#8B5E3C] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#D4C3A3] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}</>}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUser({ email: "", password: "", displayName: "", role: "user" });
                      }}
                      className="w-full sm:w-auto px-8 py-3 glass text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif">Lista de Usuários</h3>
              <div className="glass rounded-3xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Usuário</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">E-mail</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Acesso</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                              {u.displayName ? u.displayName[0].toUpperCase() : u.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{u.displayName || "Sem nome"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/60">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            u.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUserId(u.uid);
                                setNewUser({ email: u.email, password: "", displayName: u.displayName || "", role: u.role });
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(u.id || u.uid)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-white/40 hover:text-red-400"
                              title="Excluir"
                              disabled={(u.id || u.uid) === user?.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'info' ? 'bg-blue-500 text-white' :
            'bg-[#8B5E3C] text-white'
          }`}>
          {notification.type === 'error' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="glass p-8 rounded-3xl max-w-sm w-full text-center">
            <h3 className="text-xl font-serif mb-4">{confirmDialog.message}</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 glass rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
