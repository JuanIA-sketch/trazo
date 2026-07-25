import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSettings } from "../../hooks/useSettings";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SettingContainer } from "../ui/SettingContainer";
import { parseReplacementCsv, type ReplacementRule } from "./replacementCsv";

interface CustomReplacementsProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

const MAX_FROM_LENGTH = 50;
const MAX_TO_LENGTH = 500;

/**
 * Dictionary expansion rules: what you say (`from`) becomes what gets written
 * (`to`). Distinct from Custom Words, which only fuzzy-corrects mis-heard
 * spellings — these are exact rewrites applied to the finished transcript.
 */
export const CustomReplacements: React.FC<CustomReplacementsProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const replacements: ReplacementRule[] =
      getSetting("custom_replacements") || [];
    const busy = isUpdating("custom_replacements");

    const canAdd =
      from.trim().length > 0 &&
      to.trim().length > 0 &&
      from.trim().length <= MAX_FROM_LENGTH &&
      to.trim().length <= MAX_TO_LENGTH &&
      !busy;

    /** Case-insensitive, since matching at transcription time is too. */
    const indexOfRule = (list: ReplacementRule[], pattern: string) =>
      list.findIndex((r) => r.from.toLowerCase() === pattern.toLowerCase());

    const handleAdd = () => {
      const rule = { from: from.trim(), to: to.trim() };
      if (!rule.from || !rule.to) return;

      if (indexOfRule(replacements, rule.from) !== -1) {
        toast.error(
          t("settings.advanced.customReplacements.duplicate", {
            from: rule.from,
          }),
        );
        return;
      }

      updateSetting("custom_replacements", [...replacements, rule]);
      setFrom("");
      setTo("");
    };

    const handleRemove = (pattern: string) => {
      updateSetting(
        "custom_replacements",
        replacements.filter((r) => r.from !== pattern),
      );
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChosen = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      // Reset immediately so picking the same file twice fires onChange again.
      event.target.value = "";
      if (!file) return;

      try {
        const { rules, skipped } = parseReplacementCsv(await file.text());
        if (rules.length === 0) {
          toast.error(t("settings.advanced.customReplacements.importEmpty"));
          return;
        }

        // Later rows win over earlier ones and over existing rules, so
        // re-importing a corrected sheet updates in place instead of
        // silently keeping the stale expansion.
        const merged = [...replacements];
        let added = 0;
        let updated = 0;
        for (const rule of rules) {
          const at = indexOfRule(merged, rule.from);
          if (at === -1) {
            merged.push(rule);
            added++;
          } else if (merged[at].to !== rule.to) {
            merged[at] = rule;
            updated++;
          }
        }

        updateSetting("custom_replacements", merged);
        toast.success(
          t("settings.advanced.customReplacements.imported", {
            added,
            updated,
            skipped,
          }),
        );
      } catch {
        toast.error(t("settings.advanced.customReplacements.importFailed"));
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    };

    return (
      <>
        <SettingContainer
          title={t("settings.advanced.customReplacements.title")}
          description={t("settings.advanced.customReplacements.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              className="max-w-24"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t(
                "settings.advanced.customReplacements.fromPlaceholder",
              )}
              variant="compact"
              disabled={busy}
              aria-label={t("settings.advanced.customReplacements.fromLabel")}
            />
            <span className="text-text/50 select-none">→</span>
            <Input
              type="text"
              className="max-w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t(
                "settings.advanced.customReplacements.toPlaceholder",
              )}
              variant="compact"
              disabled={busy}
              aria-label={t("settings.advanced.customReplacements.toLabel")}
            />
            <Button
              onClick={handleAdd}
              disabled={!canAdd}
              variant="primary"
              size="md"
            >
              {t("settings.advanced.customReplacements.add")}
            </Button>
            <Button
              onClick={handleImportClick}
              disabled={busy}
              variant="secondary"
              size="md"
            >
              {t("settings.advanced.customReplacements.import")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileChosen}
            />
          </div>
        </SettingContainer>
        {replacements.length > 0 && (
          <div
            className={`px-4 p-2 ${grouped ? "" : "rounded-lg border border-mid-gray/20"} flex flex-wrap gap-1`}
          >
            {replacements.map((rule) => (
              <Button
                key={rule.from}
                onClick={() => handleRemove(rule.from)}
                disabled={busy}
                variant="secondary"
                size="sm"
                className="inline-flex items-center gap-1 cursor-pointer"
                aria-label={t("settings.advanced.customReplacements.remove", {
                  from: rule.from,
                })}
                title={`${rule.from} → ${rule.to}`}
              >
                <span className="max-w-60 truncate">
                  {rule.from} → {rule.to}
                </span>
                <svg
                  className="w-3 h-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            ))}
          </div>
        )}
      </>
    );
  },
);
