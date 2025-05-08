import Link from 'next/link';
import { UserNav } from './user-nav';
import { Button } from '@/components/ui/button';
import { ClipboardList, LogIn, UserPlus, PlusCircle } from 'lucide-react';
import { getSession } from '@/lib/session';
import Image from 'next/image';

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          {/* Using an inline SVG for logo as per guidelines if complex, or simple text */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M15.5 10.5A3.5 3.5 0 0 0 12 7a3.5 3.5 0 0 0-3.5 3.5A3.5 3.5 0 0 0 12 14a3.5 3.5 0 0 0 3.5-3.5Z"/>
            <path d="M19 20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/>
          </svg>
          <span className="font-bold text-lg">TaskFlow</span>
        </Link>
        
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {session && (
            <>
              <Link href="/dashboard" legacyBehavior passHref>
                <Button variant="ghost" className="text-sm font-medium">
                  <ClipboardList className="mr-2 h-4 w-4" /> Tasks
                </Button>
              </Link>
              <Link href="/dashboard/tasks/new" legacyBehavior passHref>
                <Button variant="default" size="sm" className="shadow-md">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Task
                </Button>
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          {session ? (
            <UserNav />
          ) : (
            <div className="space-x-2">
              <Link href="/login" passHref legacyBehavior>
                <Button variant="outline">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
              <Link href="/register" passHref legacyBehavior>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
