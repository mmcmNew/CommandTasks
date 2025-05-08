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
import { useRouter } from 'next/navigation';
import { CreditCard, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CurrentUser } from '@/types';


export function UserNav() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData: CurrentUser = JSON.parse(storedUser);
        setCurrentUser(userData);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        localStorage.removeItem('currentUser'); 
      }
    }
  }, []);


  const handleLogout = async () => {
    try {
      await logoutUser(); 
      localStorage.removeItem('currentUser'); 
      setCurrentUser(null);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login'); 
      router.refresh(); // Ensure layout updates
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Could not log out. Please try again.', variant: 'destructive' });
    }
  };

  const userName = currentUser?.name;
  const userEmail = currentUser?.email;
  const userRoleName = currentUser?.roleName;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://picsum.photos/seed/${userEmail || 'default'}/100/100`} alt={userName || 'User avatar'} data-ai-hint="person" />
            <AvatarFallback>
              {userName ? userName.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4"/>}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail || 'user@example.com'}
            </p>
            {userRoleName && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                    Role: {userRoleName}
                </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled> 
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled> 
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
