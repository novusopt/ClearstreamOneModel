"use client";

import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <ButtonUtility
      size="sm"
      color="tertiary"
      tooltip={isDark ? "Switch to light theme" : "Switch to dark theme"}
      tooltipPlacement="bottom"
      icon={isDark ? Moon01 : Sun}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}
