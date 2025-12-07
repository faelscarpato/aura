# Análise Completa e Plano de Ação - AURA OS

## 1. Diagnóstico do Projeto

### 🚨 Bugs e Problemas Críticos

1.  **Gargalo de Performance (Renderização)**:
    - **Local**: `App.tsx` (linhas 76-78)
    - **Problema**: O evento `onMouseMove={registerActivity}` no elemento raiz dispara centenas de vezes por segundo. Ele chama `registerActivity` no store, que chama `set` e atualiza o estado `lastActivityAt`.
    - **Impacto**: Isso força o React a verificar re-renderizações na árvore inteira constantemente sempre que o mouse mexe. É a causa provável de lentidão ou "engasgos" na UI.
    - **Correção**: Usar `debounce` ou `throttle` no handler, ou mover essa lógica para fora do ciclo de renderização do React (ex: listener nativo no `window` com throttle).

2.  **API de Áudio Depreciada**:
    - **Local**: `services/geminiLive.ts`
    - **Problema**: Uso de `createScriptProcessor`.
    - **Impacto**: Essa API roda na thread principal (UI), causando travamentos no áudio quando a interface está ocupada e vice-versa. Além disso, está depreciada pelos navegadores.
    - **Correção**: Migrar para `AudioWorklet`.

3.  **Vazamento de Memória Potencial (Cleanup)**:
    - **Local**: `services/geminiLive.ts`
    - **Problema**: A limpeza no `disconnect` pode não estar parando todas as faixas ou fechando o contexto na ordem correta, especialmente se a conexão cair abruptamente.

### ⚠️ Problemas de Arquitetura

1.  **Store "Deus" (`store.ts`)**:
    - O arquivo `store.ts` tem **440 linhas** e cresce rápido. Ele mistura:
        - Estado de UI (modais, surfaces)
        - Lógica de Negócios (carrinho, agenda)
        - Chamadas de API (Supabase, Gemini)
        - Lógica de Geolocalização
    - **Impacto**: Difícil de manter, testar e debugar. Qualquer mudança pequena recompila tudo que depende do store.

2.  **Segurança de Chaves de API**:
    - As chaves estão sendo injetadas via `define` no Vite (`vite.config.ts`). Embora funcione, expõe as chaves no bundle final do cliente. Se o app for distribuído como web, qualquer um pode roubar a chave do Gemini.

3.  **Tipagem Fraca (TypeScript)**:
    - Muitos usos de `any` em `geminiLive.ts` (ex: `msg.toolCall`, argumentos de ferramentas). Isso anula os benefícios do TypeScript e pode causar erros em tempo de execução se a IA alucinar parâmetros.

---

## 2. Plano de Ação (Agents)

Este plano divide o trabalho em "Agentes" ou fases lógicas para execução.

### 🟢 Fase 1: Estabilização e Performance (Prioridade Alta)

**Objetivo**: Resolver os problemas de renderização e bugs críticos.

1.  **Otimizar `App.tsx`**:
    - Remover `onMouseMove` direto do JSX.
    - Implementar um `useIdleTimer` hook que usa `window.addEventListener` com `throttle` (ex: atualizar a cada 1s ou 5s, não a cada pixel).
2.  **Refatorar `SurfaceManager`**:
    - Garantir que animações de entrada/saída não causem *layout shift* ou re-renderizações duplas.

### 🟡 Fase 2: Refatoração da Arquitetura (Store)

**Objetivo**: Quebrar o `store.ts` em fatias (slices) ou stores separados.

1.  **Criar Slices**:
    - `useUIStore`: Apenas estado visual (isSettingsOpen, activeSurface).
    - `useDataStore`: Dados do usuário (shoppingList, agenda, tasks).
    - `useSessionStore`: Estado da sessão atual (auth, conexões).
2.  **Mover Lógica para Services**:
    - Garantir que o store apenas chame `TasksService.add()` e atualize o estado com o resultado, sem lógica complexa dentro do `set`.

### 🔵 Fase 3: Modernização do Core de IA

**Objetivo**: Melhorar a robustez do `geminiLive.ts`.

1.  **Migrar para AudioWorklet**:
    - Criar um processador de áudio em worker separado para garantir que a voz não falhe mesmo se a UI travar.
2.  **Tipagem Estrita**:
    - Criar interfaces Zod ou Typescript para cada ferramenta (`ToolCall`, `ToolArgs`).
    - Validar os dados vindos da IA antes de executar a ação.

---

## 3. Resumo das Melhorias Visuais Sugeridas

- **Feedback Visual de Voz**: O `VoiceOrb` pode ter uma resposta mais fluida baseada na amplitude do áudio (já existe `analyserNode`, mas pode ser melhorado visualmente).
- **Transições de Surface**: Usar `AnimatePresence` (framer-motion) ou CSS transitions mais robustas para evitar que o conteúdo "pule" ao trocar de Shopping para Agenda.

## 4. Próximo Passo Recomendado

Iniciar pela **Fase 1**, corrigindo o `onMouseMove` no `App.tsx`, pois é uma mudança pequena com alto impacto na percepção de qualidade do app.
