# Database Integration com React Query

## 📋 Visão Geral

Este projeto implementa um sistema completo de banco de dados interno usando **IndexedDB** com **React Query** para cache e revalidação automática. Isso cria uma base sólida para quando você implementar o backend real.

## 🏗️ Arquitetura

### 1. Camada de Banco de Dados (IndexedDB)
- **Schema**: `lib/db/schema.ts` - Define a estrutura do banco
- **Operations**: `lib/db/operations.ts` - CRUD operations para todas as entidades
- **Seeding**: Inicialização automática com dados mock

### 2. Camada de Queries (React Query)
- **Users**: `lib/queries/users.ts`
- **Groups**: `lib/queries/groups.ts`
- **Categories**: `lib/queries/categories.ts`
- **Documents**: `lib/queries/documents.ts`
- **Audit**: `lib/queries/audit.ts`

### 3. Provider Setup
- **QueryProvider**: `lib/providers/query-provider.ts`
- **DevTools**: React Query DevTools habilitado
- **Auto-seeding**: Banco inicializado automaticamente

## 🚀 Como Usar

### Exemplo: Página de Usuários

```tsx
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/queries/users';

export function UsersPage() {
  // Queries
  const { data: users = [], isLoading, error } = useUsers();
  
  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleCreate = async (userData) => {
    try {
      await createUser.mutateAsync(userData);
      toast.success('Usuário criado!');
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  if (isLoading) return <UsersSkeleton />;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## 🔄 Cache e Revalidação

### Configuração Automática
- **Stale Time**: 5 minutos (dados considerados "frescos")
- **GC Time**: 10 minutos (tempo no cache após não usar)
- **Auto-refetch**: Em reconexão e foco da janela
- **Retry**: 3 tentativas com lógica inteligente

### Invalidação Inteligente
```tsx
// Ao criar um documento, invalida:
- Todos os documentos
- Documentos da categoria específica  
- Logs de auditoria (pois cria entrada)

// Ao deletar usuário, invalida:
- Lista de usuários
- Logs de auditoria
```

### Chaves de Query Organizadas
```tsx
const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
};
```

## 📊 Funcionalidades Implementadas

### ✅ Operações CRUD Completas
- **Users**: Criar, listar, atualizar, deletar
- **Groups**: Gerenciamento de grupos e membros
- **Categories**: Categorias e tipos de documento
- **Documents**: Upload, versionamento, metadados
- **Audit**: Log automático de todas as ações

### ✅ Cache Inteligente
- **Otimistic Updates**: UI atualiza antes da confirmação
- **Background Refetch**: Dados sempre atualizados
- **Error Handling**: Rollback automático em caso de erro
- **Loading States**: Skeletons durante carregamento

### ✅ Auditoria Automática
- **Login/Logout**: Rastreamento de sessões
- **CRUD Operations**: Log de todas as mudanças
- **Metadata**: Usuário, timestamp, detalhes da ação
- **Real-time**: Logs aparecem instantaneamente

## 🔧 Configuração de Desenvolvimento

### DevTools
O React Query DevTools está habilitado em desenvolvimento:
- **Posição**: Bottom-right
- **Queries**: Visualizar estado do cache
- **Mutations**: Acompanhar operações em tempo real
- **Network**: Ver requests e responses

### Performance
```tsx
// Configurações otimizadas
staleTime: 5 * 60 * 1000,     // 5 minutos
gcTime: 10 * 60 * 1000,       // 10 minutos  
retry: 3,                      // 3 tentativas
refetchOnWindowFocus: false,   // Não refetch no foco
```

## 🚀 Migração para Backend Real

### 1. Substituir Operations
```tsx
// Atual (IndexedDB)
export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return await db.getAll('users');
}

// Futuro (API)
export async function getAllUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}
```

### 2. Manter Query Hooks
```tsx
// Os hooks permanecem iguais!
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsers, // <- Só muda a implementação
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3. Adicionar Server State
```tsx
// Para SSR/SSG
export async function getServerSideProps() {
  const queryClient = new QueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: userKeys.lists(),
    queryFn: getAllUsers,
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}
```

## 📈 Benefícios

### Para Desenvolvimento
- **Dados Persistentes**: Sobrevive a reloads
- **Offline First**: Funciona sem internet
- **Performance**: Cache inteligente reduz requests
- **DX**: DevTools para debugging

### Para Produção
- **Escalabilidade**: Fácil migração para APIs reais
- **Consistência**: Estado sincronizado entre componentes
- **UX**: Loading states e error handling
- **Auditoria**: Rastreamento completo de ações

## 🎯 Próximos Passos

1. **Implementar Backend**: Substituir operations por API calls
2. **Adicionar Websockets**: Real-time updates
3. **Implementar Upload**: File handling real
4. **Adicionar Paginação**: Para grandes datasets
5. **Implementar Search**: Full-text search no backend

## 🔍 Debugging

### Verificar Cache
```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log(queryClient.getQueryCache().getAll());
```

### Invalidar Manualmente
```tsx
// Invalidar todos os usuários
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidar usuário específico
queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
```

### Forçar Refetch
```tsx
const { refetch } = useUsers();
await refetch();
```

Esta implementação fornece uma base sólida e profissional para o desenvolvimento, com fácil migração para um backend real quando necessário.