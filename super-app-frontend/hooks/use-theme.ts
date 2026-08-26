'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { THEMES, ThemeOption } from '@/lib/themes'

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()

  const currentThemeObj: ThemeOption = 
    THEMES.find(t => t.id === theme) || THEMES[0]

  return {
    theme,
    setTheme,
    resolvedTheme,
    currentThemeObj,
    allThemes: THEMES
  }
}
