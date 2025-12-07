# Análise e Plano de Refatoração do Projeto AURA OS

## 1. Visão Geral da Arquitetura Atual

O AURA OS é um assistente de IA controlado por voz, construído com uma arquitetura moderna, porém com pontos de melhoria significativos.

- **Frontend**: React (com TypeScript) e Electron.
- **Gerenciamento de Estado**: Zustand (`store.ts`), atuando como um "cérebro" central que contém não apenas o estado, mas também uma quantidade considerável de lógica de negócios e acesso a dados.
- **Backend**: Supabase, com chamadas diretas sendo feitas a partir do frontend (especificamente do `store.ts`).
- **Servidor Adicional**: Um servidor Node.js (`server/server.js`) cuja função primária parece ser um proxy para a API de notícias.
- **Core da IA**: O serviço `geminiLive.ts` gerencia a complexa comunicação bidirecional de áudio com a API Google Gemini, orquestrando as "ferramentas" que a IA pode usar para interagir com a UI.

Embora funcional, essa arquitetura apresenta desafios em termos de acoplamento, segurança e escalabilidade. O plano a seguir visa abordar esses pontos.

---

## 2. Plano de Refatoração

### Proposta 1: Extrair Lógica de Negócios do `store.ts`

**Problema:** O arquivo `store.ts` está sobrecarregado. Ele mistura a definição do estado, as ações de manipulação (setters) e a lógica de acesso a dados (chamadas diretas ao Supabase). Isso viola o princípio de responsabilidade única, tornando o store difícil de testar e manter.

**Solução:** Isolar a lógica de acesso a dados em "serviços" dedicados. O store será responsável por orquestrar as chamadas a esses serviços e atualizar o estado, mas não por conhecer os detalhes de implementação do backend.

**Exemplo Prático:**

**Antes (em `store.ts`):**
```typescript
// store.ts
import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

// ... (outras props do store)
export const useAuraStore = create((set) => ({
  shoppingList: [],
  addShoppingItem: async (itemName: string) => {
    const { data, error } = await supabase
      .from('shopping_list')
      .insert([{ name: itemName, user_id: '...' }])
      .select();
    if (data) {
      set((state) => ({ shoppingList: [...state.shoppingList, ...data] }));
    }
  },
}));
```

**Depois (divisão de responsabilidades):**

**Novo arquivo `services/shoppingService.ts`:**
```typescript
// services/shoppingService.ts
import { supabase } from './supabaseClient';

export const shoppingService = {
  async addItem(itemName: string, userId: string) {
    const { data, error } = await supabase
      .from('shopping_list')
      .insert([{ name: itemName, user_id: userId }])
      .select();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
};
```

**`store.ts` refatorado:**
```typescript
// store.ts
import { create } from 'zustand';
import { shoppingService } from '../services/shoppingService';

// ...
export const useAuraStore = create((set) => ({
  shoppingList: [],
  addShoppingItem: async (itemName: string) => {
    const user = useAuraStore.getState().user; // Exemplo
    const newItem = await shoppingService.addItem(itemName, user.id);
    set((state) => ({ shoppingList: [...state.shoppingList, newItem] }));
  },
}));
```

### Proposta 2: Gerenciamento Seguro de Chaves de API

**Problema:** Chaves de API (Supabase, Google) parecem estar acessíveis no lado do cliente. Em um aplicativo Electron, isso é um risco de segurança crítico, pois o código-fonte pode ser inspecionado, expondo as chaves.

**Solução:** Mover todas as chamadas que exigem chaves de API secretas para um ambiente de backend seguro. O `server/server.js` pode ser formalizado como um proxy de API, ou, de forma mais escalável, podemos usar **Supabase Edge Functions**.

**Plano de Ação:**
1.  Identificar todas as chamadas de API externas que usam chaves secretas.
2.  Criar uma Supabase Edge Function para cada funcionalidade (ex: `news-proxy`, `analyze-image`).
3.  A função receberá a requisição do cliente, adicionará a chave de API (armazenada de forma segura nas variáveis de ambiente do Supabase) e encaminhará a chamada para o serviço externo.
4.  Atualizar o código do cliente para chamar a Edge Function em vez da API externa diretamente.

**Benefícios:**
- **Segurança:** As chaves secretas nunca saem do ambiente do Supabase.
- **Manutenibilidade:** Centraliza a lógica de acesso a APIs de terceiros.

### Proposta 3: Fortalecer a Tipagem das Ferramentas da IA

**Problema:** A comunicação entre a IA (`geminiLive.ts`) e a aplicação (`store.ts`, `SurfaceManager.tsx`) baseia-se em nomes de funções e parâmetros passados como strings ou objetos genéricos. Isso é frágil e propenso a erros se a "assinatura" de uma ferramenta mudar.

**Solução:** Definir interfaces TypeScript estritas para cada ferramenta que a IA pode invocar.

**Exemplo Prático:**

**Criar um arquivo `types.ts` ou `toolbelt.types.ts`:**
```typescript
// types.ts

export enum AiTool {
  UpdateSurface = 'updateSurface',
  AddShoppingItem = 'addShoppingItem',
  // ... outros nomes de ferramentas
}

export type ToolCall = {
  tool: AiTool;
  args: any; // Genérico por enquanto
};

// Tipos específicos para os argumentos de cada ferramenta
export interface UpdateSurfaceArgs {
  surface: 'shopping' | 'agenda' | 'weather' | 'news';
}

export interface AddShoppingItemArgs {
  item: string;
  quantity?: number;
}
```

**Em `geminiLive.ts`:**
```typescript
// geminiLive.ts
import { AiTool, UpdateSurfaceArgs } from '../types';

// ...
// Dentro do 'onmessage' que recebe as ferramentas da IA
const toolCall = JSON.parse(response.functionCall.name); // Exemplo hipotético

if (toolCall.tool === AiTool.UpdateSurface) {
  const toolArgs = toolCall.args as UpdateSurfaceArgs;
  // Agora 'toolArgs.surface' tem autocomplete e checagem de tipo
  useAuraStore.getState().updateSurface(toolArgs.surface);
}
```

---

## 3. Próximos Passos

1.  **Priorização:** Recomendo começar pela **Proposta 1**, pois ela estrutura a base para as demais mudanças e traz ganhos imediatos de organização.
2.  **Execução Incremental:** Aplicar a refatoração serviço por serviço (`shopping`, `agenda`, etc.) para minimizar o risco.
3.  **Segurança em Primeiro Lugar:** A **Proposta 2** deve ser tratada com alta prioridade para proteger as credenciais da aplicação.
4.  **Testes:** Após a refatoração de cada módulo, criar testes unitários para os novos serviços isolados.

Este plano fornecerá uma base mais robusta, segura e escalável para o futuro do AURA OS.
