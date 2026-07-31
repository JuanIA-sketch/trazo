import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { commands, type ImpactReport } from "@/bindings";
import { Dialog } from "../../ui/Dialog";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { useSettings } from "../../../hooks/useSettings";
import type { ReplacementRule } from "../replacementCsv";
import { validateRule } from "./correctWord";

interface CorrectWordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto del dictado desde el que se abrió, para prerrellenar. */
  transcript: string;
}

/** Espera antes de consultar el impacto, para no llamar en cada tecla. */
const DEBOUNCE_MS = 350;

export const CorrectWordDialog: React.FC<CorrectWordDialogProps> = ({
  open,
  onOpenChange,
  transcript,
}) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const existing = (getSetting("custom_replacements") ||
    []) as ReplacementRule[];
  const validation = validateRule(from, to, existing);

  // Al abrir, prerrellenar con lo que el usuario tuviera seleccionado en el
  // dictado: casi siempre es justo la palabra que quiere corregir.
  useEffect(() => {
    if (!open) return;
    const selected = window.getSelection()?.toString().trim() ?? "";
    setFrom(selected && transcript.includes(selected) ? selected : "");
    setTo("");
    setImpact(null);
  }, [open, transcript]);

  // Radio de impacto, con debounce. Es lo que convierte una decisión a ciegas
  // en una informada: la misma regla puede ser buena para un usuario y
  // destructiva para otro, según lo que haya dictado.
  useEffect(() => {
    if (!open || !validation.ok) {
      setImpact(null);
      return;
    }
    let cancelled = false;
    setLoadingImpact(true);
    const id = setTimeout(async () => {
      try {
        const res = await commands.previewReplacementImpact(
          from.trim(),
          to.trim(),
        );
        if (!cancelled && res.status === "ok") setImpact(res.data);
      } catch (e) {
        console.error("Failed to preview replacement impact:", e);
      } finally {
        if (!cancelled) setLoadingImpact(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [open, from, to, validation.ok]);

  const handleSave = useCallback(async () => {
    if (!validation.ok) return;
    const rule: ReplacementRule = { from: from.trim(), to: to.trim() };
    await updateSetting("custom_replacements", [...existing, rule]);
    toast.success(t("settings.history.correctWord.saved"));
    onOpenChange(false);
  }, [validation.ok, from, to, existing, updateSetting, t, onOpenChange]);

  const errorMessage = validation.ok
    ? null
    : from || to
      ? t(`settings.history.correctWord.error.${validation.reason}`)
      : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("settings.history.correctWord.title")}
      description={t("settings.history.correctWord.description")}
      closeLabel={t("settings.history.correctWord.close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("settings.history.correctWord.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validation.ok || isUpdating("custom_replacements")}
          >
            {t("settings.history.correctWord.save")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder={t("settings.history.correctWord.fromPlaceholder")}
            className="flex-1"
          />
          <span aria-hidden="true" className="text-text/50">
            →
          </span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={t("settings.history.correctWord.toPlaceholder")}
            className="flex-1"
          />
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        {validation.ok && (
          <div className="rounded-md border border-mid-gray/20 p-3 text-sm">
            {loadingImpact && !impact ? (
              <p className="text-text/60">
                {t("settings.history.correctWord.impactLoading")}
              </p>
            ) : impact ? (
              <>
                <p className="font-medium">
                  {t("settings.history.correctWord.impactCount", {
                    count: impact.total,
                  })}
                </p>
                {impact.excerpts.length > 0 && (
                  <ul className="mt-2 space-y-1 text-text/70">
                    {impact.excerpts.map((ex, i) => (
                      <li key={i} className="truncate" title={ex.after}>
                        {ex.after}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </Dialog>
  );
};
