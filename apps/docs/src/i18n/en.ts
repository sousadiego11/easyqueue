export default {
  nav: {
    features: "Features",
    brokers: "Brokers",
    privacy: "Privacy",
    download: "Download",
    aria: "Main navigation",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    star: "Star on GitHub",
  },
  hero: {
    version: "Latest Release",
    title: "EasyQueue",
    tagline: "The Postman for Message Brokers",
    subtitle:
      "A desktop app to inspect, publish, and debug queue messages on RabbitMQ, AWS SQS, Azure Service Bus, and more — all in one unified interface.",
    cta: {
      download: "Download EasyQueue",
      github: "GitHub",
    },
  },
  why: {
    title: "Why EasyQueue?",
    problem: {
      title: "The Problem",
      desc: "To debug a single message, you have to jump between:",
      items: [
        "AWS Console for SQS queues",
        "RabbitMQ Management UI for AMQP queues",
        "Internal dashboards and logs",
        "Terminal with ad-hoc scripts",
        "A separate HTTP client to publish",
      ],
      conclusion: "Fragmented tools, constant context switches, lost productivity.",
    },
    solution: {
      title: "The Solution",
      desc: "EasyQueue unifies everything in one native desktop interface:",
      items: [
        "Connect to any broker in seconds",
        "Publish, consume, and debug messages without leaving the app",
        "Formatted JSON viewer with search and filter",
        "Release, replay, delete, and purge with one click",
        "Encrypted credentials, local-first architecture",
      ],
      conclusion: "Fewer tools. More productivity.",
    },
  },
  preview: {
    title: "See it in action",
    subtitle: "A clean, modern, functional interface. Dark and light themes included.",
    labels: {
      dark: "Dark theme (default)",
      light: "Light theme",
      animated: "Full workflow in action",
    },
  },
  features: {
    title: "Features",
    subtitle: "Everything you need to work with queues, in one place.",
    items: [
      {
        title: "Publish messages",
        desc: "Send messages with JSON payload, custom headers, and an integrated body editor.",
      },
      {
        title: "Consume queues",
        desc: "Receive messages in real-time with native polling, push consumers, or stream listeners.",
      },
      {
        title: "Release & Replay",
        desc: "Return messages to the queue (release) or republish (replay) without losing the payload.",
      },
      {
        title: "Delete & Purge",
        desc: "Remove individual messages or clear entire queues with safe confirmation.",
      },
      {
        title: "JSON Viewer",
        desc: "Built-in JSON viewer with syntax highlighting, tree view, and complex object support.",
      },
      {
        title: "Search & Filter",
        desc: "Find messages quickly by content, ID, or attributes. Sorting included.",
      },
      {
        title: "Dark & Light",
        desc: "Take your theme to the queues. Toggle between dark and light as you prefer.",
      },
      {
        title: "Multiple providers",
        desc: "Connect to RabbitMQ, AWS SQS, Redis Streams, and Azure Service Bus in parallel. Google Pub/Sub coming soon.",
      },
    ],
  },
  brokers: {
    title: "Supported Brokers",
    subtitle: "Provider-agnostic by design. Connect to any broker with a unified interface.",
    badge: {
      supported: "Supported",
      planned: "Planned",
    },
    items: [
      {
        name: "RabbitMQ",
        desc: "AMQP queue support with authentication, auto-reconnect, and Management API integration.",
      },
      {
        name: "AWS SQS",
        desc: "Standard and FIFO queues with long polling, SendMessage, ReceiveMessage, and ChangeMessageVisibility.",
      },
      {
        name: "Azure Service Bus",
        desc: "Azure queues and topics with connection string support, peek-lock receive, complete, and abandon operations.",
      },
      {
        name: "Google Pub/Sub",
        desc: "Google Cloud topics and subscriptions support. In development.",
      },
      {
        name: "Redis",
        desc: "Redis Streams with consumer groups, XREADGROUP, XACK, and full stream management.",
      },
    ],
  },
  privacy: {
    title: "Privacy first",
    subtitle: "Your data never leaves your machine.",
    items: [
      {
        title: "Local-first",
        desc: "All operations run locally on your computer. No intermediary servers, cloud, or mandatory telemetry.",
      },
      {
        title: "Encryption",
        desc: "Connections and credentials are stored encrypted on disk. No plain text or third-party uploads.",
      },
      {
        title: "100% offline",
        desc: "EasyQueue works completely offline. The only network dependency is the direct connection to your brokers.",
      },
      {
        title: "Open source",
        desc: "Auditable, modifiable, no surprises. You know exactly what runs on your machine.",
      },
    ],
  },
  download: {
    title: "Download EasyQueue",
    subtitle: "Available for Windows, macOS, and Linux. Multi-platform, native, and free.",
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
    note: "All versions signed and verified.",
    noteLink: "See all releases on GitHub",
  },
  footer: {
    copyright: "© 2026 Diego Sousa. Distributed under MIT license.",
    madeWith: "Made with dedication for the software engineering community.",
    links: {
      github: "GitHub",
      license: "MIT License",
      contribute: "Contribute",
    },
    aria: "Footer",
  },
  star: {
    title: "Enjoying EasyQueue?",
    subtitle: "Leave a star on GitHub and help the project grow.",
    button: "Star on GitHub",
    count: "stars",
  },
} as const
