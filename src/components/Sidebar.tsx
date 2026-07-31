import React from "react";
import { useTranslation } from "react-i18next";
import { Cog, FlaskConical, History, Info, Sparkles, Cpu } from "lucide-react";
import "./Sidebar.css";
import HandyTextLogo from "./icons/HandyTextLogo";
import HandyHand from "./icons/HandyHand";
import { HeyTrazo } from "./HeyTrazo";
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

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

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

  return (
    <div className="trz-sidebar flex flex-col w-40 h-full items-center px-2 my-2 ms-2">
      <HandyTextLogo width={120} className="m-4" />
      <div className="flex flex-col w-full pt-2">
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
      <HeyTrazo />
    </div>
  );
};
