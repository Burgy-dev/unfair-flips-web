import { useEffect, useRef } from "react";

type HistoryLogProps = {
  entries: string[];
};

export default function HistoryLog({ entries }: HistoryLogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  const lastIndex = entries.length - 1;

  return (
    <div ref={containerRef} className="history-log">
      {entries.map((entry, index) => (
        <div
          key={index}
          className={`history-entry ${index === lastIndex ? "history-entry--new" : ""}`}
        >
          {entry}
        </div>
      ))}
    </div>
  );
}
