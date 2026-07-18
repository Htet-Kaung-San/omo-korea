import { useState, useEffect } from "react";
import { X, Brain, Loader2, Save } from "lucide-react";
import { api } from "@/api";

interface ManageMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageMemoryModal({ isOpen, onClose }: ManageMemoryModalProps) {
  const [memory, setMemory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMemory();
    }
  }, [isOpen]);

  const loadMemory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMemory();
      setMemory(data || "");
    } catch (err) {
      console.error("Failed to load memory", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateMemory(memory);
      onClose();
    } catch (err) {
      console.error("Failed to save memory", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-pnu-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pnu-blue/10 text-pnu-blue">
              <Brain className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-pnu-text">Manage Memory</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-pnu-muted hover:bg-pnu-surface hover:text-pnu-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-pnu-muted">
            Here's what the AI remembers about you! Edit this text to change what it knows. This memory is injected into every chat session.
          </p>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-pnu-border bg-pnu-surface/50">
              <Loader2 className="h-6 w-6 animate-spin text-pnu-blue" />
            </div>
          ) : (
            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="e.g. I am a 2nd-year AI major from Myanmar..."
              className="h-48 w-full resize-none rounded-xl border border-pnu-border bg-white p-4 text-sm leading-relaxed text-pnu-text placeholder:text-pnu-muted/50 focus:border-pnu-blue focus:outline-none focus:ring-4 focus:ring-pnu-blue/10 transition-all"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-pnu-border bg-pnu-surface/30 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-pnu-text hover:bg-pnu-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 rounded-xl bg-pnu-blue px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pnu-blue-light disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Memory
          </button>
        </div>
      </div>
    </div>
  );
}
