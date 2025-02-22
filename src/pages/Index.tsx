
import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { TourViewer } from "@/components/TourViewer";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";

export type Scene = {
  id: string;
  image: string;
  name: string;
  hotspots: Hotspot[];
};

export type Hotspot = {
  id: string;
  position: { x: number; y: number; z: number };
  targetSceneId: string;
  title: string;
};

const Index = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const newScene: Scene = {
          id: crypto.randomUUID(),
          image: e.target.result as string,
          name: file.name,
          hotspots: [],
        };
        setScenes((prev) => [...prev, newScene]);
        if (!activeSceneId) {
          setActiveSceneId(newScene.id);
        }
        toast({
          title: "Image uploaded successfully",
          description: `Added ${file.name} to your tour`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSceneSelect={setActiveSceneId}
      />
      <main className="flex-1 relative">
        {activeSceneId ? (
          <TourViewer
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSceneChange={setActiveSceneId}
            onScenesUpdate={setScenes}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <ImageUploader onUpload={handleImageUpload} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
