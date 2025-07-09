# Job Board System Architecture

## System Overview

The Job Board is a scalable job import system that fetches job listings from multiple sources, processes them asynchronously, and provides real-time tracking of import operations. The system is designed with scalability, reliability, and maintainability in mind.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Dashboard]
        B[Import History]
    end

    subgraph "Backend Layer"
        C[Express API Server]
        D[Cron Service]
    end

    subgraph "Queue Layer"
        E[Redis Queue]
        F[Worker Process]
    end

    subgraph "Data Layer"
        G[(MongoDB)]
    end

    subgraph "External Sources"
        H[Jobicy APIs]
    end

    A --> C
    B --> C
    C --> G
    D --> H
    H --> C
    C --> E
    E --> F
    F --> G
```

## Data Flow

```mermaid
sequenceDiagram
    participant Cron
    participant Fetcher
    participant Queue
    participant Worker
    participant DB
    participant Frontend

    Cron->>Fetcher: Trigger hourly fetch
    Fetcher->>External: Fetch XML data
    External->>Fetcher: Return XML jobs
    Fetcher->>Queue: Add jobs to queue
    Queue->>Worker: Process jobs
    Worker->>DB: Save/Update jobs
    Worker->>DB: Update import log
    Frontend->>DB: Query status
    DB->>Frontend: Return metrics
```

## Component Architecture

### 1. Job Source Integration

```mermaid
graph LR
    A[Cron Service] -->|Triggers| B[Job Fetcher]
    B -->|Fetch XML| C[XML Parser]
    C -->|Parse| D[Data Normalizer]
    D -->|Validate| E[Job Producer]
    E -->|Queue| F[Redis]

    style A fill:#f9f,stroke:#333
    style F fill:#bbf,stroke:#333
```

**Design Decisions:**
- XML parsing using xml2js for reliable conversion
- Source configuration in separate file for easy management
- Error handling with retries for network issues
- Data normalization for consistent storage

### 2. Queue System Architecture

```mermaid
graph TB
    subgraph "Queue Management"
        A[Queue Manager] -->|Create| B[Job Queue]
        B -->|Process| C[Worker Pool]
    end

    subgraph "Worker Process"
        C -->|Process Job| D[Job Handler]
        D -->|Success| E[Update DB]
        D -->|Failure| F[Retry Logic]
        F -->|Max Retries| G[Mark Failed]
    end

    style B fill:#bbf,stroke:#333
    style C fill:#bfb,stroke:#333
```

**Design Decisions:**
- BullMQ for robust queue handling
- Configurable concurrency (5 workers default)
- Exponential backoff for retries
- Separate queues per job type

### 3. Database Schema

```mermaid
erDiagram
    Job {
        string _id
        string title
        string company
        string description
        string location
        string type
        string url
        string source
        string externalId
        date createdAt
        date updatedAt
    }

    ImportLog {
        string _id
        string source
        string sourceUrl
        string status
        number totalFetched
        number totalImported
        number newJobs
        number updatedJobs
        number failedJobs
        date startTime
        date endTime
        number duration
    }

    Job ||--o{ ImportLog : "tracked_by"
```

**Design Decisions:**
- Normalized schema for efficient querying
- Indexed fields for common queries
- Separate import logs for tracking
- Optimized for read performance

### 4. Frontend Component Structure

```mermaid
graph TB
    subgraph "App Structure"
        A[App] --> B[Router]
        B --> C[Dashboard Layout]
        C --> D[Dashboard]
        C --> E[Import History]
    end

    subgraph "Components"
        D --> F[Stats Cards]
        D --> G[Source Distribution]
        D --> H[Recent Activity]
        E --> I[Import Table]
        E --> J[Pagination]
    end

    style A fill:#f9f,stroke:#333
    style D fill:#bfb,stroke:#333
    style E fill:#bfb,stroke:#333
```

## Error Handling Strategy

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}
    B -->|Network| C[Retry with Backoff]
    B -->|Validation| D[Log & Skip]
    B -->|DB| E[Retry Transaction]
    
    C --> F{Max Retries?}
    F -->|Yes| G[Mark Failed]
    F -->|No| H[Retry Job]
    
    D --> I[Update Metrics]
    E --> J{Recoverable?}
    J -->|Yes| K[Retry Operation]
    J -->|No| L[Alert & Log]
```

## Scalability Design

```mermaid
graph TB
    subgraph "Load Balancing"
        A[Load Balancer] --> B[API Server 1]
        A --> C[API Server 2]
    end

    subgraph "Queue Processing"
        D[Redis Cluster] --> E[Worker 1]
        D --> F[Worker 2]
        D --> G[Worker N]
    end

    subgraph "Database"
        H[(MongoDB Primary)]
        I[(MongoDB Secondary)]
        J[(MongoDB Secondary)]
    end

    B & C --> D
    E & F & G --> H
    H --> I & J
```

## Monitoring and Metrics

```mermaid
graph LR
    A[System Metrics] --> B[Dashboard]
    C[Queue Stats] --> B
    D[Import Logs] --> B
    E[Error Rates] --> B

    B --> F[Alert System]
    B --> G[Performance Graphs]
    B --> H[Health Status]
```

## Development Workflow

```mermaid
gitGraph
    commit id: "initial"
    branch develop
    checkout develop
    commit id: "feature/job-fetch"
    commit id: "feature/queue-system"
    commit id: "feature/worker"
    checkout main
    merge develop id: "release-v1"
    branch feature/dashboard
    commit id: "dashboard-ui"
    checkout develop
    merge feature/dashboard
    checkout main
    merge develop id: "release-v2"
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        A[NGINX] --> B[Node.js API]
        A --> C[React Frontend]
        B --> D[Redis Cluster]
        D --> E[Worker Processes]
        B & E --> F[(MongoDB Atlas)]
    end

    subgraph "Monitoring"
        G[Logs]
        H[Metrics]
        I[Alerts]
    end

    B & D & E --> G & H --> I
``` 