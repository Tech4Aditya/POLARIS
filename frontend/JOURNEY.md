# POLARIS Frontend

The frontend of **POLARIS** — a research discovery and knowledge interface designed to bring polar datasets, publications, documents, multimedia and source-grounded knowledge into a single workspace.

The frontend is responsible for presenting the POLARIS knowledge layer through an interactive interface while keeping the actual data processing and retrieval responsibilities inside the backend.

---

## 1. Why We Built the Frontend

The underlying problem with polar research information is not only that resources are distributed.

Even when datasets, publications and documents are available, users still need a practical way to:

- discover relevant resources
- search across the knowledge base
- understand where information comes from
- explore research material
- access multimedia resources
- work with generated content
- move between different parts of the research ecosystem without dealing with multiple disconnected interfaces

The frontend was therefore designed as the **interaction layer of POLARIS**.

Instead of exposing individual backend services directly to users, the frontend provides a unified research-oriented workspace.

---

## 2. Development Philosophy

The frontend was developed around three principles:

### 1. Keep the interface simple
POLARIS is a scientific knowledge platform, not an AI chatbot demo.

The UI was therefore intentionally designed to avoid excessive AI-style visual effects, unnecessary gradients and decorative components.

### 2. Make information discoverable
Important information should be accessible through clear navigation, search and content modules.

### 3. Keep the frontend independent from backend internals
The frontend communicates with the backend through APIs.

```text
User
 ↓
POLARIS Frontend
 ↓
API Requests
 ↓
POLARIS Backend
 ↓
Database / Retrieval / Processing
 ↓
Structured Response
 ↓
Frontend
 ↓
User
```

This separation allows the backend implementation to evolve without requiring the entire interface to be rewritten.

---

## 3. Frontend Architecture

The frontend is built using a component-based architecture.

Conceptually:

```text
                    POLARIS UI
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   Discovery        Knowledge         Content
   Interface         Interface         Studio
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                  API Integration
                        │
                        ▼
                 POLARIS Backend
```

The interface is organized around the major workflows of the POLARIS platform rather than around individual backend services.

---

## 4. Major Frontend Workflows

### Research Discovery

The discovery interface provides the entry point for exploring polar research resources.

```text
User Query
    ↓
Search Interface
    ↓
Backend Retrieval
    ↓
Relevant Resources
    ↓
Results / Source Information
```

The frontend does not perform the complete retrieval process itself. It sends the query to the backend and focuses on presenting the returned information clearly.

### Knowledge Exploration

The knowledge interface is designed to allow users to move from a broad search result toward more detailed research information.

```text
Search
  ↓
Result
  ↓
Resource Details
  ↓
Source / Metadata
  ↓
Related Information
```

This creates a research-oriented flow instead of treating every query as an isolated chat interaction.

### Multimedia Discovery

Polar research is not limited to text. The frontend therefore provides a dedicated space for multimedia-oriented resources.

The interface can be used to organize and present resources such as:

- research media
- imagery
- videos
- supporting scientific resources
- related research material

The frontend receives the resource information through the backend rather than directly accessing the underlying storage.

### Content Studio

POLARIS also includes a content-oriented workflow for transforming retrieved research material into structured outputs.

```text
Research Sources
      ↓
Retrieved Context
      ↓
Content Workspace
      ↓
Draft / Generated Content
      ↓
Review
      ↓
Final Output
```

The purpose is to make the research knowledge layer useful not only for discovery but also for dissemination and education workflows.

---

## 5. UI Design Direction

A major part of the development was deciding what POLARIS should *not* look like.

The interface was intentionally designed to avoid the common "AI dashboard" appearance.

We avoided relying heavily on:

- excessive shadows
- glowing AI effects
- unnecessary gradients
- oversized cards
- excessive animations
- visually noisy backgrounds

Instead, the design direction focuses on:

- clean typography
- generous whitespace
- restrained colors
- clear hierarchy
- research-oriented layouts
- lightweight visual elements
- consistent spacing

The visual language uses a combination of neutral/light surfaces with subtle polar-inspired blue and warm orange accents.

---

## 6. Light and Dark Interface

POLARIS was designed with support for both light and dark presentation.

The light interface was treated as the primary research-oriented environment because large amounts of scientific information are easier to scan on a clean, high-contrast surface.

The dark mode provides an alternative environment for users who prefer darker interfaces.

The important requirement was keeping the information hierarchy consistent between both modes rather than creating two completely different designs.

---

## 7. Building the Dashboard

The dashboard was developed around the idea that the first screen should answer three questions quickly:

```text
What is POLARIS?
        ↓
What can I explore?
        ↓
Where should I go next?
```

Instead of filling the dashboard with arbitrary statistics, the interface focuses on the actual workflows supported by the platform.

The dashboard therefore acts as a navigation layer into:

- research discovery
- knowledge exploration
- datasets
- multimedia
- content workflows

---

## 8. Frontend ↔ Backend Integration

One of the biggest challenges during development was connecting the UI to the backend reliably.

A frontend can appear completely functional while still failing to communicate with the actual API.

The integration therefore had to account for:

- API base URLs
- exposed ports
- Docker networking
- CORS
- asynchronous requests
- loading states
- error states
- response formats

The frontend was configured to communicate with the backend through a defined API base URL instead of scattering hardcoded backend addresses throughout the application.

---

## 9. Localhost vs Docker Networking

A particularly important issue occurred because `localhost` means different things depending on where the request originates.

From the user's browser:

```text
Browser
   ↓
localhost:8001
   ↓
Backend
```

Inside Docker:

```text
Frontend Container
   ↓
backend:<internal-port>
   ↓
Backend Container
```

Using the wrong address caused requests to fail even though both services were running.

This required separating browser-facing configuration from internal Docker service communication.

---

## 10. Frontend Stability Issues

During development, several frontend issues appeared as the application became more complex.

These included:

- TypeScript errors
- missing state variables
- incorrect component references
- API integration issues
- marker/reference typing problems
- inconsistent data passed between components
- UI elements becoming disconnected from backend responses

For example, one issue involved state being referenced before the corresponding setter had been correctly defined.

Another class of problems involved map/reference data where the expected type did not match the actual data structure.

These problems were resolved by tightening component state management and making the data contracts between components more explicit.

---

## 11. API Error Handling

Initially, an API failure could easily appear as a broken UI component.

```text
API Failure
    ↓
No Data
    ↓
Component Receives Empty Value
    ↓
UI Appears Broken
```

The frontend was therefore developed to distinguish between:

```text
Loading
   ↓
Success
   ↓
Empty Result
   ↓
Error
```

This is important for a research platform because an empty result is not necessarily the same thing as a system failure.

---

## 12. Loading and Empty States

Research queries may take time because retrieval and processing can involve multiple backend services.

The frontend therefore needs explicit loading states instead of leaving the interface visually frozen.

```text
User submits query
        ↓
Loading state
        ↓
Backend response
        ├── Results
        ├── Empty result
        └── Error
```

Each state should communicate clearly what the system is doing.

---

## 13. Component-Based Development

Instead of creating one extremely large page, the interface was developed as reusable UI sections.

```text
Page
 ├── Navigation
 ├── Header
 ├── Search / Controls
 ├── Content Section
 │    ├── Resource
 │    ├── Dataset
 │    ├── Media
 │    └── Knowledge
 └── Footer / Supporting UI
```

This makes individual sections easier to modify without destabilizing unrelated parts of the interface.

---

## 14. Responsive Design

The interface was designed with different screen sizes in mind.

The layout needs to remain usable across:

- desktop
- laptop
- tablet
- smaller screens

The main principle is that information hierarchy should survive screen-size changes.

Desktop:

```text
┌──────────────┬──────────────────────┐
│ Navigation   │ Main Research Area   │
│              │                      │
│              │                      │
└──────────────┴──────────────────────┘
```

can become, on smaller screens:

```text
┌─────────────────────────┐
│ Navigation              │
├─────────────────────────┤
│ Research Area           │
│                         │
│                         │
└─────────────────────────┘
```

without changing the underlying workflow.

---

## 15. Visual Hierarchy

One of the recurring design problems was balancing the amount of information displayed on a research dashboard.

- Too little information makes the platform look unfinished.
- Too much information makes it difficult to understand.

The solution was to prioritize information hierarchically:

| Level     | Purpose                              |
|-----------|--------------------------------------|
| Primary   | Main research action                 |
| Secondary | Supporting information               |
| Tertiary  | Metadata / additional context        |

This keeps the interface useful without turning every section into a large information wall.

---

## 16. Frontend Development Process

The frontend evolved through several iterations.

```text
Initial Layout
      ↓
Connect API
      ↓
Add Real Data
      ↓
Identify UI Problems
      ↓
Fix State / Type Issues
      ↓
Improve Navigation
      ↓
Improve Visual Hierarchy
      ↓
Docker Integration
      ↓
Final Stabilization
```

This iterative approach was necessary because several problems only became visible after real backend responses were connected to the interface.

---

## 17. Docker Integration

The frontend is designed to run as part of the complete POLARIS environment.

```text
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌───────────┐       ┌───────────┐          │
│  │ Frontend  │ ────> │ Backend   │          │
│  └───────────┘       └─────┬─────┘          │
│                            │                │
│                     ┌──────┴──────┐         │
│                     │             │         │
│                PostgreSQL       Redis       │
│                                             │
│                        Worker               │
└─────────────────────────────────────────────┘
```

This makes it possible to reproduce the complete application environment instead of manually starting every service independently.

---

## 18. Running the Frontend

From the project root:

```bash
docker compose up --build
```

The frontend can then be accessed through the configured frontend port.

For direct local development:

```bash
cd frontend
npm install
npm run dev
```

The exact API URL should be configured through the frontend environment configuration rather than hardcoded into components.

---

## 19. Development Lessons

### 1. A working UI is not the same as a working product
Static cards and mock data can make an interface look finished. The real test begins when the UI is connected to actual APIs.

### 2. API contracts matter
A small mismatch between what the backend returns and what the frontend expects can break an otherwise correct component. The frontend therefore needs predictable response structures.

### 3. State management becomes important quickly
As soon as the application includes search, loading, errors, filters, results, maps and content generation, the interface cannot rely on scattered local state without structure.

### 4. Docker changes how services communicate
A URL that works in the browser may not work from inside a container. Understanding this distinction was essential for stabilizing the complete application.

### 5. Visual simplicity requires more discipline
A minimal interface is not simply an interface with fewer components. Every element needs to justify its presence.

The goal was to make POLARIS feel like a research product rather than a generic AI dashboard.

---

## 20. Frontend ↔ Product Mapping

The frontend was designed to directly represent the major POLARIS product workflows.

| POLARIS Requirement | Frontend Workflow            |
|---------------------|------------------------------|
| Discovery           | Search / Exploration         |
| Knowledge           | Source-grounded results      |
| Multimedia          | Media discovery              |
| Dissemination       | Content Studio               |
| Education           | Learning / knowledge workflow|
| Governance          | Review-oriented workflow     |
| Impact              | Platform metrics / overview  |

This ensures that the frontend is not merely a visual prototype. Each major interface section corresponds to a capability in the overall POLARIS architecture.

---

## 21. Current Frontend Role

The frontend acts as the primary user-facing layer of POLARIS.

It connects users to:

- Datasets
- Documents
- Publications
- Multimedia
- Knowledge Retrieval
- Content Generation
- Research Workflows

while keeping the underlying processing infrastructure hidden behind the backend API.

---

## 22. Future Improvements

Potential frontend improvements include:

- richer research visualization
- advanced search filters
- improved dataset exploration
- map-based research discovery
- more detailed resource relationships
- stronger accessibility
- improved mobile layouts
- richer content authoring
- authentication-aware interfaces
- user workspaces
- saved research collections
- improved loading and error experiences

---

## 23. Final Architecture

The complete frontend interaction model can be summarized as:

```text
                       USER
                         │
                         ▼
                ┌─────────────────┐
                │ POLARIS FRONTEND│
                └────────┬────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
      Discovery       Knowledge       Content
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                  API Integration
                         │
                         ▼
                ┌─────────────────┐
                │ POLARIS BACKEND │
                └────────┬────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Database     Redis      Worker
              │          │          │
              └──────────┼──────────┘
                         ▼
                  Research Data
```

The frontend therefore serves as the interaction layer connecting the user to the larger POLARIS knowledge infrastructure.