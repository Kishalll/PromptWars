import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Prompt Wars - Neural Battlefield for AI Prompt Engineering Combat" />
        <meta name="theme-color" content="#0a0a0f" />
        
        {/* Preload fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Prompt Wars - Neural Battlefield" />
        <meta property="og:description" content="Battle opponents in AI-powered prompt engineering combat" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Prompt Wars" />
        <meta name="twitter:description" content="Neural Battlefield for AI Combat" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}