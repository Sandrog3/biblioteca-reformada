import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('Chave carregada:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SIM' : 'NÃO');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente!');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  const { error: errPost } = await supabase.from('posts').insert([
    {
      title: 'Bem-vindo à Biblioteca Reformada',
      category: 'Geral',
      excerpt: 'Uma introdução ao nosso projeto de curadoria teológica.',
      content: '<h2>A Paz do Senhor!</h2><p>É com muita alegria que inauguramos este espaço onde a tradição da sã doutrina se encontra com recomendações práticas e resenhas críticas construtivas para a vida do cristão reformado.</p>',
      image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
      image_alt: 'Bíblia e livros reformados',
      created_at: new Date().toISOString()
    }
  ]);
  
  if (errPost) console.error("Erro no post JSON:", JSON.stringify(errPost));

  const { error: errProd } = await supabase.from('products').insert([
    {
      title: 'Kit Teologia Sistemática',
      description: 'As famosas teologias de Bavinck e Berkhof. Fundamental para o estudo.',
      characteristics: ['Capa Dura', 'Edição Revisada', '3 Volumes'],
      buy_url: 'https://amzn.to/exemplo1',
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
      badge: 'Oferta',
      created_at: new Date().toISOString()
    },
    {
      title: 'Bíblia de Estudo de Genebra',
      description: 'A bíblia clássica da reforma com excelentes comentários de RC Sproul.',
      characteristics: ['Couro Legítimo', 'Letra Grande'],
      buy_url: 'https://amzn.to/exemplo2',
      images: ['https://images.unsplash.com/photo-1507738911748-9c7846274f3d?w=600'],
      created_at: new Date().toISOString()
    },
    {
      title: 'Caneca Charles Spurgeon',
      description: 'Caneca de cerâmica 325ml com citação do Príncipe dos Pregadores.',
      characteristics: ['Cerâmica', 'Pode ir ao microondas'],
      buy_url: 'https://amzn.to/exemplo3',
      images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600'],
      badge: 'Novo',
      created_at: new Date().toISOString()
    }
  ]);

  if (errProd) console.error("Erro nos produtos JSON:", JSON.stringify(errProd));
  
  if (!errPost && !errProd) {
    console.log("Seeds plantados com sucesso no Supabase!");
  }
}

seed();
