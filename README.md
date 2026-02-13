Buzflow
Buzflow is a small, real-time social app where users can post short updates and chat instantly. Built with a Turbo monorepo, it uses Next.js for the frontend, NestJS for the backend, WebSockets for real-time communication, and TypeScript across the stack.

Table of Contents
About
Features
Tech Stack
Architecture Overview
Getting Started
Prerequisites
Setup
Development
Scripts
Environment Variables
WebSocket Notes
Deployment
Contributing
License
Contact
1. About
Buzflow aims to be a minimal, extensible platform for posting and chatting with live updates. It focuses on real-time interaction, simple UX, and an organized monorepo that makes development and scaling straightforward.

2. Features
Create, edit, and delete short posts
Real-time chat rooms and direct messaging (via WebSockets)
Live updates for new posts and incoming messages
Authentication-ready structure (plug your preferred auth)
Modular services and shared types across frontend and backend (TypeScript)
3. Tech Stack
Frontend: Next.js (React + SSR/SSG where needed)
Backend: NestJS (REST + WebSocket gateway)
Monorepo: Turborepo (turbo)
Real-time: WebSockets (NestJS Gateway + client)
Language: TypeScript
Package manager: npm / pnpm / yarn (choose one)
4. Architecture Overview
/apps
/web — Next.js frontend
/api — NestJS backend (HTTP + WebSocket)
/packages
/shared — shared TypeScript types, utils, and DTOs
/ui — (optional) shared UI components
Communication:
HTTP endpoints for posts, user metadata, etc.
WebSocket channel(s) for chat messages and live post events
5. Getting Started
Prerequisites
Node.js (LTS recommended)
npm or pnpm or yarn
(Optional) Docker for containerized setup
Setup
Clone the repo: git clone <YOUR_REPO_URL>
Install dependencies: cd buzflow npm install (or pnpm install / yarn)
Set environment variables (see section below).
Development
Start both apps concurrently (example with npm scripts): npm run dev
Open the frontend (usually at http://localhost:3000) and backend at its configured port (e.g., 4000).
Note: If using Turborepo, you can run workspace-level dev commands that start both apps in parallel.

6. Scripts
Example package.json scripts (adjust to your repo):

dev — Start frontend and backend in development mode
dev:web — Start Next.js dev server
dev:api — Start NestJS in watch mode
build — Build both apps
start — Start production servers
lint — Run linters
test — Run tests
Example:

npm run dev:web
npm run dev:api
npx turbo run dev
7. Environment Variables
Create a .env file in the root or in each app as needed. Typical variables:

API_PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
WS_URL=ws://localhost:4000
DATABASE_URL=... (if you add persistence)
JWT_SECRET=... (if using authentication)
Keep secrets out of version control.

8. WebSocket Notes
The NestJS WebSocket Gateway handles message broadcasting and rooms.
Client connects from the Next.js app using a WebSocket client (native WebSocket, Socket.IO client, or libraries like ws or socket.io-client depending on chosen implementation).
Use shared DTO/types from /packages/shared to keep message contracts consistent between client and server.
9. Deployment
Build both apps (Next.js can be hosted on Vercel, NestJS on a Node host or cloud function).
For production WebSockets, ensure sticky sessions or use a gateway (e.g., Redis adapter for scaling Socket.IO).
Set environment variables in your hosting platform.
10. Contributing
Fork the repo, create a feature branch, and open a pull request.
Keep changes small and focused.
Use shared types for any contract changes between frontend and backend.
Run tests and linters before submitting PRs.
