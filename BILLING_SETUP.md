# Instruções de Instalação - Google Play Billing

## Plugin Necessário

Para que a integração com Google Play funcione no Android, você precisa instalar o plugin:

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

## Configuração do Produto na Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app
3. Vá em **Monetização** → **Produtos**
4. Crie um novo produto de assinatura:
   - **ID do produto:** `dreamtells_premium_mensal`
   - **Nome:** DreamTells Premium
   - **Descrição:** Acesso ilimitado a interpretação de sonhos com IA
   - **Preço:** R$ 9,90
   - **Período de cobrança:** Mensal
   - **Período de teste:** 7 dias (opcional, mas recomendado)

## Como Funciona

### Ambiente Web (Desenvolvimento)
- Detecta que não está em Android WebView
- Simula compra com delay de 1s
- Retorna `'success'` automaticamente
- Permite testar fluxo sem build Android

### Ambiente Android (Produção)
- Detecta WebView do Capacitor
- Importa plugin dinamicamente
- Registra produto `dreamtells_premium_mensal`
- Abre tela de pagamento da Play Store
- Processa resultado (approved/cancelled)
- Finaliza transação
- Retorna resultado para o app

## Testando no Android

### 1. Build do App
```bash
npm run build
npx cap sync
npx cap open android
```

### 2. Configurar Conta de Teste
- Na Play Console, adicione emails de teste em **Configurações** → **Licenças de teste**
- Use esses emails no dispositivo Android

### 3. Testar Compra
1. Instale o app no dispositivo
2. Faça login com email de teste
3. Acesse página Premium
4. Clique "Continuar como usuário Premium"
5. Veja tela de pagamento da Play Store
6. Complete compra de teste (não será cobrado)
7. Verifique que Premium foi ativado

## Funções Disponíveis

### `startPremiumPurchase()`
Inicia fluxo de compra. Retorna:
- `'success'`: Compra aprovada
- `'cancel'`: Usuário cancelou
- `'error'`: Erro no processo

### `checkExistingPurchase()`
Verifica se usuário já tem Premium ativo (útil no login)

### `restorePurchases()`
Restaura compras após reinstalação do app

## Próximos Passos

1. ✅ Código implementado
2. ⏳ Instalar plugin: `npm install @capacitor-community/in-app-purchases`
3. ⏳ Criar produto na Play Console
4. ⏳ Testar em dispositivo Android
5. ⏳ Publicar app na Play Store
