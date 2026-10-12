# LA28 Fan Passport — prototype

A clickable, mobile-first prototype of a fan app for the LA28 Olympic Games. It's for trying out layout, interaction and user flow: exploring the city map, collecting pins with photo challenges, carrying batons, following sports and joining game rooms.

It is a black-and-white wireframe that runs on mock data, with no backend. "Today" in the app is Thursday, July 20, 2028, and reloading the page resets the demo.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add a Mapbox public token
npm run dev
```

The dev server listens on your local network, so you can open the printed address on your phone.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the built app |

## Testing flows

The bug button on every screen opens the debug panel. Use it to move the fan anywhere on the map (**Where**), jump to any date and time or speed up the clock (**When**), and reset the demo. Its flow gallery (`/dev/flows`) jumps straight into each challenge flow, already set up.

## Built with

React 19, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui and Mapbox GL. It's deployed on Vercel.

Conventions for working on the code are in [CLAUDE.md](CLAUDE.md).
