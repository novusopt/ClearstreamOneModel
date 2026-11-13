"use client";

import type { ReactNode } from "react";
import { Tabs } from "@/components/application/tabs/tabs";

export interface TabPanelSpec {
  id: string;
  label: string;
  badge?: number;
  content: ReactNode;
}

export function ProductTabs({ panels, defaultTab }: { panels: TabPanelSpec[]; defaultTab?: string }) {
  return (
    <Tabs defaultSelectedKey={defaultTab ?? panels[0]?.id}>
      <div className="overflow-x-auto border-b border-secondary bg-primary px-5 sm:px-8">
        <Tabs.List type="underline" size="md" className="before:hidden">
          {panels.map((panel) => (
            <Tabs.Item key={panel.id} id={panel.id} label={panel.label} badge={panel.badge || undefined} />
          ))}
        </Tabs.List>
      </div>
      {panels.map((panel) => (
        <Tabs.Panel key={panel.id} id={panel.id} className="px-5 py-6 sm:px-8">
          {panel.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
