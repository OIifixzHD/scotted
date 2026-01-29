# Scotted - Short Form Video Platform

[aureliabutton]

Pulse is a high-energy, visually immersive short-form video platform designed to rival modern social video apps. Built on the edge, it leverages Cloudflare Durable Objects for real-time user interactions and video metadata management. The core experience revolves around an infinite scroll feed of short videos, presented in a sleek, dark-themed UI dominated by deep purples and neon accents.

## Key Features

- **Immersive Feed**: A full-screen, snap-scrolling video player that autoplays content with overlay controls for liking, commenting, and sharing.
- **User Profiles**: Visually rich profile pages displaying user stats (followers, likes) and a masonry grid of uploaded content.
- **Content Creation Studio**: A simplified upload interface allowing users to post video URLs with captions and tags, featuring preview modes.
- **Social Graph**: Real-time Follow/Unfollow functionality backed by Durable Objects to maintain consistent follower counts and relationships.
- **Interactive Sidebar**: A collapsible navigation rail providing quick access to Home, Trending, Profile, and Settings with glassmorphism effects.
- **Edge-Native Architecture**: Powered by Cloudflare Workers and Durable Objects for low-latency performance and global scalability.

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS, Shadcn UI, Lucide React
- **Animations**: Framer Motion, Tailwind Animate
- **State Management**: Zustand, TanStack Query
- **Routing**: React Router 6

### Backend & Infrastructure
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Storage**: Cloudflare Durable Objects (Single Global DO pattern)
- **Language**: TypeScript (Full-stack type safety)

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.0.0 or higher)
- A Cloudflare account (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pulse-video-social
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Development

To start the development server with hot reload:

```bash
bun run dev
```

This command starts the Vite development server. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Project Structure

- `src/`: Frontend React application
  - `components/`: Reusable UI components (Shadcn UI)
  - `pages/`: Application views (Home, Profile, Studio)
  - `hooks/`: Custom React hooks
  - `lib/`: Utilities and API clients
- `worker/`: Cloudflare Workers backend
  - `index.ts`: Worker entry point
  - `user-routes.ts`: API route definitions
  - `entities.ts`: Durable Object entity definitions
  - `core-utils.ts`: Core storage utilities (DO NOT MODIFY)
- `shared/`: Shared types between frontend and backend

## Deployment

This project is configured for deployment on Cloudflare Workers.

[aureliabutton]

### Manual Deployment

To deploy the application to your Cloudflare account manually:

1. Login to Cloudflare via Wrangler:
   ```bash
   bun x wrangler login
   ```

2. Deploy the project:
   ```bash
   bun run deploy
   ```

This will build the frontend assets and deploy the Worker script along with the Durable Object configuration.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
