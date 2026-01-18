# Project Overview

## Wy?

Twenty is a modern, open-source Customer Relationship Management (CRM) system designed to provide businesses with a flexible, customizable, and self-hostable alternative to proprietary CRM solutions.

## Why Twenty Exists

### The Problem

Traditional CRMs suffer from three major issues:

1. **Vendor Lock-in & High Costs**
   - Companies trap customer data to justify price increases
   - Switching costs are prohibitively high
   - Pricing models favor the vendor, not the customer

2. **Poor User Experience**
   - Legacy systems built on outdated technology
   - Clunky interfaces that slow down productivity
   - Lack of modern UX patterns users expect

3. **Limited Extensibility**
   - Closed ecosystems restrict customization
   - Integration challenges with other tools
   - No community-driven innovation

### The Solution

Twenty addresses these problems by being:

- **Open Source** - Full transparency, community-driven development
- **Self-Hostable** - Complete control over your data and infrastructure
- **Modern** - Built with cutting-edge technologies and UX patterns
- **Extensible** - Plugin architecture for unlimited customization
- **Community-First** - Hundreds of developers contributing

## Core Philosophy

### Open Source First

Twenty is licensed under AGPL-3.0, ensuring:
- Source code is always available
- Community can contribute improvements
- No vendor lock-in or data hostage situations
- Transparent development process

### Developer Experience

Built by developers, for developers:
- Modern tech stack (TypeScript, React, NestJS)
- Comprehensive API (GraphQL, REST, WebSockets)
- Extensive documentation
- Active community support

### User-Centric Design

Inspired by modern productivity tools:
- Notion-like customization
- Airtable-style views
- Linear-inspired workflows
- Intuitive, clean interface

## Key Features

### 1. Customizable Data Model

- **Custom Objects** - Create any business entity (Companies, Contacts, Deals, etc.)
- **Custom Fields** - Add fields with various types (text, number, date, relations, etc.)
- **Relationships** - Define one-to-many and many-to-many relationships
- **Validation Rules** - Ensure data integrity

### 2. Flexible Views

- **Table View** - Spreadsheet-like data management
- **Kanban View** - Visual pipeline management
- **Filters** - Complex filtering with multiple conditions
- **Sorting** - Multi-level sorting
- **Grouping** - Organize records by field values

### 3. Workflow Automation

- **Triggers** - React to events (record created, updated, deleted)
- **Actions** - Perform operations (send email, create record, call webhook)
- **Conditions** - Control flow with conditional logic
- **Integrations** - Connect with external services

### 4. Permissions & Security

- **Role-Based Access Control** - Define custom roles
- **Object-Level Permissions** - Control access to entire objects
- **Field-Level Permissions** - Restrict specific fields
- **Workspace Isolation** - Multi-tenant architecture

### 5. Communication Integration

- **Email Sync** - Connect Gmail, Outlook, etc.
- **Calendar Integration** - Sync events and meetings
- **File Attachments** - Store and manage documents
- **Activity Timeline** - Track all interactions

### 6. Real-time Collaboration

- **Live Updates** - See changes as they happen
- **WebSocket Support** - Instant synchronization
- **Collaborative Editing** - Multiple users working together
- **Presence Indicators** - Know who's online

### 7. Developer-Friendly API

- **GraphQL API** - Flexible, type-safe queries
- **REST API** - Traditional HTTP endpoints
- **WebSocket API** - Real-time subscriptions
- **SDK Support** - Official SDKs for popular languages

## Architecture Highlights

### Monorepo Structure

Twenty uses Nx to manage a monorepo with multiple packages:

```
twenty/
├── packages/
│   ├── twenty-front/         # React frontend application
│   ├── twenty-server/        # NestJS backend server
│   ├── twenty-ui/            # Shared UI component library
│   ├── twenty-emails/        # Email templates
│   ├── twenty-sdk/           # JavaScript/TypeScript SDK
│   ├── twenty-docs/          # Documentation site
│   ├── twenty-website/       # Marketing website
│   ├── twenty-shared/        # Shared utilities and types
│   ├── twenty-utils/         # Utility packages
│   ├── twenty-cli/           # CLI tools
│   ├── create-twenty-app/    # App scaffolding tool
│   ├── twenty-docker/        # Docker configurations
│   ├── twenty-zapier/        # Zapier integration
│   ├── twenty-e2e-testing/   # End-to-end tests
│   └── twenty-apps/          # Community and internal apps
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Recoil for state management
- Apollo Client for GraphQL
- Emotion and Linaria for styling
- Vite for build tooling

**Backend:**
- NestJS framework
- GraphQL Yoga for API
- TypeORM + TwentyORM for database
- BullMQ for job queues
- Redis for caching

**Databases:**
- PostgreSQL (primary data store)
- ClickHouse (analytics)
- Redis (cache & sessions)

### Multi-Tenant Architecture

Twenty supports multiple workspaces with complete data isolation:

```
System Database (PostgreSQL)
├── Users
├── Workspaces
└── Metadata (object & field definitions)

Workspace Databases (PostgreSQL)
├── Workspace 1 Data
├── Workspace 2 Data
└── Workspace N Data
```

## Use Cases

### Sales Teams

- Track leads and opportunities
- Manage sales pipeline
- Forecast revenue
- Monitor team performance

### Customer Support

- Manage customer tickets
- Track support interactions
- Measure response times
- Build knowledge base

### Marketing Teams

- Manage campaigns
- Track leads and conversions
- Segment audiences
- Measure ROI

### Custom Applications

- Build industry-specific CRMs
- Create internal tools
- Develop client portals
- Integrate with existing systems

## Comparison with Other CRMs

| Feature | Twenty | Salesforce | HubSpot | SuiteCRM |
|---------|--------|------------|---------|----------|
| Open Source | ✅ | ❌ | ❌ | ✅ |
| Self-Hostable | ✅ | ❌ | ❌ | ✅ |
| Modern UI | ✅ | ⚠️ | ✅ | ❌ |
| GraphQL API | ✅ | ❌ | ⚠️ | ❌ |
| Real-time Sync | ✅ | ⚠️ | ⚠️ | ❌ |
| Custom Objects | ✅ | ✅ | ✅ | ✅ |
| Workflow Automation | ✅ | ✅ | ✅ | ⚠️ |
| Plugin System | 🚧 | ✅ | ✅ | ⚠️ |

✅ Full Support | ⚠️ Partial Support | ❌ Not Available | 🚧 In Development

## Project Status

### Current Version: 0.2.1

Twenty is under active development with regular releases. The project is:

- ✅ Production-ready for core CRM features
- 🚧 Plugin system in development
- 🚧 Mobile apps in planning
- ✅ Self-hosting supported
- ✅ Cloud hosting available

### Roadmap

See the [official roadmap](https://github.com/orgs/twentyhq/projects/1) for upcoming features.

## Community & Support

### Getting Help

- **Documentation:** https://docs.twenty.com
- **Discord:** https://discord.gg/cx5n4Jzs57
- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and community support

### Contributing

Twenty welcomes contributions:

- Code contributions (features, bug fixes)
- Documentation improvements
- Translation (via Crowdin)
- Bug reports and testing
- Community support

See [Contributing Guide](./21-contributing.md) for details.

## License

Twenty is licensed under **AGPL-3.0**, which means:

- ✅ You can use it commercially
- ✅ You can modify the source code
- ✅ You can distribute it
- ⚠️ You must disclose source code of modifications
- ⚠️ You must use the same license for derivatives
- ⚠️ Network use counts as distribution

For commercial licensing options, contact the Twenty team.

## Next Steps

- [Quick Start Guide](./02-quick-start.md) - Get Twenty running
- [Development Setup](./03-development-setup.md) - Set up your dev environment
- [System Architecture](./04-system-architecture.md) - Understand the architecture

---

**Related Documentation:**
- [Technology Stack](./06-technology-stack.md)
- [Monorepo Structure](./05-monorepo-structure.md)
- [Contributing Guide](./21-contributing.md)

