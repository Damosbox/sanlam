import { ElementType, useEffect, useRef, createElement } from "react";
import { animate } from "motion";

interface AnimatedIconProps {
  icon: ElementType;
  className?: string;
  /**
   * Optional CSS selector for the parent element whose hover triggers the
   * draw-on animation. Defaults to the closest sidebar menu button or button.
   */
  triggerSelector?: string;
}

/**
 * Wraps a Lucide icon and replays a "draw-on" animation (stroke-dashoffset
 * from full length → 0) on every mouseenter of the closest sidebar menu
 * button. Each path of the SVG is animated individually so the trace appears
 * stroke by stroke. After completion the inline styles are cleared so the
 * icon returns to its crisp default rendering.
 */
export function AnimatedIcon({
  icon: Icon,
  className,
  triggerSelector = '[data-sidebar="menu-button"], a, button',
}: AnimatedIconProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const trigger =
      (wrapper.closest(triggerSelector) as HTMLElement | null) ?? wrapper;

    const onEnter = () => {
      const svg = wrapper.querySelector("svg");
      if (!svg) return;
      const shapes = svg.querySelectorAll<SVGGeometryElement>(
        "path, line, polyline, polygon, circle, rect, ellipse"
      );
      shapes.forEach((shape, idx) => {
        let length = 0;
        try {
          length = shape.getTotalLength();
        } catch {
          length = 0;
        }
        if (!length || !Number.isFinite(length)) return;

        shape.style.strokeDasharray = `${length}`;
        shape.style.strokeDashoffset = `${length}`;

        animate(
          shape,
          { strokeDashoffset: [length, 0] },
          {
            duration: 0.28,
            delay: idx * 0.03,
            ease: [0.65, 0, 0.35, 1],
          }
        ).then(() => {
          // Clear inline styles so the icon renders crisply at rest.
          shape.style.strokeDasharray = "";
          shape.style.strokeDashoffset = "";
        });
      });
    };

    trigger.addEventListener("mouseenter", onEnter);
    return () => trigger.removeEventListener("mouseenter", onEnter);
  }, [triggerSelector]);

  return (
    <span ref={wrapperRef} className="inline-flex shrink-0">
      {createElement(Icon, { className })}
    </span>
  );
}