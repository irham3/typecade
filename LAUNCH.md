# Launch playbook

This is a checklist for getting Typecade in front of people. We are
optimising for **qualified traffic** (people who actually try the app),
not vanity metrics. The order matters — do them roughly in sequence.

## 0. Pre-flight (do this BEFORE anything else)

- [ ] Production deploy is up at https://typecade.com
- [ ] All routes return 200 (`/` `/arena` `/learn` `/board` `/about` `/id` `/id/about`)
- [ ] Plausible is tracking pageviews (check dashboard Realtime tab)
- [ ] Google Search Console verified + sitemap submitted + 6 key URLs requested for indexing
- [ ] Bing Webmaster Tools verified + sitemap submitted
- [ ] Supabase keep-alive migration applied (`supabase/README.md`)
- [ ] UptimeRobot monitor live
- [ ] No 404s, no console errors on the homepage
- [ ] Tested in incognito: typing → result → share → click shared link → works end-to-end

## 1. GitHub repo polish (1 hour)

The repo's GitHub presence is one of the first things devs look at. Do all of this in one sitting.

- [ ] Set repository description (one-liner from `.github/repository.yml`)
- [ ] Set website URL to `https://typecade.com`
- [ ] Add topics: `typing-test`, `wpm`, `multiplayer`, `nextjs`, `tailwindcss`, `supabase`, `typescript`, `framer-motion`, `zustand`
- [ ] Pin this repo to your GitHub profile
- [ ] Add 3-5 useful Issues with the `good first issue` label — gives visitors something to click
- [ ] Turn on Discussions
- [ ] Add a project board (optional)

## 2. Product Hunt launch (when ready, time it carefully)

Product Hunt rewards launches that hit the front page. The algorithm
favours engagement in the first 24h.

**Best launch windows:** Tuesday–Thursday, 12:01 AM Pacific. Avoid US
holidays and major tech announcements.

**Pre-launch (1 week before):**
- [ ] Reserve the launch date on Product Hunt ("Coming Soon" page)
- [ ] Post a teaser on Twitter/X with a 15-second screen recording
- [ ] Email 10-20 friendly dev/typing people asking them to commit to upvoting on launch day

**Launch day:**
- [ ] Publish the Product Hunt page at 12:01 AM Pacific
- [ ] Title: "Typecade — Free minimalist typing test with multiplayer races"
- [ ] Tagline (60 chars): "Minimalist typing test with multiplayer races, no signup."
- [ ] First comment (from maker account): brief story, what makes it different, ask for feedback
- [ ] Reply to EVERY comment within the first 4 hours
- [ ] Share the PH link on Twitter, LinkedIn, indiehackers

**Topics:** `Productivity`, `Education`, `Developer Tools`, `Games`

## 3. Hacker News (Show HN)

HN is harder and more skeptical, but the upside is real if your post
gets traction.

- [ ] Write the post from a personal angle: "Show HN: I built a typing test because I was tired of [specific pain]"
- [ ] Include 2-3 screenshots and a screen recording link
- [ ] Be ready to defend technical choices in comments for 6+ hours
- [ ] Do NOT cross-post from PH same day (HN hates that)
- [ ] Best window: Tuesday/Wednesday 8-10 AM Eastern

## 4. Reddit

Authenticity matters more than reach. Spam gets you banned.

**Subreddits worth one targeted post each:**
- r/typing (1.2k members, very engaged)
- r/InternetIsBeautiful (showcase, gets upvotes for craft)
- r/webdev (technical angle — "How I built X")
- r/nextjs (framework-specific)
- r/Indonesia (if you're Indonesian or have Indonesian content — `/id` page is perfect)
- r/productivity (general appeal)

**Rules of thumb:**
- Wait until you have something interesting to show, not "I just launched"
- Don't post to more than 2-3 subreddits in a week
- Reply to every comment

## 5. Indie Hackers

- [ ] Post in the "Milestones" channel when you hit 100 / 1k / 10k tests taken
- [ ] Monthly progress update in "Building a typing app" thread
- [ ] Search for "typing test" threads and answer helpfully

## 6. Directory submissions (one-time)

Each takes 5 minutes, links help SEO and discoverability:

- [ ] alternativeto.net (page for Typecade as alternative to Monkeytype)
- [ ] saashub.com
- [ ] producthunt.com (separate from launch — just a listing)
- [ ] betaList.com (if still in beta)
- [ ] crunchbase.com (basic company profile)

## 7. Twitter / X

Build in public. It compounds.

- [ ] Set up `@typecade` account with the logo and the bio: "Free typing test with multiplayer races. Built by @yourhandle."
- [ ] Post once/week: dev progress, user milestones, typing tips
- [ ] Engage with @monkeytyper, @keybrcom, @typingcom — not promotion, real discussion
- [ ] Every major change → tweet a 15s screen recording

## 8. SEO compounding (long game)

SEO doesn't spike, it compounds. Keep doing these even after launch:

- [ ] Publish 1 blog post per week targeting long-tail keywords:
  - "How to type faster" (info intent)
  - "Best typing test for programmers" (comparison intent)
  - "Touch typing lessons" (learn intent)
  - "Tes mengetik online" (Indonesian)
  - Use the Learn module structure for content ideas
- [ ] Submit any new routes to GSC for indexing
- [ ] Check Search Console → Performance weekly; iterate on title/description for pages with impressions but low CTR

## 9. Track everything

Set up a weekly 15-minute review:

1. Plausible dashboard: traffic sources, top pages, top sources
2. GSC: clicks, impressions, average position by query
3. Supabase: total tests taken (this is the metric that matters)
4. Product Hunt page (if launched): upvotes, comments

If a single traffic source is >70% of total visits within the first month,
diversify. You don't want to depend on one channel.

## 10. Common pitfalls

- **Don't launch before the empty-state CTAs work.** First-time visitors
  will judge Typecade in 5 seconds. A "No active arenas" screen with
  zero context loses them.
- **Don't over-promise multiplayer.** If there are 0 active rooms, the
  page should invite the visitor to host one, not pretend people are
  playing.
- **Don't add features to fix growth.** Add analytics + the basics
  first. 80% of growth comes from distribution, not product.
- **Don't hide the typing area.** The product IS the page. SEO +
  design + share loops get people there; the typing area gets them
  to stay.

---

If you follow this for 90 days consistently, you should be at 1k+
DAUs and a non-zero organic search position for "typing test".

— typecade team