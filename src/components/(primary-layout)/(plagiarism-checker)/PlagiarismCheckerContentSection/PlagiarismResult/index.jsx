import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";

const PlagiarismResult = ({
  text: inputText,
  score,
  results,
  loading,
  error,
  manualRefresh,
}) => {
  return (
    <div className="px-4 py-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-bold">Plagiarism Checker</div>

        <div className="flex items-center gap-2">
          {/* {fromCache && (
              <Chip 
                icon={<Cached />} 
                label="Cached" 
                size="small" 
                color="info" 
                variant="outlined"
              />
            )} */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={manualRefresh}
            disabled={loading || !inputText?.trim()}
            title="Refresh check"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      <Card
        className={cn(
          "mb-4 flex min-h-[100px] flex-col justify-center text-center",
          loading ? "bg-muted" : error ? "bg-destructive/10" : "bg-background",
        )}
      >
        <CardContent className="p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="mb-2 size-6 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Checking plagiarism...
              </span>
            </div>
          ) : error ? (
            <>
              <div className="text-destructive mb-2 text-2xl font-semibold">
                Error
              </div>
              <p className="text-destructive mb-3 text-sm">{error}</p>
              <Button
                size="sm"
                onClick={manualRefresh}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 mt-2"
              >
                Retry
              </Button>
            </>
          ) : (
            <>
              <div id="plagiarism_score" className="text-4xl font-bold">
                {score != null ? `${score}%` : "--"}
              </div>
              <span className="text-muted-foreground text-sm">Plagiarism</span>
            </>
          )}
        </CardContent>
      </Card>

      <div id="plagiarism_results">
        <div className="text-muted-foreground mb-2 text-sm font-medium">
          Results ({results.length})
        </div>

        {results.map((r, i) => (
          <div
            key={i}
            className="border-border mb-2 flex items-center justify-between rounded border p-2"
          >
            <span className="w-[20%] text-sm">{r.percent}%</span>
            <span className="ml-2 flex-1 text-center text-sm">{r.source}</span>
            <Button variant="ghost" size="icon-sm">
              <ChevronDown className="size-4" />
            </Button>
          </div>
        ))}

        {!loading && !error && results.length === 0 && (
          <p className="text-muted-foreground text-sm">No matches found.</p>
        )}
      </div>
    </div>
  );
};

export default PlagiarismResult;
