# Express Sequelize CRUD Templates

Use these templates for Node.js + Express + TypeScript APIs that use Sequelize-style models, policy scopes, service objects, and serializers.

## Stack Assumptions

- Express controllers receive request/response context from a project-local base controller.
- Sequelize models use project-local base models, decorators or model definitions, scopes, and associations.
- Policies own authorization and permitted attributes.
- Services own mutations and transactions.
- Serializers own response shape for index/show/reference payloads.

## Templates

- `resource-rail-template.md` - compact model/controller/policy/service/serializer rail for one CRUD resource.

Keep project-specific auth, route prefixes, logging, migration commands, domain names, deployment steps, and test wrappers in the downstream repo.
