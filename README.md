# Health Control

Aplicação pessoal de alimentação, hidratação e treino, em português, com interface verde, creme e sálvia. Feita com React 19, TypeScript e Vite. A primeira versão funciona no navegador, sem conta ou backend.

**Site publicado:** https://health-control-eight.vercel.app

## Executar

### Abrir a aplicação

O `index.html` da raiz é a entrada de desenvolvimento do React e depende do Vite para processar TypeScript. Para desenvolver, instale as dependências conforme abaixo e execute `npm start`; abra no navegador o endereço informado pelo terminal.

Para abrir como um arquivo HTML, execute `npm run build` e abra **`portable/index.html`**. Essa versão contém o JavaScript, os estilos, as fontes, os alimentos e as imagens no próprio arquivo, sem precisar manter um servidor ligado. Após o build, abrir o `index.html` da raiz por `file:` encaminha para essa versão pronta. Execute o build novamente após editar o código. Se o navegador ou a pré-visualização bloquear arquivos locais, baixe o HTML e use um navegador que permita arquivos locais, ou execute a aplicação com o Vite em um contexto autorizado.

Os registros do navegador são vinculados à origem e ao caminho do arquivo: a versão portátil e o servidor não compartilham automaticamente os dados. Exporte uma cópia antes de trocar de versão ou mover o arquivo.

Requer Node.js 22.12+ (validado com Node.js 24) e npm.

```bash
cd /workspace/Health-Control
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev -- --port 5173
```

Em outra máquina, use o diretório em que clonou o projeto. O cache explícito é útil no ambiente em nuvem, onde o diretório pessoal não é gravável. Não há variáveis de ambiente ou credenciais obrigatórias.

```bash
npm test             # Testes de cálculos, dados, busca, datas e geração de treinos
npm run build        # TypeScript, site em dist/ e HTML independente em portable/
npm run build:web    # Apenas o site para hospedagem na Vercel
npm run build:portable # Gerar apenas o HTML independente
npm run preview      # Servir o build para validação local
npm run test:e2e     # Fluxos completos e acessibilidade em desktop e celular
```

Os testes de navegador usam o Chromium em `/usr/bin/chromium`, se disponível. Em outros sistemas, instale o navegador com `npx playwright install chromium`, ou indique um Chromium existente em `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O Playwright inicia o servidor Vite quando necessário. A verificação automatizada de acessibilidade não substitui testes manuais com tecnologias assistivas.

## Prévia online na Vercel

O repositório inclui `vercel.json` com o framework Vite, instalação pelo lockfile, comando `npm run build:web` e saída em `dist`. A versão portátil não é necessária para hospedar o site.

O projeto existente na Vercel é `inwtn/health-control`, publicado em https://health-control-eight.vercel.app. A produção permite acesso público; as prévias de outras branches mantêm a autenticação da Vercel. Nenhum segredo de aplicação é necessário para esta versão.

Para ativar as atualizações pelo GitHub, instale o aplicativo oficial https://github.com/apps/vercel na conta `Inwtn`, concedendo acesso ao repositório `Health-Control`, e conecte esse repositório ao projeto Vercel existente. Com a integração conectada, envios à branch `main` atualizam o site; outras branches podem gerar prévias. A publicação do ambiente Codex é separada da publicação do site.

Use o endereço estável de produção para manter os registros no mesmo navegador. Os endereços individuais de cada deployment possuem origens diferentes e não compartilham automaticamente o `localStorage`.

Se a publicação for executada por CLI dentro do ambiente em nuvem, o acesso à API `api.vercel.com` e a autenticação da sua conta precisam estar disponíveis. Faça login pelo fluxo oficial da Vercel ou configure as credenciais nas configurações seguras do ambiente, nunca no código ou no chat. A importação pelo navegador da sua conta permite conectar GitHub e Vercel sem armazenar um token neste projeto.

## Funcionalidades

- Perfil: idade, sexo para a equação, peso, altura, frequência semanal, intensidade da rotina, objetivo e preferência alimentar.
- Estimativas separadas de metabolismo basal, gasto energético diário e meta de energia, com fórmula e premissas visíveis.
- Sugestões de quatro refeições, ajustadas em energia e às preferências variada, vegetariana ou vegana. Macros reais do exemplo são apresentados separadamente das metas.
- Busca de 597 alimentos, valores por 100 g, consulta de macros e micronutrientes disponíveis e registro por quantidade em gramas.
- Diário por data, com soma de nutrientes, sinalização de dados incompletos e exclusão de registros.
- Água: atalhos de 200, 350 e 500 ml, volume personalizado, meta ajustável, histórico e exclusão por dia.
- Questionário de treino: dias, experiência, duração, equipamento, foco e restrições; rotina com séries, repetições, descanso, recuperação e marcações por data.
- Persistência local, exportação JSON e exclusão de dados com confirmação. Conteúdo inválido no armazenamento é preservado para exportação, sem sobrescrita automática.

## Cálculos e limites

O metabolismo basal é estimado pela fórmula Mifflin–St Jeor (1990). O gasto total aplica um fator de atividade de 1,2 a 1,725. Frequência e intensidade de exercício não descrevem perfeitamente o movimento diário; o usuário pode ajustar o nível sugerido.

Para adultos na faixa de aplicação do estimador e sem condições que exijam acompanhamento, a meta usa manutenção, déficit de 15% ou acréscimo de 10%, com limites automáticos de 1.200/1.500 kcal. Esses limites não garantem adequação individual. Proteína: 1,4–1,6 g/kg, limitada a 35% da energia. Gordura: 30%. Carboidratos: restante da energia. As porções dos exemplos são arredondadas a 5 g, portanto a energia e os macros das sugestões não coincidem necessariamente com as metas.

Menores de 18 anos, gestação, amamentação, condições declaradas e IMC fora da faixa de aplicação (abaixo de 18,5 ou a partir de 40) não recebem dieta automática. Restrições declaradas e idade abaixo de 18 anos bloqueiam a rotina automática de treino. Os diários continuam disponíveis. Não há avaliação clínica, verificação automática de alergênicos, prescrição profissional ou promessa de prazo para resultados.

Os dados alimentares vêm da TACO, NEPA/UNICAMP, 4ª edição (2011), digitalizada pelo projeto `taco-api`. A base não contém todos os nutrientes existentes. Ausências são preservadas como `null`, não substituídas por zero; os totais parciais são sinalizados. Traços foram arredondados para zero na digitalização de origem. RE, RAE e retinol expressam vitamina A de formas diferentes e não são somados. Consulte [origem e licença dos dados](src/data/SOURCES.md).

## Dados pessoais e próximos passos

Tudo é salvo em `localStorage`, na chave `health-control:v1`. Não há sincronização entre dispositivos. Limpar o navegador remove os registros. O JSON exportado contém dados pessoais; a importação ainda não está implementada. Use dados fictícios em dispositivos compartilhados e nos testes.

Para transformar esta versão em um serviço com múltiplos usuários, serão necessários autenticação, backend, armazenamento seguro, consentimento e política de privacidade, além de revisão profissional das recomendações. A hospedagem do site estático não adiciona sincronização dos dados pessoais.

## Estrutura

```text
src/components/   Componentes e formulários compartilhados
src/pages/        Visão geral, plano, diário, biblioteca, treinos e perfil
src/lib/          Tipos, regras de cálculo e testes unitários
src/data/         Composição alimentar e atribuição
src/store.tsx     Estado e persistência no navegador
tests/            Testes de fluxos e acessibilidade com Playwright
```

Nas tarefas em nuvem, use o checkout existente: cada tarefa já é isolada; não crie um Git worktree sem pedido explícito.
