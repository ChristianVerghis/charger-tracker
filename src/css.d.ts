// Side-effect CSS imports (`import './globals.css'`) need a module
// declaration under TypeScript 6+. Older TS versions tolerated them
// silently; TS 6 requires an explicit shim or `allowImportingTsExtensions`
// gymnastics. Next.js + Tailwind handles the actual CSS compilation —
// this declaration just teaches `tsc` that the import is intentional.
declare module '*.css';
