
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Scene, Hotspot } from "@/pages/Index";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

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
  const isAddingHotspot = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(rendererRef.current.domElement);

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

    // Cleanup
    return () => {
      if (rendererRef.current) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [activeSceneId, scenes]);

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
      color: 0xffffff,
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
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 right-6 flex gap-2">
        <Button
          onClick={toggleHotspotMode}
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
