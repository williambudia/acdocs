# 🚀 Guia de Deploy - ACDocs MVP

## ✅ Seu Projeto Já Está Pronto para Deploy Estático!

O Next.js está configurado para gerar uma SPA estática que pode ser hospedada em qualquer serviço de páginas estáticas.

---

## 📦 Build para Produção

```bash
npm run build
```

Isso gera a pasta `.next` com todos os arquivos estáticos otimizados.

---

## 🌐 Opções de Hospedagem Gratuita

### 1️⃣ **Vercel (Recomendado - Mais Fácil)**

**Por quê?**
- ✅ Deploy automático do GitHub
- ✅ SSL grátis
- ✅ CDN global
- ✅ Preview de PRs
- ✅ Zero configuração

**Como fazer:**

1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Clique em "Deploy"
4. Pronto! URL: `seu-projeto.vercel.app`

**Limites Gratuitos:**
- 100GB bandwidth/mês
- Builds ilimitados
- Domínio customizado grátis

---

### 2️⃣ **Netlify (Alternativa Excelente)**

**Por quê?**
- ✅ Interface amigável
- ✅ Forms e Functions grátis
- ✅ Deploy automático
- ✅ SSL grátis

**Como fazer:**

1. Acesse [netlify.com](https://netlify.com)
2. "Add new site" → "Import from Git"
3. Conecte o repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Deploy!

**Limites Gratuitos:**
- 100GB bandwidth/mês
- 300 build minutes/mês
- Domínio customizado grátis

---

### 3️⃣ **Cloudflare Pages (Melhor Performance)**

**Por quê?**
- ✅ CDN mais rápido do mundo
- ✅ Bandwidth ilimitado
- ✅ Builds ilimitados
- ✅ SSL grátis

**Como fazer:**

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. "Create a project" → Conecte GitHub
3. Configure:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output**: `.next`
4. Deploy!

**Limites Gratuitos:**
- ✅ Bandwidth ilimitado
- ✅ Builds ilimitados
- ✅ 500 builds/mês

---

### 4️⃣ **GitHub Pages (Mais Simples)**

**Por quê?**
- ✅ Totalmente grátis
- ✅ Integrado ao GitHub
- ✅ Simples de configurar

**Como fazer:**

1. Instale o pacote de deploy:
```bash
npm install --save-dev gh-pages
```

2. Adicione ao `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d .next"
  }
}
```

3. Configure o `next.config.mjs`:
```js
const nextConfig = {
  output: 'export',
  basePath: '/nome-do-repositorio', // Se não for o repo principal
  images: { unoptimized: true },
}
```

4. Deploy:
```bash
npm run deploy
```

5. Ative GitHub Pages:
   - Repositório → Settings → Pages
   - Source: `gh-pages` branch
   - URL: `usuario.github.io/repositorio`

---

## 🔧 Configuração Atual do Projeto

Seu `next.config.mjs` já está configurado:

```js
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Remover em produção
  },
  images: {
    unoptimized: true, // ✅ Necessário para static export
  },
}
```

---

## 📋 Checklist Pré-Deploy

### ✅ **Antes do Deploy**

- [ ] Testar build local: `npm run build`
- [ ] Testar produção local: `npm start`
- [ ] Verificar se todas as páginas carregam
- [ ] Testar autenticação
- [ ] Testar upload de documentos
- [ ] Verificar responsividade mobile

### ⚠️ **Ajustes Recomendados**

1. **Remover `ignoreBuildErrors`** (produção):
```js
const nextConfig = {
  // typescript: { ignoreBuildErrors: true }, // Remover
  images: { unoptimized: true },
}
```

2. **Adicionar variáveis de ambiente** (se necessário):
```env
# .env.production
NEXT_PUBLIC_APP_NAME=ACDocs
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

3. **Configurar domínio customizado** (opcional):
   - Comprar domínio (R$ 40/ano)
   - Configurar DNS
   - Adicionar no painel da hospedagem

---

## 🎯 Recomendação para MVP

### **Use Vercel** 🏆

**Por quê?**
1. **Zero configuração** - funciona out of the box
2. **Deploy automático** - push no GitHub = deploy
3. **Preview URLs** - cada PR tem sua URL de teste
4. **Analytics grátis** - métricas de performance
5. **Suporte oficial** - Next.js é da Vercel

### **Passo a Passo Rápido:**

1. Push seu código para GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório
4. Clique "Deploy"
5. ✅ Pronto! Seu app está no ar

**Tempo total: 5 minutos**

---

## 🔒 Segurança

### **Dados do Usuário**

✅ **Seus dados estão seguros:**
- IndexedDB roda no browser do usuário
- Nada é enviado para servidor
- Dados persistem localmente
- HTTPS automático (SSL grátis)

### **Quando Adicionar Backend**

Quando implementar o backend real:
1. Deploy do backend separado (Railway, Render, Fly.io)
2. Configurar CORS
3. Adicionar variáveis de ambiente
4. Manter frontend no mesmo lugar

---

## 📊 Monitoramento

### **Vercel Analytics (Grátis)**

Adicione ao `app/layout.tsx`:
```tsx
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics /> {/* Já está adicionado! */}
      </body>
    </html>
  )
}
```

Métricas disponíveis:
- Page views
- Performance (Core Web Vitals)
- Dispositivos e browsers
- Localização geográfica

---

## 🚨 Troubleshooting

### **Erro: "Page not found" após deploy**

**Solução:** Adicione ao `next.config.mjs`:
```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
}
```

### **Erro: "Images not loading"**

**Solução:** Já configurado com `images: { unoptimized: true }`

### **Erro: "404 on refresh"**

**Solução:** Configurar redirects (já funciona com Next.js)

---

## 💰 Custos

### **Fase MVP (Grátis)**
- Hospedagem: R$ 0
- SSL: R$ 0
- CDN: R$ 0
- Bandwidth: R$ 0 (até 100GB)
- **Total: R$ 0/mês**

### **Quando Escalar**
- Vercel Pro: $20/mês (~R$ 100)
- Domínio: R$ 40/ano
- Backend: R$ 0-50/mês (Railway/Render)

---

## 🎉 Próximos Passos

1. **Deploy no Vercel** (5 min)
2. **Testar com usuários** (1-2 semanas)
3. **Coletar feedback** (formulários, entrevistas)
4. **Iterar features** (baseado no uso real)
5. **Adicionar backend** (quando necessário)

---

## 📞 Suporte

### **Documentação Oficial**
- [Next.js Deploy](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)

### **Comunidade**
- [Next.js Discord](https://discord.gg/nextjs)
- [Vercel Community](https://github.com/vercel/next.js/discussions)

---

**Documento criado em**: Fevereiro 2026  
**Última atualização**: Fevereiro 2026  
**Versão**: 1.0

---

## ✨ Dica Final

**Não complique!** Para o MVP:
1. Deploy na Vercel
2. Compartilhe a URL com usuários
3. Colete feedback
4. Itere rapidamente

Você tem um produto funcional e profissional. Coloque no ar e valide com usuários reais! 🚀