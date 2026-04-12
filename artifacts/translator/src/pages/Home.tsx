import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { useTranslate, useLookupDictionary, getLookupDictionaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DictionaryWord } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const translate = useTranslate();
  
  const { data: dictEntry, isLoading: isDictLoading } = useLookupDictionary(
    { word: selectedWord || "" },
    { query: { enabled: !!selectedWord, queryKey: getLookupDictionaryQueryKey({ word: selectedWord || "" }) } }
  );

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    translate.mutate({
      data: { text: inputText, saveToHistory }
    });
  };

  const handleWordClick = (word: string) => {
    // Only look up if it contains chinese characters (simplified or traditional)
    if (/[\u4e00-\u9fa5]/.test(word)) {
      setSelectedWord(word);
    }
  };

  // Basic segmentation for clickability. In a real app we'd have segments from backend, 
  // but we'll try to split by non-chinese characters and make each char clickable if we must,
  // or just use the dictionary provided in the response to highlight words.
  const renderOriginalText = (text: string, dictionary: DictionaryWord[]) => {
    // A simplistic way to render: we just map through characters, but ideally we match against dictionary.
    // For now, we'll just make the whole text string click-to-lookup for individual words based on the dictionary.
    return text;
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold text-foreground">Translate</h1>
          <p className="text-muted-foreground font-serif italic">From Chinese to Vietnamese.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur">
            <CardContent className="p-4 space-y-4">
              <Textarea
                placeholder="Enter Chinese text here..."
                className="min-h-[200px] text-lg font-cjk resize-none border-0 focus-visible:ring-0 p-0 bg-transparent"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                data-testid="input-chinese-text"
              />
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="save-history" 
                    checked={saveToHistory}
                    onCheckedChange={setSaveToHistory}
                    data-testid="switch-save-history"
                  />
                  <Label htmlFor="save-history" className="text-sm font-medium cursor-pointer">
                    Save to history
                  </Label>
                </div>
                <Button 
                  onClick={handleTranslate} 
                  disabled={!inputText.trim() || translate.isPending}
                  className="gap-2"
                  data-testid="button-translate"
                >
                  {translate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Translate"}
                  {!translate.isPending && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur min-h-[200px]">
            <CardContent className="p-6 h-full flex flex-col">
              {translate.data ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold tracking-wider text-primary uppercase">Translation</h3>
                    <div className="text-xl leading-relaxed">
                      {translate.data.translatedText}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold tracking-wider text-primary uppercase">Pinyin</h3>
                    <div className="text-lg text-muted-foreground font-mono">
                      {translate.data.pinyin}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold tracking-wider text-primary uppercase">Original</h3>
                    <div className="text-lg font-cjk leading-relaxed">
                      {translate.data.originalText.split('').map((char, i) => (
                         <span 
                          key={i}
                          className="cursor-pointer hover:text-primary transition-colors hover:bg-primary/10 rounded px-px"
                          onClick={() => handleWordClick(char)}
                          data-testid={`text-original-char-${i}`}
                         >
                           {char}
                         </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-border" />
                  </div>
                  <p className="font-serif italic">Translation will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {translate.data?.dictionary && translate.data.dictionary.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-serif font-bold border-b border-border/50 pb-2">Dictionary Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {translate.data.dictionary.map((word, i) => (
                <Card key={i} className="shadow-sm border-border/60 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-cjk font-bold text-foreground">{word.simplified}</span>
                      {word.traditional && word.traditional !== word.simplified && (
                        <span className="text-lg font-cjk text-muted-foreground">({word.traditional})</span>
                      )}
                      <span className="text-sm font-mono text-primary font-medium">{word.pinyin}</span>
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground pl-4">
                      {word.meanings.map((m, j) => (
                        <li key={j}>{m}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      <Dialog open={!!selectedWord} onOpenChange={(open) => !open && setSelectedWord(null)}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/60">
          <DialogHeader>
            <DialogTitle className="font-serif italic font-normal text-muted-foreground">Dictionary Lookup</DialogTitle>
          </DialogHeader>
          <div className="min-h-[150px] flex items-center justify-center">
            {isDictLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : dictEntry ? (
              <div className="w-full space-y-6">
                {dictEntry.entries.map((entry, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-cjk font-bold text-foreground">{entry.simplified}</span>
                      {entry.traditional && entry.traditional !== entry.simplified && (
                        <span className="text-xl font-cjk text-muted-foreground">({entry.traditional})</span>
                      )}
                      <span className="text-lg font-mono text-primary">{entry.pinyin}</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Meanings</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 text-foreground pl-2">
                        {entry.meanings.map((m, j) => (
                          <li key={j}>{m}</li>
                        ))}
                      </ul>
                    </div>
                    {entry.examples && entry.examples.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-border/50">
                        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Examples</h4>
                        <div className="space-y-3">
                          {entry.examples.map((ex, j) => (
                            <div key={j} className="text-sm bg-muted/30 p-3 rounded border border-border/30">
                              <div className="font-cjk text-base">{ex.chinese}</div>
                              <div className="font-mono text-muted-foreground text-xs my-1">{ex.pinyin}</div>
                              <div className="text-foreground">{ex.vietnamese}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No entry found for "{selectedWord}".</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
