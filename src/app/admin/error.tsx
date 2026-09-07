'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="ad-access-denied" role="alert"><h1>We couldn’t load the admin console.</h1><p>Please try again. Your changes and account data are stored safely.</p><button onClick={reset}>Try again</button></div>; }
