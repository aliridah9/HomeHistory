import React from 'react';

const Landing = React.lazy(() => import('@/features/landing/Landing'));
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Landing />
    </div>
  );
}
