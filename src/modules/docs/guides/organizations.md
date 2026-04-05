# Organizations

Organizations let you group users under a shared context with role-based access.

## Creating an organization

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "My Team" }'
```

The creator is automatically assigned the **owner** role.

## Listing organizations

Retrieve all organizations you belong to:

```bash
curl http://localhost:3000/api/organizations \
  -H "Authorization: Bearer <accessToken>"
```

## Inviting members

Invite a user by email. They receive an invitation they can accept or decline:

```bash
curl -X POST http://localhost:3000/api/organizations/<orgId>/invitations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "teammate@example.com", "role": "member" }'
```

## Switching organizations

The active organization is set via the `X-Organization-Id` header on API requests:

```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <accessToken>" \
  -H "X-Organization-Id: <orgId>"
```

In the frontend, switching organizations updates the context globally.

## Roles

| Role | Permissions |
|------|-------------|
| **owner** | Full access, manage billing, delete organization |
| **admin** | Manage members, update settings |
| **member** | Access shared resources |

Roles are enforced by CASL abilities on both the backend and frontend.

## Next steps

- [Getting Started](/docs/guides/getting-started) — initial setup
- [API Reference](/docs) — explore all organization endpoints
