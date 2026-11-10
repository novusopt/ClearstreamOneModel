"use client";

import { Home02, RefreshCw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ErrorState } from "@/components/site/error-state";
import "./globals.css";

/**
 * Last-resort boundary when the root layout itself fails: it replaces the whole document, so it
 * renders its own <html>/<body> and keeps the design tokens by importing the global styles.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-primary text-primary">
        <ErrorState
          code="٥٠٠"
          badge="Something went wrong"
          title="Mishkah couldn’t load"
          description={
            <>
              Please try again in a moment. Your bookmarks, notes and progress are safe on this device.
              {error.digest && <span className="mt-3 block font-mono text-xs text-quaternary">Reference: {error.digest}</span>}
            </>
          }
          actions={
            <>
              <Button size="xl" color="secondary" href="/" iconLeading={<Home02 data-icon aria-hidden="true" />}>
                Take me home
              </Button>
              <Button size="xl" iconLeading={<RefreshCw01 data-icon aria-hidden="true" />} onPress={() => reset()}>
                Try again
              </Button>
            </>
          }
        />
      </body>
    </html>
  );
}
