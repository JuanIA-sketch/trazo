import React from "react";
import { useTranslation } from "react-i18next";
import { Cog, FlaskConical, History, Info, Sparkles, Cpu } from "lucide-react";
import "./Sidebar.css";
import HandyTextLogo from "./icons/HandyTextLogo";
import HandyHand from "./icons/HandyHand";
import { HeyTrazo } from "./HeyTrazo";
import ModelSelector from "./model-selector";
import { useSettings } from "../hooks/useSettings";
import {
  GeneralSettings,
  AdvancedSettings,
  HistorySettings,
  DebugSettings,
  AboutSettings,
  PostProcessingSettings,
  ModelsSettings,
} from "./settings";

// La lista de secciones vive en `sections.ts` (módulo puro y testeable).
import type { SidebarSection } from "./sections";
export type { SidebarSection };

interface IconProps {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
  [key: string]: any;
}

/** Categorías del sidebar. Son solo presentación: agrupan visualmente, no
 *  cambian qué secciones existen ni cuándo se habilitan. */
type NavGroup = "dictation" | "voice" | "settings";

const GROUP_ORDER: NavGroup[] = ["dictation", "voice", "settings"];

interface SectionConfig {
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  component: React.ComponentType;
  enabled: (settings: any) => boolean;
  group: NavGroup;
}

export const SECTIONS_CONFIG = {
  general: {
    labelKey: "sidebar.general",
    icon: HandyHand,
    component: GeneralSettings,
    enabled: () => true,
    group: "dictation",
  },
  models: {
    labelKey: "sidebar.models",
    icon: Cpu,
    component: ModelsSettings,
    enabled: () => true,
    group: "dictation",
  },
  advanced: {
    labelKey: "sidebar.advanced",
    icon: Cog,
    component: AdvancedSettings,
    enabled: () => true,
    group: "settings",
  },
  history: {
    labelKey: "sidebar.history",
    icon: History,
    component: HistorySettings,
    enabled: () => true,
    group: "voice",
  },
  postprocessing: {
    labelKey: "sidebar.postProcessing",
    icon: Sparkles,
    component: PostProcessingSettings,
    enabled: (settings) => settings?.post_process_enabled ?? false,
    group: "settings",
  },
  debug: {
    labelKey: "sidebar.debug",
    icon: FlaskConical,
    component: DebugSettings,
    enabled: (settings) => settings?.debug_mode ?? false,
    group: "settings",
  },
  about: {
    labelKey: "sidebar.about",
    icon: Info,
    component: AboutSettings,
    enabled: () => true,
    group: "settings",
  },
} as const satisfies Record<string, SectionConfig>;

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const availableSections = Object.entries(SECTIONS_CONFIG)
    .filter(([_, config]) => config.enabled(settings))
    .map(([id, config]) => ({ id: id as SidebarSection, ...config }));

  // Alto por `h-full` con margen vertical daba 16px de más y el pie quedaba
  // cortado; con padding el sidebar mide exactamente lo que su contenedor.
  return (
    <div className="trz-sidebar flex h-full w-40 flex-col items-center px-2 py-2 ms-2">
      <HandyTextLogo width={120} className="m-4" />
      {/* La navegación cede el espacio que necesite el pie: si la lista crece,
          scrollea ella, no se come la píldora del modelo. */}
      <div className="trz-nav-scroll flex min-h-0 w-full flex-1 flex-col pt-2">
        {GROUP_ORDER.map((group) => {
          const sections = availableSections.filter((s) => s.group === group);
          // Un grupo cuyas secciones están todas deshabilitadas no deja un
          // encabezado huérfano flotando.
          if (sections.length === 0) return null;

          return (
            <div key={group} className="trz-nav-group flex flex-col w-full">
              <p className="trz-nav-cat">{t(`sidebar.group.${group}`)}</p>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <div
                    key={section.id}
                    className={`trz-nav-item flex gap-2 items-center p-2 w-full cursor-pointer ${
                      isActive ? "is-active" : ""
                    }`}
                    onClick={() => onSectionChange(section.id)}
                  >
                    <Icon width={24} height={24} className="shrink-0" />
                    <p className="text-sm truncate" title={t(section.labelKey)}>
                      {t(section.labelKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Pie del sidebar: el diseño elimina la franja inferior y trae aquí el
          modelo activo. */}
      <div className="flex w-full shrink-0 flex-col gap-2 pb-1">
        <HeyTrazo />
        <ModelSelector />
      </div>
    </div>
  );
};
