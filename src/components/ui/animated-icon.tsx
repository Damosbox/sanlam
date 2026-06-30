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
 * Wraps a Lucide icon and plays a subtle "burst" animation on every
 * mouseenter of the closest interactive parent. Each sub-shape of the SVG
 * translates slightly away from the icon's center (then springs back),
 * giving the impression that the icon's pieces gently separate without
 * ever disappearing.
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
    let animating = false;

    const onEnter = () => {
      if (animating) return;
      const svg = wrapper.querySelector("svg");
      if (!svg) return;
      const shapes = svg.querySelectorAll<SVGGeometryElement>(
        "path, line, polyline, polygon, circle, rect, ellipse"
      );
      if (!shapes.length) return;
      // Viewbox center (Lucide icons are 24x24 with the visual centre at 12,12)
      const vb = svg.viewBox?.baseVal;
      const cx = vb && vb.width ? vb.x + vb.width / 2 : 12;
      const cy = vb && vb.height ? vb.y + vb.height / 2 : 12;
      // Distance to translate each shape outward, in SVG user units.
      const SPREAD = 1.6;

      animating = true;
      shapes.forEach((shape) => {
        shape.style.transformBox = "fill-box";
        shape.style.transformOrigin = "center";
      });

      const animations = Array.from(shapes).map((shape, idx) => {
        // Compute the shape's centre in SVG coordinates.
        let bx = cx;
        let by = cy;
        try {
          const b = shape.getBBox();
          bx = b.x + b.width / 2;
          by = b.y + b.height / 2;
        } catch {
          /* noop */
        }
        let dx = bx - cx;
        let dy = by - cy;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) {
          // Shape sits dead-centre — push it on a deterministic diagonal so
          // it still participates in the burst instead of staying frozen.
          const angle = (idx / shapes.length) * Math.PI * 2;
          dx = Math.cos(angle);
          dy = Math.sin(angle);
        } else {
          dx /= len;
          dy /= len;
        }
        const tx = +(dx * SPREAD).toFixed(3);
        const ty = +(dy * SPREAD).toFixed(3);

        return animate(
          shape,
          { transform: ["translate(0px, 0px)", `translate(${tx}px, ${ty}px)`, "translate(0px, 0px)"] },
          {
            duration: 0.45,
            delay: idx * 0.025,
            ease: [0.34, 1.56, 0.64, 1],
          }
        );
      });

      Promise.all(animations.map((a) => a.finished ?? a)).finally(() => {
        shapes.forEach((shape) => {
          shape.style.transform = "";
          shape.style.transformBox = "";
          shape.style.transformOrigin = "";
        });
        animating = false;
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