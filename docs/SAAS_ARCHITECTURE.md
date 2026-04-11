# Arquitetura SaaS Multi-Tenant - ACDocs

## Visão Geral

O ACDocs será uma plataforma SaaS (Software as a Service) multi-tenant, onde cada produtor rural terá seu próprio espaço isolado e seguro para gerenciar documentos de sua propriedade e dependentes.

## Modelo de Negócio

### Conceitos Principais

- **Tenant (Inquilino)**: Cada produtor rural é um tenant independente
- **Workspace**: Espaço isolado de cada produtor com seus dados
- **Isolamento de Dados**: Garantia absoluta de que dados de um produtor nunca são acessíveis por outro
- **Multi-tenancy**: Múltiplos produtores usando a mesma infraestrutura, mas com dados completamente isolados

## Arquitetura Multi-Tenant

### 1. Modelo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                        TENANT (Produtor)                     │
│  - id: uuid                                                  │
│  - name: string (Nome da Propriedade/Produtor)              │
│  - subdomain: string (opcional: produtor.acdocs.com)        │
│  - plan: enum (free, basic, premium, enterprise)            │
│  - status: enum (active, suspended, cancelled)              │
│  - created_at: timestamp                                     │
│  - settings: json (configurações específicas)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     USER (Usuários do Tenant)                │
│  - id: uuid                                                  │
│  - tenant_id: uuid (FK → Tenant)                            │
│  - email: string                                             │
│  - name: string                                              │
│  - role: enum (owner, admin, manager, user, reader)         │
│  - is_dependent: boolean (se é dependente do produtor)      │
│  - parent_user_id: uuid (FK → User, se for dependente)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT (Documentos)                     │
│  - id: uuid                                                  │
│  - tenant_id: uuid (FK → Tenant) ⚠️ CRÍTICO                 │
│  - owner_user_id: uuid (FK → User)                          │
│  - category_id: uuid                                         │
│  - name: string                                              │
│  - file_path: string (storage isolado por tenant)           │
│  - expires_at: timestamp                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. Estratégias de Isolamento

#### Opção A: Database per Tenant (Recomendado para Escala)
- Cada tenant tem seu próprio banco de dados
- **Prós**: Isolamento máximo, backup individual, migração fácil
- **Contras**: Mais complexo de gerenciar, custo inicial maior

#### Opção B: Schema per Tenant (Recomendado para MVP → Produção)
- Todos os tenants no mesmo banco, mas cada um em um schema diferente
- **Prós**: Bom isolamento, gerenciamento mais simples
- **Contras**: Backup é compartilhado

#### Opção C: Shared Database with Tenant ID (Atual MVP)
- Todos os dados no mesmo banco, filtrados por `tenant_id`
- **Prós**: Mais simples, menor custo inicial
- **Contras**: Requer cuidado extremo nas queries, risco de vazamento de dados

**Recomendação**: Começar com Opção C (MVP atual) e migrar para Opção B quando escalar.

### 3. Camadas de Segurança

#### 3.1 Row-Level Security (RLS)
```sql
-- PostgreSQL exemplo
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Toda query automaticamente filtra por tenant_id
```

#### 3.2 Middleware de Tenant Context
```typescript
// Exemplo de middleware Next.js
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  const tenantId = session.user.tenantId;
  
  // Injeta tenant_id em todas as queries
  request.headers.set('X-Tenant-ID', tenantId);
  
  return NextResponse.next();
}
```

#### 3.3 API Layer Protection
```typescript
// Toda query deve incluir tenant_id
async function getDocuments(userId: string, tenantId: string) {
  return db.documents.findMany({
    where: {
      tenant_id: tenantId, // ⚠️ SEMPRE incluir
      owner_user_id: userId
    }
  });
}
```

## Fluxo de Onboarding

### 1. Cadastro de Novo Produtor

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Produtor acessa acdocs.com/signup                        │
│    - Preenche: Nome, Email, Senha, Nome da Propriedade     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Sistema cria:                                             │
│    - Tenant (workspace do produtor)                          │
│    - User (produtor como owner)                              │
│    - Estrutura inicial (categorias padrão)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Produtor é redirecionado para seu workspace              │
│    - URL: app.acdocs.com (tenant_id no token)               │
│    - ou: produtor.acdocs.com (subdomain)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Cadastro de Dependentes

```
┌─────────────────────────────────────────────────────────────┐
│ Produtor (Owner) acessa "Usuários" → "Adicionar Dependente"│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Sistema cria User com:                                       │
│  - tenant_id: mesmo do produtor                              │
│  - parent_user_id: id do produtor                            │
│  - is_dependent: true                                        │
│  - role: user ou reader (acesso limitado)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Dependente recebe email com link de ativação                │
│ Define senha e acessa apenas documentos do seu tenant       │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Permissões

### Hierarquia de Roles

```
Owner (Produtor Principal)
  ├─ Acesso total ao tenant
  ├─ Gerencia todos os usuários e dependentes
  ├─ Gerencia plano e pagamento
  └─ Pode deletar o tenant

Admin (Administrador da Propriedade)
  ├─ Acesso total aos documentos
  ├─ Gerencia usuários (exceto owner)
  └─ Não pode alterar plano

Manager (Gerente/Responsável)
  ├─ Gerencia documentos e categorias
  ├─ Visualiza relatórios
  └─ Não gerencia usuários

User (Dependente/Colaborador)
  ├─ Cria e gerencia seus próprios documentos
  ├─ Visualiza documentos compartilhados
  └─ Acesso limitado

Reader (Visualizador)
  ├─ Apenas visualiza documentos
  └─ Não pode criar ou editar
```

### Matriz de Permissões por Tenant

| Ação | Owner | Admin | Manager | User | Reader |
|------|-------|-------|---------|------|--------|
| Gerenciar Tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Plano | ✅ | ❌ | ❌ | ❌ | ❌ |
| Adicionar Dependentes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar Categorias | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload Documentos | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver Todos Docs | ✅ | ✅ | ✅ | ❌* | ❌* |
| Ver Próprios Docs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Deletar Docs | ✅ | ✅ | ✅ | ✅** | ❌ |

*Apenas documentos compartilhados com eles
**Apenas seus próprios documentos

## Infraestrutura Backend

### Stack Tecnológica Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 16+ (App Router) + React 19                        │
│  - Mantém estrutura atual do MVP                            │
│  - Adiciona autenticação real                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Backend)                     │
│  Opção 1: Next.js API Routes + Server Actions               │
│  Opção 2: NestJS (Node.js framework enterprise)             │
│  Opção 3: FastAPI (Python, se preferir)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Database                             │
│  PostgreSQL (Recomendado)                                    │
│  - Suporta RLS (Row Level Security)                         │
│  - Schemas por tenant                                        │
│  - JSON fields para flexibilidade                           │
│                                                              │
│  Alternativa: MySQL 8+ ou MongoDB (menos recomendado)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      File Storage                            │
│  Google Cloud Storage ou AWS S3                              │
│  - Estrutura: /tenants/{tenant_id}/documents/{doc_id}       │
│  - Signed URLs para acesso temporário                        │
│  - Versionamento de arquivos                                 │
└─────────────────────────────────────────────────────────────┘
```

### Arquitetura Cloud (Google Cloud Run)

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Load Balancer                     │
│                    (acdocs.com, *.acdocs.com)               │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Cloud Run (Frontend)   │   │   Cloud Run (Backend)    │
│   Next.js SSR            │   │   API + Auth             │
│   Auto-scaling           │   │   Auto-scaling           │
└──────────────────────────┘   └──────────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                ┌──────────────────────────┐
                │   Cloud SQL (PostgreSQL) │
                │   - Backups automáticos  │
                │   - High Availability    │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Cloud Storage (GCS)    │
                │   - Documentos           │
                │   - Backups              │
                └──────────────────────────┘
```

## Autenticação e Autorização

### Sistema de Auth

```typescript
// Estrutura do JWT Token
interface JWTPayload {
  userId: string;
  tenantId: string;  // ⚠️ CRÍTICO - sempre presente
  email: string;
  role: Role;
  permissions: string[];
  iat: number;
  exp: number;
}

// Middleware de validação
async function validateTenantAccess(
  userId: string, 
  tenantId: string
): Promise<boolean> {
  const user = await db.users.findUnique({
    where: { id: userId }
  });
  
  // Valida se usuário pertence ao tenant
  return user?.tenant_id === tenantId;
}
```

### Fluxo de Login

```
1. Usuário entra com email/senha
2. Sistema busca usuário e valida credenciais
3. Sistema identifica tenant_id do usuário
4. Gera JWT com userId + tenantId + role
5. Todas as requisições incluem JWT
6. Backend valida JWT e extrai tenantId
7. Todas as queries filtram por tenantId automaticamente
```

## Planos e Monetização

### Estrutura de Planos

```yaml
Free (Gratuito):
  - 1 produtor (owner)
  - 2 dependentes
  - 100 documentos
  - 1 GB storage
  - Notificações email
  - Suporte: comunidade

Basic (R$ 49/mês):
  - 1 produtor
  - 5 dependentes
  - 500 documentos
  - 10 GB storage
  - Notificações email + WhatsApp
  - Suporte: email (48h)

Premium (R$ 99/mês):
  - 1 produtor
  - 15 dependentes
  - Documentos ilimitados
  - 50 GB storage
  - Todas notificações
  - Relatórios avançados
  - Suporte: email (24h)

Enterprise (Customizado):
  - Múltiplos produtores (cooperativa)
  - Dependentes ilimitados
  - Storage customizado
  - API access
  - White-label
  - Suporte: prioritário + telefone
```

## Segurança e Compliance

### Criptografia de Documentos por Chave Pública/Privada

Para documentos sensíveis (ex: documentos pessoais, contratos, certidões), o sistema adota criptografia assimétrica baseada em curva elíptica **secp256k1** — a mesma utilizada pelo Bitcoin — combinada com **SHA-256** para integridade.

#### Por que secp256k1?
- Amplamente auditada e battle-tested (protege trilhões de dólares em ativos digitais)
- Chaves compactas (256 bits) com segurança equivalente a RSA-3072
- Suporte nativo em bibliotecas como `noble-secp256k1` (TypeScript/Node.js)

#### Modelo de Chaves por Usuário

```
┌─────────────────────────────────────────────────────────────┐
│                     USER KEY PAIR                            │
│  - public_key: string  (armazenada no banco, por usuário)   │
│  - private_key: string (NUNCA armazenada no servidor)       │
│    → Derivada da senha do usuário via PBKDF2/Argon2         │
│    → Fica apenas no dispositivo/sessão do usuário           │
└─────────────────────────────────────────────────────────────┘
```

#### Fluxo de Upload (Criptografia)

```
1. Usuário faz upload do documento
2. Sistema gera uma chave simétrica AES-256 aleatória (DEK - Data Encryption Key)
3. Documento é criptografado com AES-256-GCM usando a DEK
4. A DEK é criptografada com a chave pública secp256k1 do owner
5. Para cada dependente com acesso, a DEK também é criptografada com a chave pública deles
6. SHA-256 hash do documento original é calculado e armazenado (integridade)
7. Arquivo criptografado + DEKs criptografadas são armazenados no Cloud Storage
```

```typescript
interface EncryptedDocument {
  id: string;
  // Arquivo criptografado com AES-256-GCM
  encrypted_file_path: string;
  // Hash SHA-256 do arquivo original (verificação de integridade)
  sha256_hash: string;
  // DEK criptografada para cada destinatário autorizado
  encrypted_keys: {
    user_id: string;
    encrypted_dek: string; // DEK cifrada com a chave pública do usuário
  }[];
  // Metadados não criptografados (nome, tipo, datas)
  metadata: DocumentMetadata;
}
```

#### Fluxo de Download (Descriptografia)

```
1. Usuário solicita o documento
2. Sistema valida permissão (tenant_id + owner/dependente)
3. Sistema retorna o arquivo criptografado + a DEK criptografada para aquele usuário
4. NO CLIENTE: usuário usa sua chave privada (derivada da senha) para descriptografar a DEK
5. Com a DEK, descriptografa o arquivo localmente (AES-256-GCM)
6. SHA-256 é recalculado e comparado para garantir integridade
7. Documento é exibido — o servidor NUNCA vê o conteúdo em claro
```

```typescript
// Exemplo de implementação (client-side)
import { secp256k1 } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

async function decryptDocument(
  encryptedFile: ArrayBuffer,
  encryptedDek: string,
  userPrivateKey: Uint8Array
): Promise<ArrayBuffer> {
  // 1. Descriptografa a DEK com a chave privada do usuário (ECIES)
  const dek = await eciesDecrypt(userPrivateKey, encryptedDek);

  // 2. Descriptografa o arquivo com AES-256-GCM
  const decryptedFile = await aesGcmDecrypt(dek, encryptedFile);

  // 3. Verifica integridade via SHA-256
  const hash = sha256(new Uint8Array(decryptedFile));
  // comparar com sha256_hash armazenado...

  return decryptedFile;
}
```

#### Derivação da Chave Privada (sem custódia do servidor)

```typescript
// Chave privada derivada da senha — servidor nunca a conhece
async function derivePrivateKey(
  password: string,
  salt: string // salt único por usuário, armazenado no banco
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Buffer.from(salt, 'hex'), iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return new Uint8Array(bits); // chave privada secp256k1
}
```

#### Compartilhamento com Dependentes

Quando o owner adiciona um dependente e concede acesso a um documento:
1. Owner usa sua chave privada para descriptografar a DEK do documento
2. Re-criptografa a DEK com a chave pública do dependente
3. Adiciona a nova entrada em `encrypted_keys` para aquele dependente
4. Dependente passa a conseguir descriptografar o documento de forma independente

#### Considerações de Segurança

| Aspecto | Abordagem |
|---------|-----------|
| Algoritmo assimétrico | secp256k1 (ECIES) |
| Algoritmo simétrico | AES-256-GCM |
| Integridade | SHA-256 |
| Derivação de chave | PBKDF2 (600k iterações) ou Argon2id |
| Custódia da chave privada | Zero-knowledge — apenas no cliente |
| Vazamento de servidor | Servidor comprometido não expõe conteúdo |
| Rotação de chaves | Necessária ao trocar senha (re-criptografar DEKs) |

> ⚠️ **Importante**: A perda da senha implica perda de acesso aos documentos criptografados. O mecanismo de recuperação via frase mnemônica BIP-39 é obrigatório.

#### Recuperação via Frase Mnemônica (BIP-39)

No momento do cadastro, o sistema gera uma frase mnemônica de 12 ou 24 palavras (BIP-39) que serve como backup da chave privada do usuário.

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE CADASTRO                           │
│                                                              │
│  1. Usuário define senha                                     │
│  2. Sistema gera mnemônica BIP-39 (12/24 palavras)          │
│  3. Chave privada é derivada da mnemônica via BIP-32/HD     │
│  4. Usuário confirma que anotou a frase (obrigatório)        │
│  5. Frase NUNCA é armazenada no servidor                     │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/portuguese';
import { HDKey } from '@scure/bip32';

// Geração no cadastro
function generateUserMnemonic(): string {
  return generateMnemonic(wordlist, 128); // 12 palavras em português
}

// Derivação da chave privada a partir da mnemônica
function derivePrivateKeyFromMnemonic(mnemonic: string): Uint8Array {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  // path padrão derivado para o app
  const child = hdKey.derive("m/44'/0'/0'/0/0");
  return child.privateKey!;
}
```

#### Fluxo de Recuperação de Acesso

```
1. Usuário esqueceu a senha
2. Acessa "Recuperar acesso" → informa as 12/24 palavras
3. Sistema re-deriva a chave privada a partir da mnemônica
4. Usuário define nova senha
5. Sistema re-criptografa as DEKs dos documentos com a nova chave derivada da senha
6. Acesso restaurado — sem envolver o servidor no processo
```

| Aspecto | Detalhe |
|---------|---------|
| Padrão | BIP-39 (compatível com carteiras Bitcoin/Ethereum) |
| Wordlist | Português disponível (`@scure/bip39`) |
| Tamanho | 12 palavras (128 bits de entropia) ou 24 palavras (256 bits) |
| Derivação | BIP-32 HD Key (`m/44'/0'/0'/0/0`) |
| Custódia | Frase nunca trafega ou é armazenada no servidor |
| UX | Exibida uma única vez no cadastro, com confirmação obrigatória |

---

### Checklist de Segurança

- [ ] **Isolamento de Dados**: Tenant ID em todas as queries
- [ ] **Criptografia em Trânsito**: HTTPS/TLS 1.3
- [ ] **Criptografia em Repouso**: AES-256-GCM por documento
- [ ] **Criptografia E2E**: secp256k1 + SHA-256 para documentos sensíveis
- [ ] **Zero-Knowledge**: Servidor nunca armazena chaves privadas
- [ ] **Backup**: Diário com retenção de 30 dias
- [ ] **Auditoria**: Log de todas as ações (quem, quando, o quê)
- [ ] **LGPD**: Consentimento, portabilidade, direito ao esquecimento
- [ ] **2FA**: Autenticação de dois fatores (opcional)
- [ ] **Rate Limiting**: Proteção contra abuso
- [ ] **WAF**: Web Application Firewall (Cloud Armor)

### LGPD Compliance

```typescript
// Funcionalidades necessárias
interface LGPDFeatures {
  // Consentimento
  acceptTerms: (userId: string, version: string) => Promise<void>;
  
  // Portabilidade
  exportUserData: (userId: string) => Promise<DataExport>;
  
  // Direito ao Esquecimento
  deleteUserData: (userId: string) => Promise<void>;
  
  // Auditoria
  logDataAccess: (userId: string, action: string) => Promise<void>;
}
```

## SSO (Single Sign-On) — Integração Futura

### Compatibilidade com a Arquitetura de Criptografia

O SSO (via OAuth2/OIDC — Google, Microsoft, etc.) é compatível com a arquitetura de chave pública/privada, mas requer atenção: provedores SSO autenticam a **identidade** do usuário, mas não fornecem uma senha para derivar a chave privada. A estratégia adotada é usar a **mnemônica BIP-39 como âncora da chave**, desacoplando autenticação de criptografia.

```
┌─────────────────────────────────────────────────────────────┐
│              SEPARAÇÃO DE RESPONSABILIDADES                  │
│                                                              │
│  SSO (Google/Microsoft)  →  Autentica QUEM é o usuário      │
│  Mnemônica BIP-39        →  Prova que o usuário tem a CHAVE │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Cadastro com SSO

```
1. Usuário clica em "Entrar com Google"
2. OAuth2 retorna identidade verificada (email, sub, etc.)
3. Sistema cria conta e gera mnemônica BIP-39 (12 palavras)
4. Usuário é obrigado a anotar e confirmar a frase
5. Chave privada é derivada da mnemônica (BIP-32)
6. Chave pública é armazenada no banco
7. Sessão é estabelecida com JWT (userId + tenantId + role)
```

### Fluxo de Login com SSO (sessão ativa)

```
1. Usuário autentica via SSO → recebe JWT da sessão
2. Chave privada é re-derivada da mnemônica (armazenada localmente
   no dispositivo via IndexedDB criptografado com PIN opcional)
3. Documentos são descriptografados normalmente no cliente
```

### Opção: PIN Local para Desbloquear a Chave

Para melhorar a UX (evitar pedir a mnemônica a cada login), a chave privada pode ser armazenada localmente protegida por um PIN:

```typescript
// Após login SSO, chave privada é criptografada com PIN e salva localmente
async function storeKeyWithPin(privateKey: Uint8Array, pin: string): Promise<void> {
  const pinKey = await deriveKeyFromPin(pin); // PBKDF2 do PIN
  const encrypted = await aesGcmEncrypt(pinKey, privateKey);
  // Armazena no IndexedDB do browser (nunca vai ao servidor)
  await localKeyStore.set('encrypted_private_key', encrypted);
}

// No próximo login SSO, usuário digita PIN para desbloquear
async function unlockKeyWithPin(pin: string): Promise<Uint8Array> {
  const encrypted = await localKeyStore.get('encrypted_private_key');
  const pinKey = await deriveKeyFromPin(pin);
  return aesGcmDecrypt(pinKey, encrypted);
}
```

### Provedores Suportados (OIDC)

| Provedor | Protocolo | Biblioteca recomendada |
|----------|-----------|----------------------|
| Google | OAuth2/OIDC | `next-auth` (Google Provider) |
| Microsoft (Azure AD) | OIDC | `next-auth` (Azure AD Provider) |
| GitHub | OAuth2 | `next-auth` (GitHub Provider) |
| Qualquer IdP corporativo | SAML 2.0 / OIDC | `next-auth` + `@auth/core` |

### Implementação com next-auth

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Injeta tenantId e role no token (buscados do banco)
        const dbUser = await getUserByEmail(user.email!);
        token.tenantId = dbUser.tenant_id;
        token.role = dbUser.role;
        token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.tenantId = token.tenantId as string;
      session.user.role = token.role as string;
      session.user.userId = token.userId as string;
      return session;
    }
  }
});
```

### Considerações

| Aspecto | Detalhe |
|---------|---------|
| Autenticação | Delegada ao provedor SSO (Google, Microsoft, etc.) |
| Chave privada | Derivada da mnemônica — independente do SSO |
| Recuperação | Mnemônica BIP-39 (mesmo fluxo atual) |
| Dispositivo novo | Usuário informa mnemônica ou usa PIN sincronizado |
| Revogação de acesso | Revogar sessão SSO não revoga a chave criptográfica |
| Complexidade de integração | Baixa — `next-auth` abstrai OAuth2/OIDC |

> 💡 A separação entre autenticação (SSO) e criptografia (mnemônica) é intencional e garante que mesmo que o provedor SSO seja comprometido, os documentos permanecem inacessíveis sem a chave privada do usuário.

---

## Migração do MVP para Produção

### Fase 1: Backend Setup (Mês 1-2)
1. Configurar PostgreSQL com RLS
2. Implementar API de autenticação
3. Criar sistema de tenants
4. Migrar dados mock para estrutura real

### Fase 2: Storage e Upload (Mês 2-3)
1. Configurar Google Cloud Storage
2. Implementar upload de arquivos real
3. Sistema de versionamento
4. Signed URLs para download seguro

### Fase 3: Notificações Reais (Mês 3)
1. Integração com serviço de email (SendGrid/AWS SES)
2. Integração WhatsApp Business API
3. Sistema de agendamento de notificações
4. Templates de mensagens

### Fase 4: Pagamentos (Mês 4)
1. Integração com gateway (Stripe/Mercado Pago)
2. Sistema de planos e assinaturas
3. Gestão de upgrades/downgrades
4. Faturamento automático

### Fase 5: Produção (Mês 5)
1. Deploy em Cloud Run
2. Configurar domínio e SSL
3. Monitoramento e alertas
4. Documentação para usuários

## Custos Estimados (Google Cloud)

### MVP em Produção (até 100 tenants)
- Cloud Run (Frontend + Backend): ~$50/mês
- Cloud SQL (PostgreSQL): ~$100/mês
- Cloud Storage: ~$20/mês
- Load Balancer: ~$20/mês
- **Total: ~$190/mês**

### Escala Média (1000 tenants)
- Cloud Run: ~$200/mês
- Cloud SQL: ~$300/mês
- Cloud Storage: ~$100/mês
- Load Balancer: ~$50/mês
- **Total: ~$650/mês**

### Escala Grande (10.000 tenants)
- Cloud Run: ~$1.000/mês
- Cloud SQL: ~$1.500/mês
- Cloud Storage: ~$500/mês
- CDN + Load Balancer: ~$200/mês
- **Total: ~$3.200/mês**

## Métricas de Sucesso

### KPIs Técnicos
- Uptime: > 99.9%
- Tempo de resposta: < 200ms (p95)
- Zero vazamento de dados entre tenants
- Backup recovery time: < 1 hora

### KPIs de Negócio
- Churn rate: < 5% mensal
- NPS: > 50
- Tempo de onboarding: < 5 minutos
- Documentos por tenant: média > 50

## Próximos Passos

1. **Validar arquitetura com investidores**
2. **Definir roadmap detalhado**
3. **Contratar equipe de desenvolvimento**
4. **Implementar backend (Fase 1)**
5. **Beta testing com produtores reais**
6. **Launch oficial**

---

**Documento criado em**: 24/02/2026
**Versão**: 1.0
**Autor**: Equipe ACDocs
