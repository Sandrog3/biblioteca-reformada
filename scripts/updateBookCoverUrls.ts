import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carrega as credenciais seguras do backend
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltam VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
}

// Inicializar cliente do Supabase com Service Role para bypass total de RLS (Row Level Security)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('--- Iniciando Sincronização de capa_url_new ---\n');
    try {
        const mappingPath = path.join(process.cwd(), 'mapping.json');
        
        if (!fs.existsSync(mappingPath)) {
            console.error('❌ Arquivo mapping.json não encontrado na raiz do projeto.');
            return;
        }

        // 1. Ler o arquivo mapping.json
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        const booksMap = mappingData.livros;

        if (!booksMap || Object.keys(booksMap).length === 0) {
            console.log('Nenhum mapeamento de livros encontrado no arquivo mapping.json.');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const failedItems: string[] = [];

        console.log(`📋 Encontrados ${Object.keys(booksMap).length} livros listados no arquivo. Processando...\n`);

        // 2. Para cada item no JSON, buscar via 'capa_url' exato e preencher 'capa_url_new'
        for (const [oldUrl, newUrl] of Object.entries(booksMap)) {
            const { data, error } = await supabase
                .from('livros')
                .update({ capa_url_new: newUrl as string })
                // Busca o registro no banco pelo link velho estrtamente
                .eq('capa_url', oldUrl)
                // Retorna apenas os IDs dos campos fetados para log (sem sobrecarregar a memória)
                .select('id');

            if (error) {
                console.error(`❌ Erro crasso ao atualizar capa (URL: ${oldUrl.substring(0, 40)}...):`, error.message);
                failCount++;
                failedItems.push(oldUrl);
            } else if (!data || data.length === 0) {
                console.log(`⚠️  Ignorado: O banco de dados retornou 0 resultados para a URL (provavelmente deletado/alterado): ${oldUrl.substring(0, 50)}...`);
                failCount++;
                failedItems.push(oldUrl);
            } else {
                console.log(`✅ Sucesso! Livro ID [ ${data[0].id} ] atualizado com a nova URL do Supabase.`);
                successCount++;
            }
        }

        // 5. Relatório e Registros Finais
        console.log('\n======================================');
        console.log('         RESUMO DA MIGRAÇÃO           ');
        console.log('======================================');
        console.log(`🔹 Total mapeado: ${Object.keys(booksMap).length}`);
        console.log(`✅ Atualizados com sucesso: ${successCount}`);
        console.log(`❌ Falhas / Órfãos Ignorados: ${failCount}`);
        
        if (failedItems.length > 0) {
            console.log('\nLivros que não puderam ser gravados (não encontrados na tabela):');
            failedItems.forEach(item => console.log(` - ${item}`));
        }
        
    } catch (error) {
        console.error('\n❌ Erro crítico estourou durante a execução do script: ', error);
    }
}

main();
