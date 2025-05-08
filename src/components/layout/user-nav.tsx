'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutUser } from '@/lib/actions/auth.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter }
from 'next/navigation'; // Corrected import
import { CreditCard, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SessionPayload } from '@/types';
// A client-side action/function to get session is needed, or pass user info as prop
// For simplicity, we'll not fetch full user details here, just use a generic avatar.
// In a real app, you'd fetch user details based on session.userId.

// Placeholder for client-side session fetching if needed, or use props
async function getClientSession(): Promise<SessionPayload | null> {
  // This is tricky without an API endpoint. For now, this won't fetch real-time data
  // but could be adapted if an API route for session info is added.
  // For now, this component will assume data is passed or use generic fallbacks.
  return null; 
}


export function UserNav() {
  const { toast } = useToast();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);


  // In a real app, you might fetch user details if session is available
  // For this example, we'll just show generic info or what can be derived
  // or passed down.  Since getSession is server-side, we can't call it directly here.
  // This part needs proper handling in a real app, perhaps by passing user data
  // from a server component parent or using a client-side context/hook for auth state.

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      // Router push handled by server action redirect
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Could not log out. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* Placeholder avatar image, replace with actual user image if available */}
            <AvatarImage src="https://picsum.photos/100/100" alt="User avatar" data-ai-hint="person" />
            <AvatarFallback>
              <UserIcon className="h-4 w-4"/>
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {/* Placeholder - In real app, show user name */}
              User
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {/* Placeholder - In real app, show user email */}
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
