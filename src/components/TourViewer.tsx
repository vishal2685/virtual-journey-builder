
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Scene, Hotspot } from "@/pages/Index";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TourViewerProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneChange: (id: string) => void;
  onScenesUpdate: (scenes: Scene[]) => void;
}

export const TourViewer = ({
  scenes,
  activeSceneId,
  onSceneChange,
  onScenesUpdate,
}: TourViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const isMouseDown = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });
  const isAddingHotspot = useRef(false);
  const { toast } = useToast();
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(rendererRef.current.domElement);

    // Set initial camera position
    if (cameraRef.current) {
      cameraRef.current.position.z = 0.1;
    }

    // Load the active scene
    const activeScene = scenes.find((s) => s.id === activeSceneId);
    if (activeScene) {
      loadScene(activeScene);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Add event listeners for 360° view control
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current || !cameraRef.current) return;

      const deltaX = e.clientX - mousePosition.current.x;
      const deltaY = e.clientY - mousePosition.current.y;

      cameraRef.current.rotation.y -= deltaX * 0.005;
      cameraRef.current.rotation.x -= deltaY * 0.005;

      // Limit vertical rotation
      cameraRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, cameraRef.current.rotation.x)
      );

      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycaster.current.intersectObjects(sceneRef.current.children);

      if (isAddingHotspot.current) {
        const direction = new THREE.Vector3(mouse.current.x, mouse.current.y, 0.5);
        direction.unproject(cameraRef.current);
        direction.sub(cameraRef.current.position).normalize();
        direction.multiplyScalar(500);

        const newHotspot: Hotspot = {
          id: crypto.randomUUID(),
          position: { x: direction.x, y: direction.y, z: direction.z },
          targetSceneId: "",
          title: "New Hotspot",
        };

        const updatedScenes = scenes.map((scene) => {
          if (scene.id === activeSceneId) {
            return {
              ...scene,
              hotspots: [...scene.hotspots, newHotspot],
            };
          }
          return scene;
        });

        onScenesUpdate(updatedScenes);
        toast({
          title: "Hotspot added",
          description: "Click on the hotspot to select a target scene",
        });
        isAddingHotspot.current = false;
      } else if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const hotspotId = clickedObject.userData.hotspotId;
        if (hotspotId) {
          const activeScene = scenes.find((s) => s.id === activeSceneId);
          const clickedHotspot = activeScene?.hotspots.find(
            (h) => h.id === hotspotId
          );
          if (clickedHotspot) {
            if (clickedHotspot.targetSceneId) {
              onSceneChange(clickedHotspot.targetSceneId);
            } else {
              setSelectedHotspot(clickedHotspot);
            }
          }
        }
      }
    };

    const element = containerRef.current;
    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mouseleave", handleMouseUp);
    element.addEventListener("click", handleClick);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mouseleave", handleMouseUp);
      element.removeEventListener("click", handleClick);

      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [activeSceneId, scenes, onSceneChange, onScenesUpdate]);

  const loadScene = (scene: Scene) => {
    if (!sceneRef.current) return;

    // Clear existing scene
    while (sceneRef.current.children.length > 0) {
      sceneRef.current.remove(sceneRef.current.children[0]);
    }

    // Load 360° image as sphere
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(scene.image);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    sceneRef.current.add(sphere);

    // Add hotspots
    scene.hotspots.forEach((hotspot) => {
      addHotspotToScene(hotspot);
    });
  };

  const addHotspotToScene = (hotspot: Hotspot) => {
    if (!sceneRef.current) return;

    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: hotspot.targetSceneId ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      hotspot.position.x,
      hotspot.position.y,
      hotspot.position.z
    );
    mesh.userData.hotspotId = hotspot.id;
    sceneRef.current.add(mesh);
  };

  const toggleHotspotMode = () => {
    isAddingHotspot.current = !isAddingHotspot.current;
    toast({
      title: isAddingHotspot.current ? "Adding hotspot" : "Cancelled hotspot addition",
      description: isAddingHotspot.current
        ? "Click anywhere in the scene to add a hotspot"
        : "Hotspot mode disabled",
    });
  };

  const handleHotspotLink = (targetSceneId: string) => {
    if (!selectedHotspot) return;

    const updatedScenes = scenes.map((scene) => {
      if (scene.id === activeSceneId) {
        return {
          ...scene,
          hotspots: scene.hotspots.map((h) =>
            h.id === selectedHotspot.id
              ? { ...h, targetSceneId }
              : h
          ),
        };
      }
      return scene;
    });

    onScenesUpdate(updatedScenes);
    setSelectedHotspot(null);
    toast({
      title: "Hotspot linked",
      description: "Click the hotspot to navigate to the linked scene",
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 right-6 flex gap-2">
        <Button
          onClick={toggleHotspotMode}
          variant={isAddingHotspot.current ? "secondary" : "outline"}
          size="icon"
          className="rounded-full shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {selectedHotspot && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Select Target Scene</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {scenes
                .filter((scene) => scene.id !== activeSceneId)
                .map((scene) => (
                  <DropdownMenuItem
                    key={scene.id}
                    onSelect={() => handleHotspotLink(scene.id)}
                  >
                    {scene.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
