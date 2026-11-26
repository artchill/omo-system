"use client";

import { useState } from "react";

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function DetailTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      {/*
        Four tabs with counts do not fit a narrow phone, so the bar scrolls
        sideways rather than stretching the page. Labels never wrap, which
        would otherwise make the tabs different heights.
      */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-edge [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-foreground"
            }`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabs.map((tab) =>
        tab.id === active ? (
          <div key={tab.id}>{tab.content}</div>
        ) : null,
      )}
    </div>
  );
}
