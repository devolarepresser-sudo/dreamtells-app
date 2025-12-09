---
description: Instalar e integrar Java 8 (OpenJDK) no ambiente Windows para uso com Antigravity
---

## Passo a passo para instalar o Java 8 (OpenJDK) e configurá‑lo no Antigravity

1. **Descompactar o pacote baixado**
   - Navegue até a pasta onde o Java foi baixado, por exemplo:
     ```
     C:\Users\press\Downloads\Java\java-1.8.0-openjdk-1.8.0.392-1.b08.redhat.windows.x86_64\
     ```
   - Se o arquivo estiver compactado (`.zip` ou `.tar.gz`), extraia‑o para um diretório permanente, como:
     ```
     C:\Program Files\Java\jdk1.8.0_392
     ```
   - **Importante:** mantenha o caminho sem espaços para evitar problemas de PATH.

2. **Definir a variável de ambiente `JAVA_HOME`**
   - Abra o **PowerShell** como Administrador e execute:
     ```powershell
     [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk1.8.0_392', [System.EnvironmentVariableTarget]::Machine)
     ```
   - Ou, via linha de comando tradicional:
     ```cmd
     setx /M JAVA_HOME "C:\Program Files\Java\jdk1.8.0_392"
     ```
   - Reinicie o terminal para que a nova variável seja reconhecida.

3. **Adicionar o binário do Java ao `PATH`**
   - Ainda no PowerShell (admin), execute:
     ```powershell
     $oldPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)
     $newPath = "$oldPath;${env:JAVA_HOME}\bin"
     [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::Machine)
     ```
   - Ou, via `setx`:
     ```cmd
     setx /M Path "%Path%;C:\Program Files\Java\jdk1.8.0_392\bin"
     ```
   - **Dica:** abra um novo terminal e digite `java -version` para confirmar que o caminho está correto.

4. **Verificar a instalação**
   - No terminal, execute:
     ```
     java -version
     ```
   - Saída esperada (exemplo):
     ```
     openjdk version "1.8.0_392"
     OpenJDK Runtime Environment (build 1.8.0_392-b08)
     OpenJDK 64‑Bit Server VM (build 25.392-b08, mixed mode)
     ```
   - Se a versão aparecer, a instalação está concluída.

5. **Integrar o Java ao Antigravity**
   - O Antigravity (framework de IA) pode precisar do Java para executar ferramentas externas (por exemplo, compilação de código Java ou geração de JARs). Certifique‑se de que o **processo que roda o Antigravity** (por exemplo, o servidor Node) seja iniciado **após** a configuração das variáveis de ambiente.
   - Caso esteja usando scripts de build (Gradle/Maven) dentro do projeto, adicione ao `build.gradle` ou `pom.xml` a referência ao `JAVA_HOME` se necessário.
   - Exemplo rápido de uso no Antigravity (Node):
     ```js
     const { execSync } = require('child_process');
     const javaHome = process.env.JAVA_HOME;
     console.log('Usando Java em:', javaHome);
     // Compila um arquivo Java de exemplo
     execSync('javac -d out src\Example.java');
     ```
   - **Importante:** reinicie o servidor de desenvolvimento (`npm run dev`) após definir as variáveis.

6. **Próximos passos**
   - Agora que o Java está disponível, você pode seguir com as edições da aplicação que requerem compilação Java, como integração de módulos backend, geração de arquivos JAR para Android ou uso de ferramentas de análise estática que dependem do JDK.
   - Se precisar de um **build tool** (Maven/Gradle), instale‑o via `choco` ou baixe‑o manualmente e adicione ao `PATH` da mesma forma.

---

**Resumo rápido**
1️⃣ Descompacte → `C:\Program Files\Java\jdk1.8.0_392`  
2️⃣ `setx /M JAVA_HOME "C:\Program Files\Java\jdk1.8.0_392"`  
3️⃣ `setx /M Path "%Path%;C:\Program Files\Java\jdk1.8.0_392\bin"`  
4️⃣ `java -version`  
5️⃣ Reinicie o Antigravity/Node.
---
