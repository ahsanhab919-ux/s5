import AnalysisProgress from "./AnalysisProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Facebook, Link2, Loader2 } from "lucide-react";

interface URLInputFormProps {
  url: string;
  isAnalyzing: boolean;
  error: string;
  metaError: string;
  statusMessage: string;
  currentStep: string;
  searchQueries: string[];
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}
export default function URLInputForm({
  url,
  isAnalyzing,
  error,
  metaError,
  statusMessage,
  currentStep,
  searchQueries,
  onUrlChange,
  onSubmit,
}: URLInputFormProps) {
  if (isAnalyzing) {
    return (
      <div className="relative mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Glow effect */}
        <div className="bg-primary/20 absolute -inset-1 rounded-3xl opacity-50 blur-xl"></div>
        <AnalysisProgress
          currentStep={currentStep}
          statusMessage={statusMessage}
          searchQueries={searchQueries}
        />
      </div>
    );
  }

  return (
    <div className="relative mb-12">
      {/* Glow effect */}
      <div className="bg-primary/20 absolute -inset-1 rounded-3xl opacity-50 blur-xl"></div>

      <Card className="bg-card/80 border-border relative px-4 shadow-2xl backdrop-blur-2xl md:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <Label
              htmlFor="url"
              className="text-muted-foreground mb-3 block text-xs font-semibold tracking-wider uppercase"
            >
              Product URL
            </Label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                <Link2 className="text-muted-foreground group-focus-within:text-primary h-5 w-5 transition-colors duration-200" />
              </div>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                className="bg-background/90 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 hover:border-primary/30 rounded-2xl py-5 pr-5 pl-14 text-base transition-all duration-200 focus:ring-2"
                placeholder="https://example.com/product"
                required
                disabled={isAnalyzing}
              />
            </div>
            <p className="text-muted-foreground mt-3 text-xs font-light">
              Paste any product link and watch our AI analyze your competitors,
              extract market insights, and generate detailed buyer personas
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <Card className="border-destructive/30 bg-destructive/10 text-destructive animate-shake p-4 text-sm">
              {error}
            </Card>
          )}

          {/* Meta Connection Error */}
          {metaError && (
            <Card className="border-destructive/30 bg-destructive/10 text-destructive animate-shake p-4 text-sm">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                <span className="font-medium">Meta Connection Error:</span>
              </div>
              <p className="mt-1">{metaError}</p>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isAnalyzing}
            className="group relative w-full transform overflow-hidden rounded-2xl px-4 py-5 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 md:px-6"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing your URL...
              </span>
            ) : (
              <span
                className="flex items-center justify-center gap-3"
                data-rybbit-event="analyze_product_button"
              >
                Analyze Product
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
