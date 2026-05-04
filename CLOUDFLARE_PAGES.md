# Deploy no Cloudflare Pages

Configuração recomendada:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: raiz do repositório
- Node.js: 22

O erro anterior acontecia antes da build porque o Cloudflare executa `npm ci` e o `package-lock.json` não estava sincronizado com o `package.json`.
Nesta versão, o lock foi regenerado e validado com `npm ci --dry-run`.

Arquivos importantes para SPA/PWA no Cloudflare:

- `public/_redirects`: garante que rotas como `/alertas` e `/nova` abram direto no navegador.
- `public/_headers`: adiciona cabeçalhos básicos de segurança e permissão de câmera para o leitor de código de barras.
- `public/manifest.json`: manifesto PWA com atalhos.
- `public/sw.js`: service worker com cache básico do app shell.
