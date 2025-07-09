# sunra.ai Next.js Page Router Example

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app) and integrated with the sunra.ai client library.

## Getting Started

First, set up your environment variables:

```bash
cp .env.example .env.local
```

Add your sunra.ai API key to `.env.local`:

```bash
SUNRA_KEY=your-api-key-here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

This example demonstrates:

- **sunra.ai integration** - Complete setup with the sunra.ai client library
- **Server proxy** - Secure API key handling through the server proxy
- **Streaming responses** - Real-time AI model execution updates
- **File upload** - Image and file upload functionality
- **Modern UI** - Built with Tailwind CSS and modern React patterns

## sunra.ai Configuration

The app uses the sunra.ai server proxy for secure API calls. The proxy is configured in `pages/api/sunra/proxy.ts`:

```typescript
export { handler as default } from "@sunra/server-proxy/nextjs";
```

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [sunra.ai Documentation](https://docs.sunra.ai) - learn about sunra.ai features and API
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Remember to add your `SUNRA_KEY` environment variable to your Vercel deployment settings.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
