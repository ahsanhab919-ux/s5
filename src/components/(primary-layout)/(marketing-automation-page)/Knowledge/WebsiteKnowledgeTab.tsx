import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDeleteKnowledge,
  useKnowledge,
  useScrapeWebsite,
} from "@/hooks/(marketing-automation-page)/useKnowledgeApi";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";

interface KnowledgeSource {
  id: string;
  type: "website" | "text";
  title: string;
  content?: string;
  url?: string;
  vectorIds?: string[];
  status: "processing" | "completed" | "failed";
  createdAt: string;
}

interface WebsiteKnowledgeTabProps {
  selectedPage: string;
}

export const WebsiteKnowledgeTab = ({
  selectedPage,
}: WebsiteKnowledgeTabProps) => {
  const [websiteUrl, setWebsiteUrl] = useState("");

  const scrapeWebsiteMutation = useScrapeWebsite();
  const deleteKnowledgeMutation = useDeleteKnowledge();
  const { data: knowledgeData } = useKnowledge(selectedPage || null);

  const handleScrapeWebsite = async () => {
    if (!websiteUrl || !selectedPage) return;

    try {
      await scrapeWebsiteMutation.mutateAsync({
        pageId: selectedPage,
        url: websiteUrl,
      });
      setWebsiteUrl("");
    } catch (error) {
      console.error("Failed to scrape website:", error);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Scrape Website
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Enter a website URL to scrape and store its content in the vector
        database for AI-powered responses.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="website-url">Website URL</Label>
          <div className="relative mt-2">
            <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="pl-10"
            />
          </div>
        </div>

        <Button
          onClick={handleScrapeWebsite}
          disabled={
            !websiteUrl || !selectedPage || scrapeWebsiteMutation.isPending
          }
          className="w-full"
        >
          {scrapeWebsiteMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Scrape & Store</span>
            </>
          )}
        </Button>
      </div>

      {!selectedPage && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a page first</AlertDescription>
        </Alert>
      )}

      {/* Display existing website knowledge */}
      {selectedPage && knowledgeData && knowledgeData.length > 0 && (
        <div className="border-border mt-6 border-t pt-6">
          <h3 className="text-md text-foreground mb-4 font-semibold">
            Existing Knowledge (
            {
              knowledgeData.filter((k: KnowledgeSource) => k.type === "website")
                .length
            }
            )
          </h3>
          <div className="space-y-3">
            {knowledgeData
              .filter((k: KnowledgeSource) => k.type === "website")
              .map((knowledge: KnowledgeSource) => (
                <Card key={knowledge.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Globe className="text-primary h-4 w-4 shrink-0" />
                        <h4 className="text-foreground truncate text-sm font-medium">
                          {knowledge.title}
                        </h4>
                        {knowledge.status === "completed" && (
                          <CheckCircle className="text-primary h-4 w-4 shrink-0" />
                        )}
                        {knowledge.status === "processing" && (
                          <Loader2 className="text-primary h-4 w-4 shrink-0 animate-spin" />
                        )}
                      </div>
                      {knowledge.url && (
                        <a
                          href={knowledge.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary mb-2 flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{knowledge.url}</span>
                        </a>
                      )}
                      <div className="text-muted-foreground flex items-center gap-4 text-xs">
                        <span>{knowledge.vectorIds?.length || 0} chunks</span>
                        <span>
                          {new Date(knowledge.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {/* <Button
                      onClick={() =>
                        deleteKnowledgeMutation.mutate({
                          id: knowledge.id,
                          pageId: selectedPage,
                        })
                      }
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title="Delete knowledge"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};
