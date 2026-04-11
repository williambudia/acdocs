# Schema de Banco de Dados - ACDocs SaaS

## Visão Geral

Este documento detalha o schema completo do banco de dados PostgreSQL para a versão SaaS multi-tenant do ACDocs.

## Princípios de Design

1. **Tenant Isolation**: Toda tabela principal tem `tenant_id`
2. **Soft Deletes**: Usar `deleted_at` ao invés de DELETE
3. **Auditoria**: Campos `created_at`, `updated_at`, `created_by`, `updated_by`
4. **Versionamento**: Documentos mantêm histórico completo

## Schema Completo

### 1. Tenants (Produtores/Propriedades)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- para subdomain
  
  -- Plano e Status
  plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, basic, premium, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled, trial
  trial_ends_at TIMESTAMP,
  
  -- Limites do plano
  max_users INTEGER NOT NULL DEFAULT 3,
  max_documents INTEGER NOT NULL DEFAULT 100,
  max_storage_gb INTEGER NOT NULL DEFAULT 1,
  
  -- Uso atual
  current_users INTEGER NOT NULL DEFAULT 1,
  current_documents INTEGER NOT NULL DEFAULT 0,
  current_storage_bytes BIGINT NOT NULL DEFAULT 0,
  
  -- Configurações
  settings JSONB DEFAULT '{}',
  
  -- Contato e Billing
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_document VARCHAR(50), -- CPF/CNPJ
  billing_address JSONB,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Índices
  CONSTRAINT valid_plan CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'cancelled', 'trial'))
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
```

### 2. Users (Usuários e Dependentes)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Autenticação
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP,
  
  -- Perfil
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  
  -- Hierarquia (para dependentes)
  is_dependent BOOLEAN NOT NULL DEFAULT false,
  parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Permissões
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- owner, admin, manager, user, reader
  permissions JSONB DEFAULT '[]',
  
  -- Notificações
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "whatsapp": false,
    "browser": true,
    "alert_days_before": [7, 30]
  }',
  
  -- Segurança
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMP,
  last_login_ip INET,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'user', 'reader')),
  CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_parent ON users(parent_user_id) WHERE deleted_at IS NULL;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 3. Categories (Categorias de Documentos)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Hierarquia
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Informações
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'folder',
  description TEXT,
  color VARCHAR(7), -- hex color
  
  -- Ordem de exibição
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Compartilhamento (grupos que podem acessar)
  shared_with_group_ids UUID[] DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON categories(parent_id) WHERE deleted_at IS NULL;

-- Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_categories ON categories
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 4. Document Types (Tipos de Documentos)

```sql
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Validações
  required_fields JSONB DEFAULT '[]', -- campos obrigatórios
  allowed_extensions VARCHAR[] DEFAULT '{pdf,jpg,png,doc,docx}',
  max_file_size_mb INTEGER DEFAULT 10,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_document_types_tenant ON document_types(tenant_id);
CREATE INDEX idx_document_types_category ON document_types(category_id);

-- Row Level Security
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_document_types ON document_types
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 5. Documents (Documentos)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  category_id UUID NOT NULL REFERENCES categories(id),
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Arquivo atual
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- path no storage
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Versionamento
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Expiração
  expires_at TIMESTAMP,
  alert_days_before INTEGER DEFAULT 30,
  last_alert_sent_at TIMESTAMP,
  
  -- Metadados customizados
  metadata JSONB DEFAULT '{}',
  
  -- Tags para busca
  tags VARCHAR[] DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_category ON documents(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_owner ON documents(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_expires ON documents(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- Full text search
CREATE INDEX idx_documents_search ON documents USING GIN(
  to_tsvector('portuguese', name || ' ' || COALESCE(description, ''))
);

-- Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_documents ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 6. Document Versions (Versões de Documentos)

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Versão
  version INTEGER NOT NULL,
  
  -- Arquivo
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Mudanças
  change_notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_document_version UNIQUE (document_id, version)
);

CREATE INDEX idx_document_versions_tenant ON document_versions(tenant_id);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);

-- Row Level Security
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_document_versions ON document_versions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 7. Groups (Grupos de Acesso)

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Membros
  member_user_ids UUID[] DEFAULT '{}',
  
  -- Categorias acessíveis
  category_ids UUID[] DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_groups_tenant ON groups(tenant_id) WHERE deleted_at IS NULL;

-- Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_groups ON groups
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 8. Audit Logs (Logs de Auditoria)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Ação
  action VARCHAR(50) NOT NULL, -- upload, download, view, delete, create, update, login, logout
  
  -- Usuário
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  user_ip INET,
  
  -- Recurso afetado
  resource_type VARCHAR(50) NOT NULL, -- document, category, group, user, auth
  resource_id UUID,
  resource_name VARCHAR(255),
  
  -- Detalhes
  details JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_action CHECK (action IN ('upload', 'download', 'view', 'delete', 'create', 'update', 'login', 'logout')),
  CONSTRAINT valid_resource_type CHECK (resource_type IN ('document', 'category', 'group', 'user', 'auth'))
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Particionamento por data (para performance)
-- CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 9. Notifications (Notificações)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Destinatário
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Documento relacionado
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  document_name VARCHAR(255),
  
  -- Tipo e Status
  type VARCHAR(50) NOT NULL, -- email, whatsapp, browser
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed
  
  -- Conteúdo
  message TEXT NOT NULL,
  
  -- Expiração
  expires_at TIMESTAMP,
  days_until_expiration INTEGER,
  
  -- Envio
  sent_at TIMESTAMP,
  error_message TEXT,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN ('email', 'whatsapp', 'browser')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_notifications ON notifications
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 10. Subscriptions (Assinaturas e Pagamentos)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Plano
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, cancelled, past_due, trialing
  
  -- Valores
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  
  -- Período
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  
  -- Gateway de pagamento
  payment_gateway VARCHAR(50), -- stripe, mercadopago
  gateway_subscription_id VARCHAR(255),
  gateway_customer_id VARCHAR(255),
  
  -- Cancelamento
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_plan CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

### 11. Invoices (Faturas)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Número da fatura
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Valores
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  
  -- Status
  status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
  
  -- Datas
  issued_at TIMESTAMP NOT NULL,
  due_at TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  
  -- Gateway
  payment_gateway VARCHAR(50),
  gateway_invoice_id VARCHAR(255),
  
  -- PDF
  pdf_url TEXT,
  
  -- Auditoria
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'))
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_at);
```

## Funções e Triggers

### 1. Atualizar updated_at automaticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas relevantes
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... repetir para outras tabelas
```

### 2. Validar limites do plano

```sql
CREATE OR REPLACE FUNCTION check_tenant_limits()
RETURNS TRIGGER AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  SELECT * INTO tenant_record FROM tenants WHERE id = NEW.tenant_id;
  
  -- Verificar limite de documentos
  IF TG_TABLE_NAME = 'documents' THEN
    IF tenant_record.current_documents >= tenant_record.max_documents THEN
      RAISE EXCEPTION 'Limite de documentos atingido para o plano %', tenant_record.plan;
    END IF;
  END IF;
  
  -- Verificar limite de usuários
  IF TG_TABLE_NAME = 'users' THEN
    IF tenant_record.current_users >= tenant_record.max_users THEN
      RAISE EXCEPTION 'Limite de usuários atingido para o plano %', tenant_record.plan;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_document_limits BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION check_tenant_limits();

CREATE TRIGGER check_user_limits BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION check_tenant_limits();
```

### 3. Atualizar contadores do tenant

```sql
CREATE OR REPLACE FUNCTION update_tenant_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'documents' THEN
      UPDATE tenants 
      SET current_documents = current_documents + 1,
          current_storage_bytes = current_storage_bytes + NEW.file_size_bytes
      WHERE id = NEW.tenant_id;
    ELSIF TG_TABLE_NAME = 'users' THEN
      UPDATE tenants 
      SET current_users = current_users + 1
      WHERE id = NEW.tenant_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'documents' THEN
      UPDATE tenants 
      SET current_documents = current_documents - 1,
          current_storage_bytes = current_storage_bytes - OLD.file_size_bytes
      WHERE id = OLD.tenant_id;
    ELSIF TG_TABLE_NAME = 'users' THEN
      UPDATE tenants 
      SET current_users = current_users - 1
      WHERE id = OLD.tenant_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_document_counter 
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_tenant_counters();

CREATE TRIGGER update_tenant_user_counter 
  AFTER INSERT OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION update_tenant_counters();
```

## Queries Comuns

### 1. Buscar documentos expirando

```sql
SELECT d.*, c.name as category_name, u.name as owner_name
FROM documents d
JOIN categories c ON d.category_id = c.id
JOIN users u ON d.owner_user_id = u.id
WHERE d.tenant_id = $1
  AND d.deleted_at IS NULL
  AND d.expires_at IS NOT NULL
  AND d.expires_at <= NOW() + INTERVAL '30 days'
ORDER BY d.expires_at ASC;
```

### 2. Relatório de uso do tenant

```sql
SELECT 
  t.name as tenant_name,
  t.plan,
  t.current_users,
  t.max_users,
  t.current_documents,
  t.max_documents,
  ROUND(t.current_storage_bytes / 1024.0 / 1024.0 / 1024.0, 2) as storage_gb,
  t.max_storage_gb,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT u.id) as total_users
FROM tenants t
LEFT JOIN documents d ON d.tenant_id = t.id AND d.deleted_at IS NULL
LEFT JOIN users u ON u.tenant_id = t.id AND u.deleted_at IS NULL
WHERE t.id = $1
GROUP BY t.id;
```

### 3. Auditoria de ações do usuário

```sql
SELECT 
  al.action,
  al.resource_type,
  al.resource_name,
  al.created_at,
  al.user_ip
FROM audit_logs al
WHERE al.tenant_id = $1
  AND al.user_id = $2
  AND al.created_at >= NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC
LIMIT 100;
```

## Backup e Recovery

### Estratégia de Backup

```bash
# Backup diário completo
pg_dump -h localhost -U postgres -d acdocs_production > backup_$(date +%Y%m%d).sql

# Backup por tenant (para restauração individual)
pg_dump -h localhost -U postgres -d acdocs_production \
  --table=tenants --table=users --table=documents \
  --where="tenant_id='$TENANT_ID'" > tenant_backup_$TENANT_ID.sql
```

### Retenção
- Diário: 7 dias
- Semanal: 4 semanas
- Mensal: 12 meses

---

**Documento criado em**: 24/02/2026
**Versão**: 1.0
