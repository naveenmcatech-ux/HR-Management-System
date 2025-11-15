import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Register | HRMS Portal',
    description: 'Registration is not available through this form.',
};

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Registration</CardTitle>
        <CardDescription>New user accounts are created by an administrator.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/login" className="underline text-primary">
          Return to Login
        </Link>
      </CardContent>
    </Card>
  );
}
