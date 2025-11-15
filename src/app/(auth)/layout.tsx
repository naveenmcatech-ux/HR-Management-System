import type React from 'react';
import Logo from '@/components/auth/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <Logo />
        {children}
      </div>
    </main>
  );
}
