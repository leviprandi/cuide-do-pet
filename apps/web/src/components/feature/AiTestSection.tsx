import { Bot, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { AIContract } from "../../types/ai-contract";

interface AiTestSectionProps {
  message: string;
  interpretLoading: boolean;
  executeLoading: boolean;
  error: string | null;
  response: AIContract | null;
  onMessageChange: (v: string) => void;
  onInterpret: () => void;
  onExecute: () => void;
}

const executionTypeMeta: Record<
  AIContract["executionType"],
  { label: string; classes: string }
> = {
  created: {
    label: "Criado com sucesso",
    classes: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  confirmation_required: {
    label: "Confirmação necessária",
    classes: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  unsupported: {
    label: "Não suportado",
    classes: "bg-red-100 text-red-800 border border-red-200",
  },
};

export function AiTestSection({
  message, interpretLoading, executeLoading, error, response,
  onMessageChange, onInterpret, onExecute,
}: AiTestSectionProps) {
  const isLoading = interpretLoading || executeLoading;
  const isDisabled = isLoading || message.trim() === "";

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Assistente IA</h2>

      {/* Input card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4 shadow-sm mb-4">
        {/* AI icon */}
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-emerald-600" />
        </div>

        {/* Textarea + buttons */}
        <div className="flex-1 flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder='Diga: "Floquinho vomitou agora há pouco" ou use o formato determinístico'
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
          />

          <div className="flex gap-2">
            <button
              disabled={isDisabled}
              onClick={onInterpret}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-emerald-400 text-emerald-700 hover:bg-emerald-50"
              )}
            >
              {interpretLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Interpretar
            </button>

            <button
              disabled={isDisabled}
              onClick={onExecute}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              )}
            >
              {executeLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Executar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
          <span className="font-semibold">Erro: </span>{error}
        </div>
      )}

      {/* Result */}
      {response && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">

          {/* executionType badge — primary signal */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex flex-col px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
                executionTypeMeta[response.executionType]?.classes ??
                  "bg-gray-100 text-gray-700"
              )}
            >
              <span>{executionTypeMeta[response.executionType]?.label ?? response.executionType}</span>
              <span className="font-normal opacity-70">{response.executionType}</span>
            </span>
            <span className="text-sm text-gray-500">
              intent: <strong className="text-gray-700">{response.intent}</strong>
              {" · "}confidence: <strong className="text-gray-700">{response.confidence}</strong>
            </span>
          </div>

          {/* assistantMessage */}
          {response.assistantMessage && (
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
              {response.assistantMessage}
            </p>
          )}

          {/* missingFields — prominent when non-empty */}
          {response.missingFields.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Campos em falta
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {response.missingFields.map((f) => (
                  <li key={f} className="text-sm text-amber-800">{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-medium text-gray-600">requiresConfirmation</span>
              <p className="text-gray-800">{String(response.requiresConfirmation)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">executed</span>
              <p className="text-gray-800">{String(response.executed)}</p>
            </div>
          </div>

          {/* createdRecord — shown only when present */}
          {response.createdRecord !== null && response.createdRecord !== undefined && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Registro criado
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 overflow-x-auto leading-relaxed">
                {JSON.stringify(response.createdRecord, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
