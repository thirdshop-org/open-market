import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { authService, type User } from "@/lib/pocketbase";
import { useEffect, useState } from "react";

export function UserNavbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  const username = user?.name || user?.username;

  return (
    <div className="flex items-center space-x-2 ml-4 pl-4">
        <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{username}</span>
        </div>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="ml-2"
        >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
        </Button>
    </div>
  )
}