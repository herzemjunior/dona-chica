window.DONA_CHICA_STEPS = [
  {
    id: "aquecimento-copa",
    type: "warmup",
    title: "Aquecimento",
    speech: "Antes de começarmos de verdade, vamos fazer um teste rápido? Como vocês estão vendo a seleção brasileira na Copa do Mundo?",
    participantSpeech: "Como vocês estão vendo a seleção brasileira na Copa do Mundo?",
    options: ["Seremos hexa!", "Acho que da Noruega não passa...", "Nem estou acompanhando", "Quero gol do menino Ney"],
    reactions: {
      "Seremos hexa!": "Pronto! Agora vocês já sabem como participar. Gostei desse aquecimento confiante.",
      "Acho que da Noruega não passa...": "Teste concluído. Vejo que tem gente cautelosa por aqui. Agora vamos começar nossa conversa de verdade.",
      "Nem estou acompanhando": "Agora que todo mundo já aprendeu o caminho, vamos para o que interessa.",
      "Quero gol do menino Ney": "Pronto! O sistema funcionou, a torcida apareceu e agora podemos começar de verdade."
    }
  },
  {
    id: "quem-esta-aqui",
    title: "Quem está aqui?",
    speech: "Primeiro preciso entender quem veio conversar comigo hoje. Quem temos por aqui?",
    options: ["Estudantes", "Professores", "Gestores/Coordenação", "Outros"],
    reactions: {
      "Professores": "Descobri que esta plateia tem forte presença de professores. Vou caprichar nos exemplos de sala de aula.",
      "Estudantes": "Que bom ver estudantes por aqui. Vou ligar cada ideia à curiosidade de quem está aprendendo agora.",
      "Gestores/Coordenação": "Anotei uma presença forte da gestão. Vamos pensar também em caminhos para a escola inteira.",
      "Outros": "Temos uma plateia diversa. Isso deixa nosso caderno de campo mais rico."
    }
  },
  {
    id: "ia-no-ensino",
    title: "IA no Ensino",
    speech: "Agora que j\u00e1 sei quem est\u00e1 aqui, quero come\u00e7ar pelo nosso tema principal... Na opini\u00e3o de voc\u00eas, onde a Intelig\u00eancia Artificial pode ajudar mais no ensino?",
    participantSpeech: "Na sua opini\u00e3o, onde a Intelig\u00eancia Artificial pode ajudar mais no ensino?",
    options: ["🧑‍🏫 No planejamento das aulas", "📚 Na aprendizagem dos alunos", "📝 Na cria\u00e7\u00e3o de atividades", "♿ Na inclus\u00e3o e acessibilidade"],
    reactions: {
      "🧑‍🏫 No planejamento das aulas": "Faz sentido. Para muitos professores, a IA pode ser uma aliada na organiza\u00e7\u00e3o de ideias, objetivos e estrat\u00e9gias de aula.",
      "📚 Na aprendizagem dos alunos": "Interessante. Isso mostra que muitos enxergam a IA como apoio direto ao estudante, e n\u00e3o apenas como ferramenta do professor.",
      "📝 Na cria\u00e7\u00e3o de atividades": "Boa escolha. Criar atividades melhores, mais variadas e mais contextualizadas \u00e9 um dos usos mais fortes da IA na educa\u00e7\u00e3o.",
      "♿ Na inclus\u00e3o e acessibilidade": "Essa resposta \u00e9 muito importante. A IA tamb\u00e9m pode ajudar a adaptar materiais, linguagens e caminhos de aprendizagem para diferentes necessidades."
    }
  },
  {
    id: "geracao",
    title: "Geração da plateia",
    speech: "Toda geração olha para a tecnologia de um jeito diferente. Qual faixa representa você?",
    options: ["Até 18 anos", "19 a 30 anos", "31 a 45 anos", "46 anos ou mais"],
    reactions: {
      "Até 18 anos": "Percebi muita gente jovem na roda. A conversa sobre IA já começa perto da realidade de vocês.",
      "19 a 30 anos": "Esta plateia cresceu vendo a tecnologia mudar depressa. Isso ajuda a entender a IA sem assombro.",
      "31 a 45 anos": "Vejo uma plateia com boa mistura de experiência e adaptação. Ótimo terreno para aprender IA.",
      "46 anos ou mais": "Anotei muita experiência acumulada. A IA fica melhor quando conversa com saberes de longa estrada."
    }
  },
  {
    id: "desafio-avaliacao",
    type: "reflection",
    title: "Desafio da Avaliação",
    preThinking: true,
    speech: "Agora quero ouvir a opinião de vocês sobre um desafio que muitos professores estão vivendo... Hoje em dia, ainda existe alguma atividade para casa que um aluno não consiga fazer usando Inteligência Artificial?",
    participantSpeech: "Hoje em dia, ainda existe alguma atividade para casa que um aluno não consiga fazer usando Inteligência Artificial?",
    options: ["🟢 Sim, ainda existem.", "🟡 Depende da atividade.", "🔴 Acho que praticamente não.", "🔵 Nunca pensei nisso."],
    reactions: {
      "🟢 Sim, ainda existem.": "Interessante... boa parte de vocês acredita que ainda conseguimos criar atividades difíceis de serem resolvidas apenas com IA.",
      "🟡 Depende da atividade.": "Gostei dessa resposta. Talvez o desafio não seja abandonar as tarefas, mas repensar como elas são propostas.",
      "🔴 Acho que praticamente não.": "Essa é uma preocupação que muitos professores compartilham atualmente.",
      "🔵 Nunca pensei nisso.": "Ótimo! Então vamos explorar essa questão juntos durante nossa conversa."
    }
  },
  {
    id: "aprendizagem-humana",
    type: "reflection",
    title: "Aprendizagem Humana",
    preThinking: true,
    thinkingLabel: "Dona Chica está refletindo...",
    thinkingSubtitle: "Ligando avaliação, aprendizagem e presença humana",
    focusDominantResult: true,
    speech: "A resposta de vocês me fez pensar em outra coisa... Imaginem que vocês fossem professores hoje. Qual destas atividades vocês acreditam que seria mais difícil para um aluno realizar utilizando apenas Inteligência Artificial?",
    participantSpeech: "Se vocês fossem professores hoje, qual atividade seria mais difícil para um aluno fazer usando apenas IA?",
    options: ["🗣️ Trabalho em grupo presencial", "🔬 Aula prática / experimento", "🤝 Apresentação oral", "📝 Resumo de um texto"],
    reactions: {
      "🗣️ Trabalho em grupo presencial": "Interessante... muitos de vocês acreditam que a colaboração entre pessoas continua sendo um dos maiores desafios para a Inteligência Artificial substituir. Talvez a pergunta não seja mais 'o que a IA consegue fazer', mas sim 'o que queremos que nossos alunos aprendam de verdade'.",
      "🔬 Aula prática / experimento": "Faz sentido. Experimentar, observar e colocar a mão na massa ainda são experiências muito humanas. Talvez a pergunta não seja mais 'o que a IA consegue fazer', mas sim 'o que queremos que nossos alunos aprendam de verdade'.",
      "🤝 Apresentação oral": "Gostei dessa percepção. Comunicar ideias, improvisar e interagir com outras pessoas ainda exige habilidades que vão muito além de simplesmente gerar um texto. Talvez a pergunta não seja mais 'o que a IA consegue fazer', mas sim 'o que queremos que nossos alunos aprendam de verdade'.",
      "📝 Resumo de um texto": "Essa resposta mostra que muitos acreditam que interpretar criticamente um conteúdo continua sendo uma habilidade essencial. Talvez a pergunta não seja mais 'o que a IA consegue fazer', mas sim 'o que queremos que nossos alunos aprendam de verdade'."
    }
  },
  {
    id: "como-aprendem",
    title: "Como aprendem",
    speech: "Agora quero entender como vocês aprendem no dia a dia. Quando querem aprender algo novo, o que mais usam?",
    options: ["Livros", "YouTube/redes sociais", "Cursos/aulas", "Inteligência Artificial"],
    reactions: {
      "Livros": "Os livros continuam firmes no caderno. Vamos somar tradição, leitura e ferramentas novas.",
      "YouTube/redes sociais": "A aprendizagem em rede apareceu forte. A IA também precisa ser pensada nesse fluxo rápido.",
      "Cursos/aulas": "A escola e a aula seguem no centro. Perfeito para falarmos de IA com intenção pedagógica.",
      "Inteligência Artificial": "Interessante: a IA já entrou no jeito de aprender de muita gente por aqui."
    }
  },
  {
    id: "experiencia-ia",
    title: "Experiência com IA",
    speech: "Chegamos no meu assunto favorito. Qual é a sua relação com Inteligência Artificial?",
    options: ["Nunca usei", "Já experimentei", "Uso toda semana", "Uso todos os dias"],
    reactions: {
      "Nunca usei": "Percebi que muita gente ainda está começando. Então vamos caminhar sem pressa.",
      "Já experimentei": "Esta plateia já abriu a porta da IA. Agora vamos aprender a entrar com propósito.",
      "Uso toda semana": "Temos uso frequente por aqui. Dá para avançar para exemplos bem práticos.",
      "Uso todos os dias": "Interessante! Esta plateia já convive com IA. Podemos avançar para usos mais práticos."
    }
  },
  {
    id: "ferramentas",
    title: "Ferramentas usadas",
    speech: "Se vocês já usam IA, quero saber: qual ferramenta aparece mais por aqui?",
    options: ["ChatGPT", "Gemini", "Copilot/Perplexity", "Canva ou outra"],
    reactions: {
      "ChatGPT": "O ChatGPT apareceu como trilha principal. Vou usar exemplos próximos desse tipo de conversa.",
      "Gemini": "O Gemini tem boa presença. Vale comparar ferramentas e entender quando cada uma ajuda mais.",
      "Copilot/Perplexity": "Vejo interesse em pesquisa e apoio ao trabalho. Vamos falar de fontes, checagem e contexto.",
      "Canva ou outra": "A criação visual também entrou no mapa. A IA não mora só no texto."
    }
  },
  {
    id: "usos-ia",
    title: "Usos da IA",
    speech: "Agora me contem: quando usam IA, qual é o principal objetivo?",
    options: ["Estudar/pesquisar", "Planejar aulas", "Criar textos/slides", "Criar imagens/provas"],
    reactions: {
      "Estudar/pesquisar": "A pesquisa apareceu forte. Vamos conversar sobre perguntar melhor e conferir melhor.",
      "Planejar aulas": "Planejamento de aula entrou no centro. A IA pode economizar tempo sem tirar autoria.",
      "Criar textos/slides": "A produção de materiais está no caderno. Vamos cuidar da qualidade e da voz de quem cria.",
      "Criar imagens/provas": "Criação de imagens e avaliações apareceu. Bom momento para falar de critérios e cuidado."
    }
  },
  {
    id: "dificuldades",
    title: "Dificuldades",
    speech: "Nem tudo são flores na floresta da tecnologia. Qual é a maior dificuldade de vocês com IA?",
    options: ["Escrever bons prompts", "Confiar nas respostas", "Escolher a ferramenta", "Medo de uso inadequado"],
    reactions: {
      "Escrever bons prompts": "Anotado no meu caderno: escrever bons comandos ainda é um grande desafio.",
      "Confiar nas respostas": "A confiança apareceu como alerta. IA ajuda, mas precisa de leitura crítica.",
      "Escolher a ferramenta": "Muita ferramenta confunde mesmo. Vamos buscar critérios simples para escolher.",
      "Medo de uso inadequado": "Esse cuidado é importante. Tecnologia boa precisa de ética, combinados e acompanhamento."
    }
  },
  {
    id: "ia-educacao",
    title: "IA na Educação",
    speech: "Agora quero ouvir a percepção de vocês: a IA na educação é principalmente...",
    options: ["Uma oportunidade", "Um risco", "Depende de como usa", "Uma transformação inevitável"],
    reactions: {
      "Uma oportunidade": "A oportunidade brilhou mais forte. Vamos olhar para usos que ampliam aprendizagem.",
      "Um risco": "O risco precisa ser levado a sério. É assim que a escola protege e orienta melhor.",
      "Depende de como usa": "Esta resposta tem sabedoria de seringal: ferramenta depende da mão e do propósito.",
      "Uma transformação inevitável": "A mudança já está batendo na porta. Melhor preparar a escola do que fingir que ela não chegou."
    }
  },
  {
    id: "compromisso-ia-educacao",
    title: "Compromisso com a IA na Educa\u00e7\u00e3o",
    speech: "Antes de encerrarmos, quero fazer uma \u00faltima pergunta... Depois dessa conversa, qual compromisso voc\u00eas acham mais importante para usar Intelig\u00eancia Artificial na educa\u00e7\u00e3o?",
    participantSpeech: "Depois dessa conversa, qual compromisso voc\u00ea acha mais importante para usar IA na educa\u00e7\u00e3o?",
    options: ["\ud83c\udf31 Usar com \u00e9tica", "\ud83d\udc69\u200d\ud83c\udfeb Ensinar os alunos a usar", "\ud83c\udfa8 Criar aulas mais criativas", "\u2764\ufe0f N\u00e3o perder o lado humano"],
    reactions: {
      "\ud83c\udf31 Usar com \u00e9tica": "Bonito ver isso. Tecnologia s\u00f3 faz sentido quando caminha junto com responsabilidade.",
      "\ud83d\udc69\u200d\ud83c\udfeb Ensinar os alunos a usar": "Esse \u00e9 um grande compromisso: n\u00e3o apenas proibir ou liberar, mas ensinar a usar com consci\u00eancia.",
      "\ud83c\udfa8 Criar aulas mais criativas": "A criatividade continua sendo uma das maiores for\u00e7as do professor. A IA pode ampliar essa pot\u00eancia.",
      "\u2764\ufe0f N\u00e3o perder o lado humano": "Essa talvez seja a lembran\u00e7a mais importante: nenhuma tecnologia substitui o v\u00ednculo, o cuidado e a presen\u00e7a humana."
    }
  }
];
