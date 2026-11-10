"use client";

import { Home02, RefreshCw01 } from "@untitledui/icons";
import { useEffect } from "react";
import { Button } from "@/components/base/buttons/button";
import { ErrorState } from "@/components/site/error-state";

/** Route error boundary: Untitled UI's 500 template. The header, footer and audio player stay. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      code="٥٠٠"
      badge="Something went wrong"
      title="This page didn’t load"
      description={
        <>
          An unexpected error stopped this page. Your bookmarks, notes and progress are safe on this device.
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
  );
}
