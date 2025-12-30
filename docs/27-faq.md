# Frequd Questions (FAQ)

Common questions about Twenty and their answers.

## General Questions

### What is Twenty?

Twenty is an open-source CRM (Customer Relationship Management) system built with modern technologies. It provides a flexible, customizable alternative to proprietary CRM solutions like Salesforce or HubSpot.

### Why should I use Twenty?

- **Open Source** - Full transparency and community-driven
- **Self-Hostable** - Complete control over your data
- **Modern UI** - Inspired by Notion, Airtable, and Linear
- **Customizable** - Create custom objects and fields
- **Free** - No per-user pricing or feature limitations
- **Extensible** - Plugin system (coming soon)

### Is Twenty production-ready?

Yes, Twenty is production-ready for core CRM features. However:
- Plugin system is still in development
- Some advanced features are being added
- Regular updates and improvements are ongoing

### How does Twenty compare to other CRMs?

| Feature | Twenty | Salesforce | HubSpot | SuiteCRM |
|---------|--------|------------|---------|----------|
| Open Source | ✅ | ❌ | ❌ | ✅ |
| Self-Hosting | ✅ | ❌ | ❌ | ✅ |
| Modern UI | ✅ | ⚠️ | ✅ | ❌ |
| GraphQL API | ✅ | ❌ | ⚠️ | ❌ |
| Free | ✅ | ❌ | ⚠️ | ✅ |

## Installation & Setup

### What are the system requirements?

**Minimum:**
- Node.js v24.5.0
- 2GB RAM
- 10GB disk space
- PostgreSQL 15
- Redis 7

**Recommended:**
- Node.js v24.5.0
- 4GB RAM
- 20GB disk space
- PostgreSQL 15
- Redis 7
- Docker

### Can I run Twenty on Windows?

Yes, but we recommend using WSL2 (Windows Subsystem for Linux) for better compatibility. Native Windows support is available but may have some limitations.

### Do I need Docker?

Docker is recommended but not required:
- **With Docker:** Easiest setup, consistent environment
- **Without Docker:** Manual PostgreSQL and Redis installation needed

### How long does setup take?

- **Docker setup:** 10-15 minutes
- **Local development:** 20-30 minutes
- **Production deployment:** 30-60 minutes

## Development

### What technologies does Twenty use?

**Frontend:**
- React 18, TypeScript, Recoil, Apollo Client, Vite

**Backend:**
- NestJS, GraphQL Yoga, TypeORM, PostgreSQL, Redis

**Tools:**
- Nx (monorepo), Jest (testing), Storybook (components)

See [Technology Stack](./06-technology-stack.md) for details.

### How do I contribute?

1. Fork the repository
2. Set up development environment
3. Create a feature branch
4. Make your changes
5. Submit a pull request

See [Contributing Guide](./21-contributing.md) for details.

### Where should I start as a new contributor?

1. **Good First Issues** - Look for issues labeled "good first issue"
2. **Documentation** - Improve docs, fix typos
3. **Tests** - Add missing tests
4. **Bug Fixes** - Fix reported bugs

### How do I run tests?

```bash
# All tests
yarn test

# Specific package
nx test twenty-front

# Watch mode
yarn test --watch

# E2E tests
cd packages/twenty-e2e-testing
yarn test:e2e
```

## Features

### Can I customize objects and fields?

Yes! Twenty allows you to:
- Create custom objects (e.g., Projects, Invoices)
- Add custom fields to any object
- Define relationships between objects
- Set validation rules

### Does Twenty support workflows?

Yes, Twenty includes workflow automation:
- Triggers (record created, updated, deleted)
- Actions (send email, create record, call webhook)
- Conditions (if/then logic)
- Scheduled workflows

### Can I import my existing data?

Yes, Twenty supports:
- CSV import
- API-based import
- Bulk operations via GraphQL
- Migration scripts

### Does Twenty have a mobile app?

Not yet. Mobile apps are in the planning phase. Currently, the web interface is responsive and works on mobile browsers.

### Can I integrate with other tools?

Yes, through:
- **GraphQL API** - Custom integrations
- **REST API** - Legacy integrations
- **Webhooks** - Event-driven integrations
- **Zapier** - No-code integrations (available)
- **Plugins** - Coming soon

## Deployment

### Where can I deploy Twenty?

- **Self-hosted:** Your own servers
- **Cloud platforms:** AWS, GCP, Azure, DigitalOcean
- **PaaS:** Render, Railway, Heroku
- **Kubernetes:** Production-grade orchestration

### How do I deploy to production?

See [Deployment Guide](./18-deployment.md) for detailed instructions.

Quick options:
- Docker Compose (simplest)
- Kubernetes (scalable)
- Cloud platforms (managed)

### What about scaling?

Twenty is designed to scale:
- **Horizontal:** Add more server instances
- **Vertical:** Increase server resources
- **Database:** Read replicas, connection pooling
- **Caching:** Redis for performance

### How do I backup my data?

```bash
# PostgreSQL backup
docker exec twenty-postgres pg_dump -U twenty default > backup.sql

# Restore
docker exec -i twenty-postgres psql -U twenty default < backup.sql

# Automated backups
# Set up cron job or use cloud backup services
```

## Security

### Is Twenty secure?

Yes, Twenty implements:
- JWT authentication
- Password hashing (bcrypt)
- SQL injection prevention
- XSS protection
- CSRF protection
- HTTPS/TLS support

### How is data isolated between workspaces?

Twenty uses multi-tenant architecture:
- Separate database schemas per workspace
- Row-level security
- Workspace-scoped queries
- Access control checks

### Can I use SSO?

Yes, Twenty supports:
- Google OAuth
- Microsoft OAuth
- SAML (enterprise)
- Custom OAuth providers

### How are passwords stored?

Passwords are:
- Hashed with bcrypt
- Salted automatically
- Never stored in plain text
- Never logged or exposed

## API

### What APIs does Twenty provide?

- **GraphQL API** - Primary API (recommended)
- **REST API** - Legacy support
- **WebSocket API** - Real-time updates

### How do I authenticate API requests?

```bash
# Get access token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in requests
curl http://localhost:3001/graphql \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ companies { edges { node { name } } } }"}'
```

### Is there an SDK?

Yes, Twenty provides:
- **JavaScript/TypeScript SDK** - Official SDK
- **REST clients** - Any HTTP client
- **GraphQL clients** - Apollo, Relay, etc.

### What are the rate limits?

Default rate limits:
- 100 requests per minute per IP
- 1000 requests per hour per user
- Configurable in production

## Troubleshooting

### Why won't my server start?

Common causes:
1. Port already in use
2. Database not running
3. Missing environment variables
4. Dependency issues

See [Troubleshooting Guide](./26-troubleshooting.md).

### Why are my tests failing?

Try:
```bash
# Clear cache
yarn test --clearCache
nx reset

# Reinstall dependencies
rm -rf node_modules
yarn install

# Run tests again
yarn test
```

### How do I reset my database?

```bash
cd packages/twenty-server

# WARNING: This deletes all data
yarn database:reset

# Run migrations
yarn database:migrate

# Seed with sample data
yarn database:seed
```

### Where can I get help?

- **Documentation:** https://docs.twenty.com
- **Discord:** https://discord.gg/cx5n4Jzs57
- **GitHub Issues:** Bug reports
- **GitHub Discussions:** Questions
- **Troubleshooting Guide:** [Link](./26-troubleshooting.md)

## Licensing

### What license does Twenty use?

Twenty is licensed under **AGPL-3.0**, which means:
- ✅ Free to use
- ✅ Free to modify
- ✅ Free to distribute
- ⚠️ Must disclose source code
- ⚠️ Must use same license
- ⚠️ Network use = distribution

### Can I use Twenty commercially?

Yes, you can use Twenty for commercial purposes under AGPL-3.0. However:
- You must disclose your source code
- Modifications must be open-sourced
- Network use requires source disclosure

For proprietary use, contact the Twenty team about commercial licensing.

### Can I sell Twenty?

You can:
- Sell hosting services
- Sell support services
- Sell customization services
- Sell training services

You cannot:
- Sell Twenty itself as proprietary software
- Remove the AGPL license
- Close-source modifications

## Performance

### How many records can Twenty handle?

Twenty can handle:
- Millions of records
- Thousands of concurrent users
- Complex queries and relationships

Performance depends on:
- Hardware resources
- Database optimization
- Caching configuration
- Query complexity

### How do I optimize performance?

1. **Database:**
   - Add indexes
   - Use connection pooling
   - Enable query caching

2. **Backend:**
   - Use Redis caching
   - Enable compression
   - Optimize queries

3. **Frontend:**
   - Enable code splitting
   - Use Apollo cache
   - Lazy load components

## Roadmap

### What features are coming?

See the [official roadmap](https://github.com/orgs/twentyhq/projects/1).

Upcoming features:
- Plugin system
- Mobile apps
- Advanced analytics
- AI integrations
- More integrations

### How can I request a feature?

1. Check existing feature requests
2. Create GitHub issue with "feature request" label
3. Describe use case and benefits
4. Engage with community discussion

### Can I sponsor development?

Yes! You can:
- Sponsor the project on GitHub
- Hire the team for custom development
- Contribute code directly
- Support through cloud hosting

## Community

### How can I get involved?

- **Code:** Contribute features and fixes
- **Documentation:** Improve docs
- **Testing:** Report bugs and test features
- **Support:** Help others on Discord
- **Translation:** Translate to your language

### Where is the community?

- **Discord:** https://discord.gg/cx5n4Jzs57
- **GitHub:** https://github.com/twentyhq/twenty
- **Twitter:** https://twitter.com/twentycrm
- **LinkedIn:** https://www.linkedin.com/company/twenty/

### How do I stay updated?

- Star the GitHub repository
- Watch for releases
- Join Discord
- Follow on Twitter
- Subscribe to newsletter

## Still Have Questions?

- Check the [documentation](./README.md)
- Ask on [Discord](https://discord.gg/cx5n4Jzs57)
- Search [GitHub Discussions](https://github.com/twentyhq/twenty/discussions)
- Create a [GitHub Issue](https://github.com/twentyhq/twenty/issues)

---

**Related Documentation:**
- [Project Overview](./01-project-overview.md)
- [Quick Start](./02-quick-start.md)
- [Troubleshooting](./26-troubleshooting.md)

