import { useRef, MouseEvent } from "react";

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Only scroll with primary (left) mouse click
    if (e.button !== 0) return;
    const container = ref.current;
    if (!container) return;

    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    scrollLeft.current = container.scrollLeft;
    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDown.current) return;
    const container = ref.current;
    if (!container) return;

    e.preventDefault();
    const x = e.clientX;
    const dx = x - startX.current;
    
    // Set dragged threshold to prevent accidental clicks
    if (Math.abs(dx) > 5) {
      hasDragged.current = true;
    }
    
    container.scrollLeft = scrollLeft.current - dx;
  };

  const onMouseUpOrLeave = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const container = ref.current;
    if (container) {
      container.style.cursor = "grab";
      container.style.removeProperty("user-select");
    }
  };

  const onClickCapture = (e: MouseEvent) => {
    // If the mouse was dragged, prevent the click from executing
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDragged.current = false;
    }
  };

  return {
    ref,
    props: {
      ref,
      onMouseDown,
      onMouseMove,
      onMouseUp: onMouseUpOrLeave,
      onMouseLeave: onMouseUpOrLeave,
      onClickCapture,
      style: { cursor: "grab" }
    }
  };
}
