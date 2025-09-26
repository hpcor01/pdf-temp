import { Draggable } from "@hello-pangea/dnd";
import { RotateCw, ScanSearch, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePreview } from "@/providers/preview-provider";
import type { ImageCardProps } from "@/types/image-card";

export function ImageCard({
  item,
  index,
  columnId,
  onRemove,
  onRotate,
}: ImageCardProps) {
  const { setPreviewImage, isPreviewerImageChecked } = usePreview();

  const handleRotate = (): void => {
    const newRotation = (item.rotation + 90) % 360;
    onRotate(columnId, item.id, newRotation);
  };

  const positionNumber = index + 1;

  const handleClick = () => {
    if (isPreviewerImageChecked) {
      setPreviewImage(item, null, true);
    }
  };

  // New zoom handler for the zoom button
  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    if (isPreviewerImageChecked) {
      setPreviewImage(item, null, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
        >
          <Card className="relative w-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
            <Button
              type="button"
              className="absolute inset-0 cursor-pointer bg-transparent border-none"
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              aria-label={`Preview image ${item.fileName}`}
            />
            <div className="absolute top-2 left-2 z-20 bg-black/70 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center select-none cursor-default">
              {positionNumber}
            </div>

            <div
              className="
                absolute top-0 left-0 w-full flex justify-center gap-2 py-2
                bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100
                transition-opacity duration-300 z-10
              "
              role="toolbar"
              aria-label="Image actions"
            >
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from triggering
                  onRemove(columnId, item.id);
                }}
                className="
                  p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                  text-gray-900 dark:text-gray-100 hover:bg-red-500 hover:text-white
                  transition-all duration-200 shadow-md
                "
                aria-label={`Remover imagem ${item.fileName}`}
              >
                <X className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from triggering
                  handleRotate();
                }}
                className="
                  p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                  text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white
                  transition-all duration-200 shadow-md
                "
                aria-label={`Rotacionar imagem ${item.fileName}`}
              >
                <RotateCw className="w-4 h-4" />
              </Button>

              {/* New zoom button */}
              <Button
                type="button"
                onClick={handleZoom}
                className="
                  p-2 rounded-full cursor-pointer bg-white/90 dark:bg-gray-800/90
                  text-gray-900 dark:text-gray-100 hover:bg-green-500 hover:text-white
                  transition-all duration-200 shadow-md
                "
                aria-label={`Zoom na imagem ${item.fileName}`}
              >
                <ScanSearch className="w-4 h-4" />
              </Button>
            </div>

            <CardContent className="p-0">
              <Image
                src={item.src}
                alt={item.fileName}
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  transform: `rotate(${item.rotation}deg)`,
                  width: "100%",
                  height: "12rem",
                  objectFit: "cover",
                }}
                className="
                  transition-transform duration-500 ease-in-out
                "
              />
            </CardContent>
          </Card>
        </li>
      )}
    </Draggable>
  );
}
