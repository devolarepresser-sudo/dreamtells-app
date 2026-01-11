// src/services/dreamApi.ts

/**
 * URL padrão de PRODUÇÃO da API (backend real no Render).
 * Copiado de aiService.ts para consistência.
 */
const DEFAULT_PROD_API_BASE_URL = 'https://dreamtells-backend.onrender.com';

const resolveApiBaseUrl = (): string => {
    // INSTRUÇÃO DO AGENTE: Forçar URL de produção para evitar quebras em localhost com variáveis de ambiente antigas.
    return DEFAULT_PROD_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

export async function interpretDreamApi(text: string): Promise<string> {
    // Ajustado para usar a rota correta do backend Render: /api/interpretarSonho
    const response = await fetch(`${API_BASE_URL}/api/interpretarSonho`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        // Ajustado body conforme documentação do backend:
        // dreamText obrigatório, uid/premium opcionais mas bons de enviar
        body: JSON.stringify({
            dreamText: text,
            uid: null, // usuário anônimo
            premium: false
        }),
    });

    if (!response.ok) {
        throw new Error("Erro ao interpretar o sonho");
    }

    const json = await response.json();

    // Tratamento da resposta conforme spec do backend:
    // Sucesso: { success: true, data: { interpretationMain: "...", ... } }
    // Ou legado: { interpretationMain: "...", ... }

    const data = json.data || json;

    if (data && typeof data.interpretationMain === 'string') {
        return data.interpretationMain;
    }

    // Fallback se vier em outro campo ou formato antigo
    // O backend anterior retornava { interpretation: "..." } no dreamRoutes.ts que eu criei, 
    // mas o backend "Source of Truth" do prompt diz interpretDreamWithGPT5 retorna interpretationMain.
    // Vou checar outros campos comuns.
    return data.interpretation || data.message || JSON.stringify(data);
}
