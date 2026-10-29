# Health Control

Aplicação pessoal de alimentação, hidratação e treino, em português, com interface verde, creme e sálvia. Feita com React 19, TypeScript e Vite. Inclui cadastro por e-mail e senha, confirmação de e-mail, recuperação de senha e registros por conta usando Supabase. Sem as variáveis do Supabase, preserva a versão local do navegador; o formulário informa que o acesso por conta ainda não está ativo.

**Site publicado:** https://health-control-eight.vercel.app

O projeto Supabase `health-control` está conectado no plano Free, região São Paulo. A migração e os testes reais de login, isolamento e revisões passaram na Vercel. Para o teste inicial sem domínio/SMTP, o usuário escolheu cadastro sem confirmação de e-mail. É necessário desativar Confirm email no painel Supabase; o código não altera essa configuração. A recuperação por e-mail fica oculta por padrão. Os testes automatizados não validam entrega de e-mail.

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

Em outra máquina, use o diretório em que clonou o projeto. O cache explícito é útil no ambiente em nuvem, onde o diretório pessoal não é gravável. Para usar contas, configure o Supabase conforme a seção abaixo. Sem essa configuração, o modo local continua disponível.

```bash
npm test             # Testes de cálculos, dados, busca, datas e geração de treinos
npm run build        # TypeScript, site em dist/ e HTML independente em portable/
npm run build:web    # Apenas o site para hospedagem na Vercel
npm run build:portable # Gerar apenas o HTML independente
npm run preview      # Servir o build para validação local
npm run test:e2e     # Fluxos locais e acessibilidade em desktop e celular
npm run test:auth    # Contratos HTTP de autenticação e sincronização (Supabase simulado)
```

Os testes de navegador usam o Chromium em `/usr/bin/chromium`, se disponível. Em outros sistemas, instale o navegador com `npx playwright install chromium`, ou indique um Chromium existente em `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O Playwright inicia o servidor Vite quando necessário. A verificação automatizada de acessibilidade não substitui testes manuais com tecnologias assistivas.

## Prévia online na Vercel

O repositório inclui `vercel.json` com o framework Vite, instalação pelo lockfile, migração transacional seguida de `npm run build:web` e saída em `dist`. A versão portátil não é necessária para hospedar o site.

O projeto existente na Vercel é `inwtn/health-control`, publicado em https://health-control-eight.vercel.app. A produção permite acesso público; as prévias de outras branches mantêm a autenticação da Vercel. As contas exigem as variáveis públicas do projeto Supabase e a migração SQL descritas abaixo. Não adicione chaves administrativas ao frontend.

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
- Cadastro, login, confirmação de e-mail, recuperação e troca de senha, saída da conta.
- Armazenamento por usuário com RLS no Supabase e controle de revisão para detectar alterações concorrentes. A tela mantém alterações ainda não salvas quando a conexão falha, oferece nova tentativa e alerta ao sair.
- Modo local sem configuração do Supabase; importação explícita dos registros anteriores para uma conta vazia.
- Exportação JSON e exclusão de registros com confirmação. Conteúdo inválido no armazenamento é preservado para exportação, sem sobrescrita automática.

## Cálculos e limites

O metabolismo basal é estimado pela fórmula Mifflin–St Jeor (1990). O gasto total aplica um fator de atividade de 1,2 a 1,725. Frequência e intensidade de exercício não descrevem perfeitamente o movimento diário; o usuário pode ajustar o nível sugerido.

Para adultos na faixa de aplicação do estimador e sem condições que exijam acompanhamento, a meta usa manutenção, déficit de 15% ou acréscimo de 10%, com limites automáticos de 1.200/1.500 kcal. Esses limites não garantem adequação individual. Proteína: 1,4–1,6 g/kg, limitada a 35% da energia. Gordura: 30%. Carboidratos: restante da energia. As porções dos exemplos são arredondadas a 5 g, portanto a energia e os macros das sugestões não coincidem necessariamente com as metas.

Menores de 18 anos, gestação, amamentação, condições declaradas e IMC fora da faixa de aplicação (abaixo de 18,5 ou a partir de 40) não recebem dieta automática. Restrições declaradas e idade abaixo de 18 anos bloqueiam a rotina automática de treino. Os diários continuam disponíveis. Não há avaliação clínica, verificação automática de alergênicos, prescrição profissional ou promessa de prazo para resultados.

Os dados alimentares vêm da TACO, NEPA/UNICAMP, 4ª edição (2011), digitalizada pelo projeto `taco-api`. A base não contém todos os nutrientes existentes. Ausências são preservadas como `null`, não substituídas por zero; os totais parciais são sinalizados. Traços foram arredondados para zero na digitalização de origem. RE, RAE e retinol expressam vitamina A de formas diferentes e não são somados. Consulte [origem e licença dos dados](src/data/SOURCES.md).

## Configurar contas com Supabase

1. Crie/conecte um projeto Supabase ao projeto Vercel existente, no plano Free. Pela CLI autenticada: `vercel integration add supabase --name health-control --billing-plan free --meta region=gru1 --meta publicEnvVarPrefix=VITE_ --environment production --environment development --no-env-pull --scope inwtn`. O titular precisa aceitar os termos do serviço no navegador quando a Vercel solicitar. O recurso é provisionado pela integração; o build prepara suas tabelas.
2. A Vercel executa `npm run db:migrate` antes do build, usando `POSTGRES_URL_NON_POOLING` (ou `POSTGRES_URL`) fornecido pela integração. O script aplica [a migração](supabase/migrations/202610290001_health_records.sql) em transação, com lock, histórico e checksum; reexecuções ignoram versões já aplicadas. A conexão verifica o certificado oficial do Supabase e o hostname. A migração cria a tabela, habilita RLS, restringe cada operação ao `auth.uid()` e remove acesso anônimo. Não edite migrações aplicadas: adicione novos arquivos versionados. Para validar as regras reais em um projeto de desenvolvimento, execute [o teste SQL](supabase/checks/ownership.sql), que usa transação e desfaz seus dados fictícios. Testes de navegador com HTTP simulado não validam as políticas do banco. Um build com `HC_VALIDATE_AUTH=1` também executa essas verificações reais, cria duas contas fictícias confirmadas para testar login, isolamento pela API REST e revisões e apaga essas contas ao terminar. Não envia e-mails nem valida a entrega de confirmação/recuperação. Variáveis administrativas permanecem somente no processo do build.
3. Em **Authentication → URL Configuration**, defina Site URL como `https://health-control-eight.vercel.app` e permita essa URL nos redirects. Adicione a origem de desenvolvimento apenas se for usá-la. Para o modo de teste sem envio, desative **Confirm email** em Authentication → Sign In / Providers → Email. O cadastro entra imediatamente e não verifica a propriedade do e-mail. Para usar confirmação/recuperação, configure Email/Password com confirmação de e-mail e senha mínima de 8 caracteres e configure SMTP para envio de confirmação e recuperação a usuários do público: o remetente padrão do Supabase tem limites e restrições de destinatários. Valide os links com uma conta de teste antes de abrir cadastros ao público. Depois de configurar SMTP e URLs, ative `VITE_AUTH_EMAIL_ENABLED=true` e publique novamente para exibir Esqueci minha senha. Sem isso, a recuperação fica oculta e a tela informa a limitação.
4. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY`) na Vercel e em `.env.local` para desenvolvimento, conforme [.env.example](.env.example). São configurações públicas; a proteção dos registros é feita pelas políticas do banco. **Nunca use `service_role`, senhas de banco ou tokens administrativos em uma variável `VITE_*`.**
5. Gere novo build/publicação para incorporar as configurações públicas. Valide cadastro, recebimento e confirmação do e-mail, login em dois dispositivos, recuperação, saída e isolamento entre duas contas. A autenticação exige conexão e está disponível no site hospedado. A versão portátil preserva o modo local/offline, mesmo quando o ambiente tem configurações do Supabase.

A sessão é gerenciada pelo SDK oficial, com renovação de token. A senha não é salva no estado da aplicação nem nos registros de saúde. Os registros autenticados são carregados do banco, sem cópia automática em `localStorage`; um erro de leitura impede abrir o painel e não cria um registro vazio sobre os dados anteriores. Gravações usam a revisão lida, evitando substituir silenciosamente alterações de outra aba/dispositivo. Em um conflito, exporte as alterações e recarregue antes de continuar.

## Dados pessoais

No modo local, a chave `health-control:v1` é preservada. Ao entrar em uma conta, esses dados não são importados automaticamente. Em Meu perfil, a pessoa pode confirmar a importação para uma conta sem registros. A cópia antiga permanece no navegador; exporte-a e remova-a nas configurações do navegador quando deixar de precisar dela, especialmente em um dispositivo compartilhado.

No modo por conta, nome de cadastro, e-mail e sessão são gerenciados pelo Supabase Auth; perfil e históricos ficam em `public.health_records`, vinculados ao ID autenticado. O cadastro registra a concordância com o armazenamento dos dados informados. A exportação JSON contém os registros pessoais e de saúde, sem a senha. A exclusão disponível em Meu perfil limpa esses registros após a confirmação de salvamento; mantém a conta de acesso. A interface não implementa exclusão da conta Auth ou importação de arquivos JSON.

## Estrutura

```text
src/components/   Componentes e formulários compartilhados
src/pages/        Visão geral, plano, diário, biblioteca, treinos e perfil
src/lib/          Tipos, regras de cálculo e testes unitários
src/data/         Composição alimentar e atribuição
src/auth/         Cadastro, login, recuperação e sessão
src/store.tsx     Estado local e sincronização da conta
supabase/         Migração de banco e teste real de isolamento com RLS
tests/            Testes de fluxos e acessibilidade com Playwright
```

Nas tarefas em nuvem, use o checkout existente: cada tarefa já é isolada; não crie um Git worktree sem pedido explícito.
