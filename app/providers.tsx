"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { useHydrateStores } from "@/hooks/use-hydrate-stores";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  useHydrateStores();

  return <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>;
}
