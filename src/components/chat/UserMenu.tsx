import { User, LogOut } from "lucide-react";

export function UserMenu({ username, onLogout }: { username: string; onLogout: () => void }) {
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    onLogout();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <User className="size-4 text-muted-foreground" />
      <span className="text-foreground">{username}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Logout"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
