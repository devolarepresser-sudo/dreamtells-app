/**
 * Billing Service - Google Play Billing Integration (modo seguro)
 *
 * Este serviço gerencia a compra de Premium via Google Play Store.
 *
 * AGORA:
 * - Em ambiente web (Antigravity/navegador): simula a compra para testes
 * - Em ambiente Android: ainda NÃO está integrado (fica como TODO)
 *
 * QUANDO O PLUGIN FOR INSTALADO:
 * - Voltar aqui e implementar a parte Android real com @capacitor-community/in-app-purchases
 */

// ID do produto Premium configurado no Google Play Console
const PREMIUM_PRODUCT_ID = 'dreamtells_premium_mensal';

/**
 * Tipo de resultado da compra
 */
export type PurchaseResult = 'success' | 'cancel' | 'error';

/**
 * Detecta se está rodando em WebView Android
 */
function isAndroidWebView(): boolean {
    if (typeof navigator === 'undefined') return false;

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isWebView =
        typeof window !== 'undefined' &&
        (!!(window as any).Capacitor || !!(window as any).AndroidInterface);

    return isAndroid && isWebView;
}

/**
 * Inicia o fluxo de compra do Premium
 *
 * AGORA:
 * - Web / Antigravity: simulação de compra (sempre success)
 * - Android: ainda não implementado (retorna 'error' e loga aviso)
 */
export async function startPremiumPurchase(): Promise<PurchaseResult> {
    console.log('[billingService] Iniciando compra Premium...');

    // 1) AMBIENTE WEB (Antigravity, navegador desktop) → SIMULA COMPRA
    if (!isAndroidWebView()) {
        console.log('[billingService] Ambiente WEB detectado - Simulando compra');

        // Simular delay de processamento
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const simulatedResult: PurchaseResult = 'success';
        console.log(`[billingService] Simulação concluída: ${simulatedResult}`);

        return simulatedResult;
    }

    // 2) AMBIENTE ANDROID (app instalado) → AINDA NÃO IMPLEMENTADO
    console.warn(
        '[billingService] Ambiente ANDROID detectado, mas o plugin de Billing ainda não está instalado/integrado.'
    );
    console.warn(
        '[billingService] Quando o plugin @capacitor-community/in-app-purchases for instalado, implemente aqui a compra real.'
    );

    // Por enquanto, retornamos 'error' para indicar que a compra real ainda não funciona
    return 'error';
}

/**
 * Verifica se o usuário já possui a assinatura Premium ativa
 * (útil para restaurar compras após reinstalação)
 *
 * AGORA:
 * - Retorna sempre false (a lógica real depende do plugin Android)
 */
export async function checkExistingPurchase(): Promise<boolean> {
    console.log('[billingService] checkExistingPurchase chamado');

    if (!isAndroidWebView()) {
        console.log('[billingService] Ambiente web - pulando verificação');
        return false;
    }

    console.warn(
        '[billingService] Verificação de compras existentes ainda não implementada (falta plugin de Billing).'
    );
    return false;
}

/**
 * Restaura compras anteriores (caso o usuário tenha reinstalado o app)
 *
 * AGORA:
 * - Retorna sempre false (a lógica real depende do plugin Android)
 */
export async function restorePurchases(): Promise<boolean> {
    console.log('[billingService] restorePurchases chamado');

    if (!isAndroidWebView()) {
        console.log('[billingService] Ambiente web - pulando restauração');
        return false;
    }

    console.warn(
        '[billingService] Restauração de compras ainda não implementada (falta plugin de Billing).'
    );
    return false;
}

// Exportar constantes úteis
export const BILLING_CONFIG = {
    PRODUCT_ID: PREMIUM_PRODUCT_ID,
    PRODUCT_NAME: 'DreamTells Premium',
    PRODUCT_DESCRIPTION: 'Acesso ilimitado a interpretação de sonhos com IA',
    PRICE: 'R$ 9,90/mês',
} as const;
