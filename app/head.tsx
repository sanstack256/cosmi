// app/head.tsx
export default function Head() {
  return (
    <>
      <title>Cosmi</title>

      {/* Basic meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Cosmi — smart invoicing for freelancers & small teams" />

      {/* Favicon(s) */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* optional: web manifest if you have PWA assets */}
      <link rel="manifest" href="/site.webmanifest" />
    </>
  );
}
