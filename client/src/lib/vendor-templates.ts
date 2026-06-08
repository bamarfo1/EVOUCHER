export type TemplateLayout = "classic" | "modern" | "bold" | "minimal" | "dark";

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  pageBg: string;
  heroGradient: string;
  heroText: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  headerBg: string;
  headerText: string;
  footerBg: string;
  footerText: string;
  badgeBg: string;
}

export interface VendorTemplate {
  id: string;
  name: string;
  layout: TemplateLayout;
  swatchGradient: string;
  colors: TemplateColors;
}

type ColorTheme = {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  lightBg: string;
  border: string;
  darkPageBg: string;
  darkCardBg: string;
  darkPrimary: string;
};

const THEMES: ColorTheme[] = [
  { key: "purple",  label: "Purple",  primary: "#7c3aed", secondary: "#5b21b6", accent: "#a78bfa", lightBg: "#f5f3ff", border: "#ddd6fe", darkPageBg: "#0a0612", darkCardBg: "#160c26", darkPrimary: "#c4b5fd" },
  { key: "ocean",   label: "Ocean",   primary: "#0284c7", secondary: "#0c4a6e", accent: "#38bdf8", lightBg: "#e0f2fe", border: "#bae6fd", darkPageBg: "#00111f", darkCardBg: "#001e2e", darkPrimary: "#7dd3fc" },
  { key: "sunset",  label: "Sunset",  primary: "#ea580c", secondary: "#9a3412", accent: "#fb923c", lightBg: "#fff7ed", border: "#fed7aa", darkPageBg: "#1a0900", darkCardBg: "#2d1200", darkPrimary: "#fdba74" },
  { key: "forest",  label: "Forest",  primary: "#15803d", secondary: "#14532d", accent: "#4ade80", lightBg: "#f0fdf4", border: "#bbf7d0", darkPageBg: "#071a0e", darkCardBg: "#0d2714", darkPrimary: "#86efac" },
  { key: "rose",    label: "Rose",    primary: "#e11d48", secondary: "#9f1239", accent: "#fb7185", lightBg: "#fff1f2", border: "#fecdd3", darkPageBg: "#1a0008", darkCardBg: "#2d0012", darkPrimary: "#fda4af" },
  { key: "gold",    label: "Gold",    primary: "#ca8a04", secondary: "#713f12", accent: "#fbbf24", lightBg: "#fefce8", border: "#fef08a", darkPageBg: "#130e00", darkCardBg: "#221900", darkPrimary: "#fcd34d" },
  { key: "slate",   label: "Slate",   primary: "#475569", secondary: "#1e293b", accent: "#94a3b8", lightBg: "#f8fafc", border: "#cbd5e1", darkPageBg: "#0f172a", darkCardBg: "#1e293b", darkPrimary: "#94a3b8" },
  { key: "teal",    label: "Teal",    primary: "#0d9488", secondary: "#134e4a", accent: "#2dd4bf", lightBg: "#f0fdfa", border: "#99f6e4", darkPageBg: "#00120f", darkCardBg: "#001a16", darkPrimary: "#5eead4" },
  { key: "crimson", label: "Crimson", primary: "#dc2626", secondary: "#7f1d1d", accent: "#f87171", lightBg: "#fef2f2", border: "#fecaca", darkPageBg: "#160000", darkCardBg: "#250606", darkPrimary: "#fca5a5" },
  { key: "night",   label: "Indigo",  primary: "#4338ca", secondary: "#312e81", accent: "#818cf8", lightBg: "#eef2ff", border: "#c7d2fe", darkPageBg: "#07061a", darkCardBg: "#100e2e", darkPrimary: "#a5b4fc" },
];

const LAYOUT_LABELS: Record<TemplateLayout, string> = {
  classic: "Classic",
  modern:  "Modern",
  bold:    "Bold",
  minimal: "Minimal",
  dark:    "Dark",
};

function buildTemplate(layout: TemplateLayout, theme: ColorTheme): VendorTemplate {
  const isDark = layout === "dark";
  const gradient = isDark
    ? `linear-gradient(135deg, ${theme.darkCardBg}, ${theme.darkPageBg})`
    : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`;

  const colors: TemplateColors = isDark
    ? {
        primary:      theme.darkPrimary,
        secondary:    theme.secondary,
        accent:       theme.accent,
        pageBg:       theme.darkPageBg,
        heroGradient: `linear-gradient(135deg, ${theme.secondary}cc, ${theme.darkPageBg})`,
        heroText:     "#ffffff",
        cardBg:       theme.darkCardBg,
        cardBorder:   theme.secondary + "80",
        cardText:     theme.darkPrimary,
        headerBg:     theme.darkCardBg,
        headerText:   theme.darkPrimary,
        footerBg:     "#000000",
        footerText:   theme.darkPrimary,
        badgeBg:      theme.secondary + "60",
      }
    : {
        primary:      theme.primary,
        secondary:    theme.secondary,
        accent:       theme.accent,
        pageBg:       layout === "modern" ? "#ffffff" : theme.lightBg,
        heroGradient: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
        heroText:     "#ffffff",
        cardBg:       "#ffffff",
        cardBorder:   theme.border,
        cardText:     theme.primary,
        headerBg:     layout === "modern" ? "#ffffff" : "rgba(255,255,255,0.92)",
        headerText:   theme.primary,
        footerBg:     layout === "bold" ? theme.primary : "#0f172a",
        footerText:   "#ffffff",
        badgeBg:      "rgba(255,255,255,0.18)",
      };

  return {
    id:              `${layout}-${theme.key}`,
    name:            `${LAYOUT_LABELS[layout]} ${theme.label}`,
    layout,
    swatchGradient:  `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
    colors,
  };
}

const LAYOUTS: TemplateLayout[] = ["classic", "modern", "bold", "minimal", "dark"];

export const ALL_TEMPLATES: VendorTemplate[] = LAYOUTS.flatMap((layout) =>
  THEMES.map((theme) => buildTemplate(layout, theme))
);

const templateMap = new Map(ALL_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): VendorTemplate {
  return templateMap.get(id) ?? templateMap.get("classic-purple")!;
}

export const TEMPLATE_GROUPS: { layout: TemplateLayout; label: string; templates: VendorTemplate[] }[] =
  LAYOUTS.map((layout) => ({
    layout,
    label: LAYOUT_LABELS[layout],
    templates: ALL_TEMPLATES.filter((t) => t.layout === layout),
  }));
