import { Bell, Grid3x3, Moon, Search, Play } from "lucide-react";

const Topbar = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Play className="h-4 w-4 fill-current" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Flowbite</span>
      </div>

      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search"
          className="h-10 w-full rounded-lg border border-topbar-border bg-topbar-input pl-9 pr-3 text-sm text-topbar-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="rounded-full p-2 text-topbar-foreground/80 hover:bg-topbar-input hover:text-topbar-foreground">
          <Bell className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-topbar-foreground/80 hover:bg-topbar-input hover:text-topbar-foreground">
          <Grid3x3 className="h-5 w-5" />
        </button>
        <button className="rounded-full p-2 text-topbar-foreground/80 hover:bg-topbar-input hover:text-topbar-foreground">
          <Moon className="h-5 w-5" />
        </button>
        <div className="ml-1 h-9 w-9 overflow-hidden rounded-full ring-2 ring-topbar-border">
          <div className="h-full w-full bg-gradient-to-br from-chart-2 to-primary" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;