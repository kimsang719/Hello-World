import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useTranslate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Copy, Check } from "lucide-react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);

  const translate = useTranslate();

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    translate.mutate({ data: { text: inputText, saveToHistory: true } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleTranslate();
    }
  };

  const handleCopy = () => {
    if (!translate.data?.translatedText) return;
    navigator.clipboard.writeText(translate.data.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Dich Trung - Viet</h1>
          <p className="text-sm text-muted-foreground mt-1">Nhan Ctrl+Enter de dich nhanh</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            <Textarea
              placeholder="Nhap tieng Trung..."
              className="min-h-[320px] text-lg resize-none rounded-xl border-border/60 bg-card/50 p-4 focus-visible:ring-1 focus-visible:ring-primary/50"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-chinese-text"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {inputText && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setInputText("")}
                  data-testid="button-clear-input"
                >
                  Xoa
                </button>
              )}
              <Button
                onClick={handleTranslate}
                disabled={!inputText.trim() || translate.isPending}
                size="sm"
                className="gap-1.5 h-8"
                data-testid="button-translate"
              >
                {translate.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    Dich <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative min-h-[320px] rounded-xl border border-border/60 bg-card/50 p-4">
            {translate.isPending ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
              </div>
            ) : translate.data?.translatedText ? (
              <>
                <p
                  className="text-lg leading-relaxed text-foreground whitespace-pre-wrap animate-in fade-in duration-300"
                  data-testid="text-translated-result"
                >
                  {translate.data.translatedText}
                </p>
                <button
                  onClick={handleCopy}
                  className="absolute bottom-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  data-testid="button-copy"
                  title="Sao chep"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/50 font-serif italic text-sm select-none">
                Ban dich se hien thi o day
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
