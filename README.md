# Dona Chica: Assistente Virtual IFAC-CXA

Interface interativa para palestra em telao, com painel 16:9 e pagina de participacao por celular.

## Arquivos principais

- `painel/index.html`: tela do projetor.
- `participar/index.html`: tela da plateia no celular.
- `config.js`: local para colar as credenciais do Firebase.
- `data.js`: falas, etapas, opcoes e reacoes da Dona Chica.
- `app.js`: sincronizacao, votos, sorteio, controles e bloqueio por aparelho.
- `style.css`: identidade visual.
- `assets/`: imagens e video oficial da Dona Chica.

## Como a experiencia funciona

1. O painel abre em uma tela de boas-vindas.
2. Nessa recepcao aparece o QR Code grande para a plateia entrar pelo celular.
3. Depois que voce clica em **Iniciar apresentacao**, o QR Code sai da tela.
4. Durante a apresentacao, nao aparece mais convite para entrar. Quem entrou no comeco continua participando.
5. No fim, a Dona Chica faz a pergunta final reflexiva, mostra o resultado, chama o sorteio de livros e encerra com a mensagem de despedida.

## Publicar no GitHub Pages

Envie a pasta inteira do projeto para o GitHub. Nao envie somente os HTMLs, porque o painel depende tambem de:

- `style.css`
- `app.js`
- `data.js`
- `config.js`
- pasta `assets`
- pasta `painel`
- pasta `participar`

Depois:

1. Abra o repositorio no GitHub.
2. Entre em **Settings > Pages**.
3. Em **Build and deployment**, selecione a branch principal.
4. Escolha a pasta raiz do projeto.
5. Salve e aguarde o GitHub gerar o link publico.

O link do painel ficara parecido com:

```text
https://seu-usuario.github.io/seu-repositorio/painel/
```

O link da plateia ficara parecido com:

```text
https://seu-usuario.github.io/seu-repositorio/participar/
```

## QR Code

O QR Code aparece apenas na tela de boas-vindas do painel.

Quando o painel estiver aberto pelo link publico do GitHub Pages, o QR Code aponta automaticamente para a pagina `/participar/` do mesmo site.

Exemplo:

```text
Painel:  https://seu-usuario.github.io/seu-repositorio/painel/
Plateia: https://seu-usuario.github.io/seu-repositorio/participar/
```

Durante a apresentacao, o QR Code nao aparece mais.

## Configurar Firebase

Para testar em duas abas no mesmo computador, o modo local pode bastar. Para usar com celulares diferentes na palestra, configure o Firebase, porque ele faz a sincronizacao em tempo real entre painel e plateia.

1. Acesse o Firebase Console e crie um projeto.
2. Em **Build > Realtime Database**, crie um banco de dados.
3. Para testes iniciais, use regras abertas temporarias:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. Em **Configuracoes do projeto > Seus apps**, crie um app Web.
5. Copie o objeto `firebaseConfig`.
6. Cole os valores em `config.js`, dentro de `window.DONA_CHICA_FIREBASE_CONFIG`.

Enquanto `config.js` estiver vazio, o projeto roda em modo demonstracao local.

## Estrutura no Realtime Database

O site usa estes caminhos:

```text
sessions/default/currentStep
sessions/default/voteRound
sessions/default/warmup/responses/{optionId}
sessions/default/responses/{stepId}/{optionId}
sessions/default/participants/{anonymousId}
sessions/default/liveParticipants/{anonymousId}
sessions/default/raffle
sessions/default/logs
```

Cada celular gera um identificador anonimo. Antes da primeira interacao, o participante informa um primeiro nome curto para aparecer em **Participantes ao vivo** e concorrer ao sorteio final enquanto permanecer conectado.

## Controles do painel

Use os botoes discretos no canto inferior direito ou o teclado:

- `N`: proxima etapa.
- `B`: voltar etapa.
- `R`: resetar respostas da etapa atual e liberar novo voto nos celulares.
- `T`: resetar toda a apresentacao, voltar para a tela de recepcao e colocar a plateia na sala de espera.

## Roteiro recomendado antes da palestra

1. Abra o painel pelo link publico.
2. Escaneie o QR Code com um celular.
3. Informe um nome e faca um voto de teste.
4. Confira se o nome aparece em **Participantes ao vivo**.
5. Teste o aquecimento da Copa.
6. Use **Reset geral** antes de receber o publico.
7. Deixe o painel parado na tela de boas-vindas com o QR Code grande.

## Sorteio de livros

O sorteio final usa somente os participantes ativos em **Participantes ao vivo**.

Se alguem fechar a pagina, perder conexao ou ficar sem heartbeat, o nome deixa de participar do sorteio. Para concorrer, a pessoa precisa permanecer conectada ate o encerramento.
