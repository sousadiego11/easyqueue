export default {
  nav: {
    features: "Funcionalidades",
    brokers: "Brokers",
    privacy: "Privacidade",
    download: "Download",
    aria: "Navegação principal",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
    star: "Star no GitHub",
  },
  hero: {
    version: "Versão mais recente",
    title: "EasyQueue",
    tagline: "O Postman para Mensageria",
    subtitle:
      "Um app desktop para inspecionar, publicar e debugar mensagens de filas RabbitMQ, AWS SQS, Azure Service Bus e muito mais — tudo em uma interface unificada.",
    cta: {
      download: "Baixar EasyQueue",
      github: "GitHub",
    },
  },
  why: {
    title: "Por que EasyQueue?",
    problem: {
      title: "O problema",
      desc: "Para debuggar uma mensagem, voce precisa pular entre:",
      items: [
        "AWS Console para filas SQS",
        "RabbitMQ Management UI para filas AMQP",
        "Dashboards internos e logs",
        "Terminal com scripts avulsos",
        "Cliente HTTP separado pra publicar",
      ],
      conclusion: "Ferramentas fragmentadas, context switches constantes, produtividade prejudicada.",
    },
    solution: {
      title: "A solução",
      desc: "EasyQueue unifica tudo em uma interface desktop nativa:",
      items: [
        "Conecte-se a qualquer broker em segundos",
        "Publique, consuma e debuge mensagens sem sair do app",
        "Visualizador JSON formatado com busca e filtro",
        "Release, replay, delete e purge com um clique",
        "Conexões e credenciais criptografadas, local-first",
      ],
      conclusion: "Menos ferramentas. Mais produtividade.",
    },
  },
  preview: {
    title: "Veja em ação",
    subtitle: "Uma interface limpa, moderna e funcional. Temas dark e light incluídos.",
    labels: {
      dark: "Tema escuro (padrão)",
      light: "Tema claro",
      animated: "Fluxo completo em ação",
    },
  },
  features: {
    title: "Funcionalidades",
    subtitle: "Tudo que você precisa para trabalhar com filas, em um só lugar.",
    items: [
      {
        title: "Publicar mensagens",
        desc: "Envie mensagens com payload JSON, headers personalizados e editor de corpo integrado.",
      },
      {
        title: "Consumir filas",
        desc: "Receba mensagens em tempo real com polling nativo, consumers push ou stream listeners.",
      },
      {
        title: "Release & Replay",
        desc: "Devolva mensagens à fila (release) ou republique (replay) sem perder o payload.",
      },
      {
        title: "Delete & Purge",
        desc: "Remova mensagens individuais ou limpe filas inteiras com confirmação segura.",
      },
      {
        title: "JSON Viewer",
        desc: "Visualizador de JSON com syntax highlighting, formato árvore e suporte a objetos complexos.",
      },
      {
        title: "Busca & Filtro",
        desc: "Encontre mensagens rapidamente por conteúdo, ID ou atributos. Ordenação incluída.",
      },
      {
        title: "Dark & Light",
        desc: "Leve seu tema para as filas. Alterne entre tema escuro e claro conforme sua preferência.",
      },
      {
        title: "Múltiplos providers",
        desc: "Conecte-se a RabbitMQ, AWS SQS, Redis Streams, Azure Service Bus e NATS JetStream em paralelo.",
      },
    ],
  },
  brokers: {
    title: "Brokers suportados",
    subtitle: "Provider-agnostic por design. Conecte-se a qualquer broker com uma interface unificada.",
    badge: {
      supported: "Suportado",
      planned: "Previsto",
    },
    items: [
      {
        name: "RabbitMQ",
        desc: "Suporte a filas AMQP com autenticação, auto-reconnect e integração com Management API.",
      },
      {
        name: "AWS SQS",
        desc: "Filas Standard e FIFO com long polling, SendMessage, ReceiveMessage e ChangeMessageVisibility.",
      },
      {
        name: "Azure Service Bus",
        desc: "Filas e tópicos do Azure com suporte a connection string, recebimento peek-lock, complete e abandon.",
      },
      {
        name: "Redis",
        desc: "Redis Streams com consumer groups, XREADGROUP, XACK e gerenciamento completo de streams.",
      },
      {
        name: "NATS JetStream",
        desc: "NATS JetStream com pull consumers, assinaturas duráveis e gerenciamento de mensagens baseado em streams.",
      },
    ],
  },
  privacy: {
    title: "Privacidade em primeiro lugar",
    subtitle: "Seus dados nunca saem da sua máquina.",
    items: [
      {
        title: "Local-first",
        desc: "Todas as operações são executadas localmente no seu computador. Não há servidores intermediários, nuvem ou telemetria obrigatória.",
      },
      {
        title: "Criptografia",
        desc: "Conexões e credenciais são armazenadas de forma criptografada no disco. Nada de plain text ou envio para terceiros.",
      },
      {
        title: "100% offline",
        desc: "O EasyQueue funciona completamente offline. A única dependência de rede é a conexão direta com seus brokers.",
      },
      {
        title: "Open source",
        desc: "Código aberto sob licença MIT. Auditável, modificável e sem surpresas. Você sabe exatamente o que roda na sua máquina.",
      },
    ],
  },
  download: {
    title: "Baixe o EasyQueue",
    subtitle: "Disponível para Windows, macOS e Linux. Multiplataforma, nativo e gratuito.",
    platforms: {
      windows: {
        name: "Windows",
        formats: [
          { ext: ".exe", label: "Installer" },
          { ext: ".msi", label: "MSI Package" },
        ],
      },
      macos: {
        name: "macOS",
        formats: [
          { ext: ".dmg", label: "Intel" },
          { ext: ".dmg", label: "Apple Silicon" },
        ],
      },
      linux: {
        name: "Linux",
        formats: [
          { ext: ".AppImage", label: "Portable" },
          { ext: ".deb", label: "Debian/Ubuntu" },
        ],
      },
    },
    note: "Todas as versões assinadas e verificadas.",
    noteLink: "Veja todas as releases no GitHub",
  },
  footer: {
    copyright: "© 2026 Diego Sousa. Distribuído sob licença MIT.",
    madeWith: "Feito com dedicação para a comunidade de engenharia de software.",
    links: {
      github: "GitHub",
      license: "Licença MIT",
      contribute: "Contribuir",
    },
    aria: "Rodapé",
  },
  star: {
    title: "Gostou do EasyQueue?",
    subtitle: "Deixe uma estrela no GitHub e ajude o projeto a crescer.",
    button: "Star no GitHub",
    count: "estrelas",
  },
} as const
