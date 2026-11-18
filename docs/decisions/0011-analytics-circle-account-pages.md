# 0011 — Live admin, visitor analytics, the circle's Start/Try/Pitch, Product Overview, name and age, account pages

- **Date:** 18 November 2026
- **Requested by:** the PM ("turn on admin page for the live production site. i need to understand all relevant analytics of visitors and cover it under privacy policy. And where they touch and drop in the funnel as well…", plus the circle, About, menu, onboarding and age changes in the same message)
- **Status:** Accepted. Applied in spec v2.8.

## Decisions (with the PM's answers to the questions asked)

**Admin on the live site.** Turned on with `ADMIN_EMAILS` and `ADMIN_PASSWORD_HASH` in Vercel (decision 0005). New admin pages:
- **Analytics** (7/30/90 days): headline numbers; visitors per day; three funnels with drop-off per step (Home sign-up through to a first published pillar; code sign-in; guests); sources, campaigns, landing pages; countries, devices, browsers, systems, ages; pillars opened and published, circle use, sign-in code health, account pages.
- **Consult requests**, with a status per request.
- **Feedback**: tallies, NPS and comments.

**Analytics are first-party.**
- The browser posts events to `/api/events`, and the server records pillar publishes. There are no third-party scripts and no cookies.
- A random visitor ID lives in local storage and a session ID in session storage. Events are linked to the account once someone is signed in, so activation and retention can be measured.
- Never stored: the IP address, the full user agent, or anything typed. Paths are stored without ids or query strings, and only the referring site is kept.
- Nothing is recorded for people under 18, browsers sending Do Not Track, automated browsers (`navigator.webdriver`) or bots.
- Anyone can turn analytics off on the Cookies page. Events are deleted after 13 months.
- Third-party analytics (Vercel Web Analytics) was rejected: custom events and funnels need Vercel Pro, and a first-party table keeps the data and the funnel in our own admin.

**Privacy Policy and Cookie Policy** describe all of the above, plus the new data: age, Idea Book, friend requests, consult requests and feedback. Consult requests and feedback are kept for up to 24 months.

**The seven-step circle (Home).**
- A **Start** button in the centre.
- **Try this pillar** on each step's card: it presets the one-tool path with that pillar, or opens that pillar in the founder's latest startup if they have one.
- An eighth stop after step 7, **Pitch**: the Founder Pack, and "investors and incubators matched to your startup: 10 in your country and up to 5 global, with public website, LinkedIn and contact details". Per the PM, the matching comes **only once AI is integrated**, so for now it is shown as *coming soon*, here and in the Founder Pack.
- Start and Try open the onboarding card beside the circle. Both cards share one draft (`lib/onboarding-store.ts`); the PM chose "keep both, shared draft".

**About** gets the same circle as **Product Overview**. On About, Start and Try link to Home (`?start=1`, `?try=<pillar>`).

**Name and age.**
- Asked at sign-up: in onboarding step 1, in the guest form, and on `/welcome` after a first sign-in by code. Editable on Profile.
- Per the PM, **all ages may use BluSlate** ("there is nothing adult about it").
- Signed-in founders see a two-step onboarding.

**The profile menu**, with the founder's name: My startups · Collaborate · Consult · Idea Book · Feedback · Profile · Admin (admins) · Log out.
- **Idea Book:** memos saved to the account, 12 ideas to pick from (starting points, not recommendations), and "Start with this".
- **Collaborate:** find a person by email and send a friend request; they see it in Collaborate and accept or decline. Only verified accounts can send or receive requests. The reply is the same whether or not the email has an account, so the page can't be used to discover who uses BluSlate. Working together on a startup comes later.
- **Consult:** "We'd love to consult you." A form takes name, email, contact number and the request. Each request is saved for admin and emailed to `CONSULT_NOTIFY_EMAIL`, an env var so the PM's personal email stays out of the public repo. There is also a "Reach out on WhatsApp" button for +91-8979484758.
- **Feedback:** five multiple-choice questions (what works, what needs work, usefulness, what next, 0–10 recommend) and an optional note.

## Legal note for review before public launch

- India's DPDP Act (s. 9) requires **verifiable parental consent** before processing a child's personal data (under 18), and forbids tracking or behavioural monitoring of children. BluSlate now lets all ages sign up. It does not track anyone who says they are under 18, and the Privacy Policy asks under-18s to use it with a parent's or guardian's knowledge. But it has **no verifiable parental consent step**.
- First-party analytics run without a consent banner. That is in line with Indian practice when disclosed, but EU visitors (ePrivacy) would normally need opt-in consent for non-essential storage.
- Both need a lawyer's view before a public or EU launch.

## Not done

- The investor and incubator directory (needs AI and sourced data).
- Working together on a startup.
- Emailing the person a friend request was sent to.
- Deleting an account from the app.
