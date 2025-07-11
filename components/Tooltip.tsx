import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (visible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const PADDING = 8; // A small buffer from the edge of the viewport

      // Set initial position of the tooltip.
      // We position it relative to the trigger element using fixed positioning
      // because it's in a portal.
      const tooltipRect = tooltip.getBoundingClientRect(); // Get its dimensions
      tooltip.style.position = 'fixed';
      tooltip.style.top = `${triggerRect.top - tooltipRect.height - 8}px`; // 8px for arrow
      tooltip.style.left = `${triggerRect.left + triggerRect.width / 2}px`;

      // The base transform centers the tooltip horizontally on its 'left' coordinate.
      tooltip.style.transform = 'translateX(-50%)';

      // Now, we get the new position to check for viewport overflow.
      const finalRect = tooltip.getBoundingClientRect();
      const leftOverflow = PADDING - finalRect.left;
      const rightOverflow = finalRect.right - (screenWidth - PADDING);

      // Calculate the adjustment needed.
      let adjustment = 0;
      if (leftOverflow > 0) {
        // If it overflows on the left, we need to shift it right.
        adjustment = leftOverflow;
      } else if (rightOverflow > 0) {
        // If it overflows on the right, we need to shift it left.
        adjustment = -rightOverflow;
      }

      // Apply the final transform with the adjustment.
      if (adjustment !== 0) {
        tooltip.style.transform = `translateX(calc(-50% + ${adjustment}px))`;
      }
    }
  }, [visible, text]); // Re-run when visibility or text changes

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="p-3 bg-primary text-white dark:bg-gray-100 dark:text-gray-900 text-sm rounded-lg shadow-xl z-50 w-max max-w-sm"
          style={{ pointerEvents: 'none' }} // Prevent tooltip from capturing mouse events
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-primary dark:border-t-gray-100"></div>
        </div>,
        document.body
      )}
    </div>
  );
};