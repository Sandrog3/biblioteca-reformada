import React, { ErrorInfo, ReactNode } from 'react';

export default class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      
      try {
        if (error?.message) {
          const parsed = JSON.parse(error.message);
          if (parsed.error) {
            if (parsed.error.includes('Missing or insufficient permissions')) {
              errorMessage = `Você não tem permissão para acessar estes dados (${parsed.path}). Verifique se você está logado com a conta correta.`;
            } else {
              errorMessage = `Erro de Banco de Dados: ${parsed.error}`;
            }
          }
        }
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="glass p-8 rounded-3xl max-w-lg">
            <h1 className="text-2xl font-serif mb-4 text-red-400">Ops! Algo deu errado.</h1>
            <p className="text-white/60 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-[#8B5E3C] text-white rounded-full font-bold uppercase tracking-widest hover:bg-[#D4C3A3] transition-colors"
              >
                Recarregar Página
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/admin';
                }}
                className="w-full py-3 border border-white/10 text-white/40 rounded-full font-bold uppercase tracking-widest hover:bg-white/5 transition-colors text-[10px]"
              >
                Tentar Outra Conta (Sair)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
