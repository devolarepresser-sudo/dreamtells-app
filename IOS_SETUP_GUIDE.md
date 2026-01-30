# iOS App Store - Guia de Configuração

Este guia contém os passos necessários para finalizar a subida do DreamTells na App Store assim que você tiver acesso a um Mac.

## 1. Pré-Requisitos no Mac
- Instalar **Xcode** (via App Store).
- Instalar **CocoaPods**: `sudo gem install cocoapods`.
- Ter uma conta **Apple Developer** ativa ($99/ano).

## 2. Configurações de Identidade
O Identificador do app está configurado como: `com.dreamtells.sonhos`.
> [!IMPORTANT]
> Certifique-se de que o **Bundle ID** criado no [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) seja exatamente `com.dreamtells.sonhos`.

## 3. Google Auth no iOS
Para que o login com Google funcione no iPhone:
1. No Firebase Console, adicione um **App iOS**.
2. Baixe o arquivo `GoogleService-Info.plist`.
3. Arraste este arquivo para dentro do projeto no Xcode (dentro da pasta `App/App`).
4. Procure pela chave `REVERSED_CLIENT_ID` dentro do arquivo baixado.
5. No Xcode, navegue até **Info -> URL Types**.
6. Adicione um novo URL Type e cole o `REVERSED_CLIENT_ID` no campo **URL Schemes**.

## 4. Comandos de Preparação
Sempre que fizer mudanças no código (no Windows ou Mac), execute:
```bash
npm run build
npx cap sync ios
```

## 5. Permissões de Privacidade
Já adiantei as mensagens de permissão no arquivo `Info.plist`:
- **Microfone**: Para gravar relatos de sonhos.
- **Reconhecimento de Fala**: Para transformar áudio em texto.
- **Galeria de Fotos**: Para escolher foto de perfil.

## 6. Subida para o TestFlight
1. No Xcode, mude o destino para **Any iOS Device (arm64)**.
2. Vá em **Product -> Archive**.
3. Siga os passos de *Distribute App* para enviar para o App Store Connect.
4. Acesse o [App Store Connect](https://appstoreconnect.apple.com/) para gerenciar os testes e a revisão final.

---
> [!TIP]
> Os ícones e a tela de abertura (Splash) já foram gerados e estão na pasta `ios/App/App/Assets.xcassets`.
