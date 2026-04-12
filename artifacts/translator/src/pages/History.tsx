import React from "react";
import { Layout } from "@/components/Layout";
import { 
  useGetHistory, 
  useClearHistory, 
  useDeleteHistory,
  getGetHistoryQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, BookX } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: history, isLoading } = useGetHistory();
  const clearHistory = useClearHistory();
  const deleteHistory = useDeleteHistory();

  const handleClearAll = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        toast({ title: "History cleared", description: "All past translations have been removed." });
      }
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent accordion from toggling
    deleteHistory.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        toast({ title: "Entry deleted", description: "The translation was removed from history." });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">History</h1>
            <p className="text-muted-foreground font-serif italic">Your past translations.</p>
          </div>
          {history && history.length > 0 && (
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleClearAll}
              disabled={clearHistory.isPending}
              data-testid="button-clear-history"
            >
              {clearHistory.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Clear All
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : history && history.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-4">
            {history.map((item, i) => (
              <AccordionItem 
                key={item.id} 
                value={item.id.toString()}
                className="border rounded-lg bg-card/30 backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                data-testid={`history-item-${item.id}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline transition-colors group">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="font-cjk text-lg font-medium line-clamp-1 max-w-[200px] sm:max-w-xs md:max-w-md">
                        {item.originalText}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-primary hidden sm:block truncate max-w-[200px]">
                        {item.translatedText}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(item.id, e)}
                        data-testid={`button-delete-history-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 border-t border-border/30 bg-muted/10">
                  <div className="grid gap-4 mt-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Chinese</span>
                      <p className="font-cjk text-lg leading-relaxed">{item.originalText}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Pinyin</span>
                      <p className="font-mono text-primary/80">{item.pinyin}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Vietnamese</span>
                      <p className="text-lg leading-relaxed">{item.translatedText}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <BookX className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground mb-1">No history yet</h3>
              <p className="text-sm text-muted-foreground">Your saved translations will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
