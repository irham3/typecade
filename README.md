<div align="center">
    <a href="https://typecade.com/">
        <img height="40" src="https://github.com/irham3/typecade/blob/f8fe6006c9c8e46d654799dceb1af5d1ac65f6d8/public/typecade-logo.svg" />
        <br />
        <strong>PLAY TYPECADE</strong>
    </a>
</div>

<br />

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

</div>

<br />

# Typecade

A free, minimalist typing platform built for people who care about speed,
accuracy, and design. Real-time multiplayer races, a 5-module touch-typing
curriculum, and global WPM leaderboards. No signup required to play.

🌐 **Live:** [typecade.com](https://typecade.com)

## Features

- **Real-time multiplayer races** — host a room or join an open arena. Live WPM bars, low-latency.
- **5-module touch-typing curriculum** — from home row to total keyboard fluency.
- **Global leaderboards** — track best WPM and accuracy per test mode and duration.
- **Anonymous play** — start a test in one click. Sign in only when you want progress saved.
- **Multi-language** — English and Indonesian text modes (`/id` for the Indonesian landing).
- **Shareable results** — every finished test has a viral `/r/<slug>` deep link with its own OG card.
- **Per-route SEO** — sitemap, robots, schema.org markup (WebApplication, Course, FAQPage, VideoGame).
- **Privacy-friendly analytics** — Plausible, no cookies, no consent banner.

## Tech stack

- **Framework:** Next.js 16 (App Router, RSC, static export)
- **Styling:** Tailwind CSS v4 with scoped design tokens
- **State:** Zustand with `persist` middleware
- **Database / Auth:** Supabase (Postgres + Auth + Realtime)
- **Animations:** Framer Motion
- **Deploy:** Static export → Cloudflare Pages
- **Analytics:** Plausible
- **OG images:** Satori / `next/og` (generated at build time)

## Getting started

```bash
git clone https://github.com/irham3/typecade.git
cd typecade
npm install
cp env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

Open <http://localhost:3000>. The typing engine works without Supabase; the
multiplayer lobby and leaderboard require it.

## Documentation

- [`ANALYTICS.md`](./ANALYTICS.md) — Plausible, Google Search Console, Bing Webmaster setup.
- [`supabase/README.md`](./supabase/README.md) — Free-tier keep-alive + UptimeRobot setup.

## License

This project is private. All rights reserved by the Typecade team.

---

Built with care by the Typecade team. Reach out via
[GitHub Issues](https://github.com/irham3/typecade/issues) for bug
reports or feature requests.