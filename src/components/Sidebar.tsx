
import { Scene } from "@/pages/Index";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneSelect: (id: string) => void;
}

export const Sidebar = ({
  scenes,
  activeSceneId,
  onSceneSelect,
}: SidebarProps) => {
  return (
    <div className="w-64 border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Scenes</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-4 space-y-2">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                "w-full p-3 rounded-lg text-left transition-colors hover:bg-accent group",
                activeSceneId === scene.id && "bg-accent"
              )}
            >
              <div className="font-medium group-hover:text-accent-foreground">
                {scene.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {scene.hotspots.length} hotspots
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
