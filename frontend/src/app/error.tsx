'use client';
import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/states';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="container-x py-16">
      <ErrorState title="Something went wrong on our side" description={error.message || 'An unexpected error occurred while rendering this page.'} onRetry={reset} />
    </div>
  );
}
