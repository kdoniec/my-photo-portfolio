RulePreview.tsx
├── Components
│   ├── RulePreviewTopbar
│   │   ├── RulesPath
│   │   ├── RulesPreviewActions
│   │   └── RulesPreviewCopyDownloadActions
│   ├── DependencyUpload
│   └── MarkdownContentRenderer
│       └── RulesPreviewCopyDownloadActions
│
├── Hooks
│   ├── useDependencyUpload
│   │   └── /api/upload-dependencies (API endpoint)
│   ├── useProjectStore
│   └── useTechStackStore
│
├── Services
│   └── RulesBuilderService
│       └── generateRulesContent()
│
└── Types
    └── RulesContent

Parent Component
└── TwoPane
    ├── RuleBuilder
    ├── RulePreview
    └── CollectionsSidebar