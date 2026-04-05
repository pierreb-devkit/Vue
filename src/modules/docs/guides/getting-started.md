# Getting Started

Welcome to the Devkit stack. This guide walks you through the initial setup and your first API call.

## Prerequisites

- **Node.js** 20+ and npm
- **MongoDB** running locally or via connection string
- **Git** for cloning the repositories

## Setup

1. Clone the Node (backend) and Vue (frontend) repositories.
2. Copy `.env.example` to `.env` in each project and fill in your values.
3. Install dependencies:

```bash
npm install
```

4. Start the development servers:

```bash
# Backend
npm run dev

# Frontend (in a separate terminal)
npm run dev
```

The API runs on `http://localhost:3000` by default and the UI on `http://localhost:8080`.

## Your first API call

Once the backend is running, you can verify it responds:

```bash
curl http://localhost:3000/api/core/status
```

You should receive a JSON response confirming the server is healthy.

## Next steps

- [Authentication](/docs/guides/authentication) — sign up, log in, and manage tokens
- [Organizations](/docs/guides/organizations) — create and manage organizations
- [API Reference](/docs) — explore every endpoint with the interactive docs
