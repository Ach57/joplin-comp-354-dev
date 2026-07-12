# Thesaurus Plugin — Integration Layer Architecture

## Context

This architecture is only concerned with the following part of the script, which is the api contract between the frontend and the NLP backend.

```bash
.
├── errors
│   └── errors.ts
├── infrastructure
│   └── PythonProcessManager.ts
├── interfaces
│   ├── IPythonProcessManager.ts
│   └── IRankingService.ts
├── services
│   └── RankingService.ts
└── types
    └── types.ts
```

## UML Diagram

```mermaid
classDiagram
    class PythonProcessManagerApi {
        <<interface>>
        +start() Promise~void~
        +stop() Promise~void~
        +send(request: RankRequest) Promise~RankResponse~
    }

    class RankingServiceApi {
        <<interface>>
        +getSuggestions(word, sentence) Promise~RankResponse~
    }

    class PythonProcessManager {
        -scriptPath: string
        -pythonExecutable: string
        -process: ChildProcess | null
        -pendingRequests: Map~string, PendingRequest~
        -stdoutBuffer: string
        +start() Promise~void~
        +stop() Promise~void~
        +send(request: RankRequest) Promise~RankResponse~
        -handleStdoutData(chunk: Buffer) void
        -dispatchLine(line: string) void
    }

    class RankingService {
        -processManager: PythonProcessManagerApi
        +getSuggestions(word, sentence) Promise~RankResponse~
    }

    PythonProcessManager ..|> PythonProcessManagerApi
    RankingService ..|> RankingServiceApi
    RankingService --> PythonProcessManagerApi
```
