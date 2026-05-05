"use client";

import { useEffect, useState } from "react";

interface TopBarProps {
  crumb: string[];
  right?: React.ReactNode;
}

export default function TopBar({ crumb, right }: TopBarProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-shrink-0 items-center justify-between px-[18px]"
      style={{
        height: 40,
        borderBottom: "1px solid var(--rule)",
        background: "var(--bg-card)",
        fontSize: 12,
        color: "var(--ink-2)",
      }}
    >
      <div className="flex items-center gap-2">
        {crumb.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span style={{ color: "var(--ink-3)", fontSize: 10 }}>›</span>
            )}
            <span
              style={{
                color:
                  i === crumb.length - 1 ? "var(--ink)" : "var(--ink-2)",
                fontWeight: i === crumb.length - 1 ? 600 : 500,
              }}
            >
              {c}
            </span>
          </span>
        ))}
      </div>
      <div
        className="mono flex items-center gap-3.5"
        style={{ fontSize: 10.5, color: "var(--ink-3)" }}
      >
        {right || (
          <>
            <span>JST · {time}</span>
            <span
              className="inline-block"
              style={{ width: 1, height: 12, background: "var(--rule)" }}
            />
            <span>license tlap_••a3f1</span>
          </>
        )}
      </div>
    </div>
  );
}
