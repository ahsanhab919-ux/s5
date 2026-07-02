import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddTextKnowledge,
  useDeleteKnowledge,
  useKnowledge,
} from "@/hooks/(marketing-automation-page)/useKnowledgeApi";
import {
  AlertCircle,
  CheckCircle,
  FileText,
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

interface TextKnowledgeTabProps {
  selectedPage: string;
}

export const TextKnowledgeTab = ({ selectedPage }: TextKnowledgeTabProps) => {
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeText, setKnowledgeText] = useState("");

  const addTextKnowledgeMutation = useAddTextKnowledge();
  const deleteKnowledgeMutation = useDeleteKnowledge();
  const { data: knowledgeData } = useKnowledge(selectedPage || null);

  const handleAddTextKnowledge = async () => {
    if (!knowledgeText || !knowledgeTitle || !selectedPage) return;

    try {
      await addTextKnowledgeMutation.mutateAsync({
        pageId: selectedPage,
        title: knowledgeTitle,
        content: knowledgeText,
      });
      setKnowledgeTitle("");
      setKnowledgeText("");
    } catch (error) {
      console.error("Failed to add text knowledge:", error);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Add Text Knowledge
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Add custom text-based knowledge that will be stored in the vector
        database.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="knowledge-title">Title</Label>
          <Input
            id="knowledge-title"
            type="text"
            value={knowledgeTitle}
            onChange={(e) => setKnowledgeTitle(e.target.value)}
            placeholder="e.g., Product Information, FAQ, etc."
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="knowledge-content">Knowledge Content</Label>
          <Textarea
            id="knowledge-content"
            value={knowledgeText}
            onChange={(e) => setKnowledgeText(e.target.value)}
            placeholder="Enter your knowledge content here..."
            rows={10}
            className="mt-2"
          />
        </div>

        <Button
          onClick={handleAddTextKnowledge}
          disabled={
            !knowledgeText ||
            !knowledgeTitle ||
            !selectedPage ||
            addTextKnowledgeMutation.isPending
          }
          className="w-full"
        >
          {addTextKnowledgeMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Add Knowledge</span>
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

      {/* Display existing text knowledge */}
      {selectedPage && knowledgeData && knowledgeData.length > 0 && (
        <div className="border-border mt-6 border-t pt-6">
          <h3 className="text-md text-foreground mb-4 font-semibold">
            Existing Text Knowledge (
            {
              knowledgeData.filter((k: KnowledgeSource) => k.type === "text")
                .length
            }
            )
          </h3>
          <div className="space-y-3">
            {knowledgeData
              .filter((k: KnowledgeSource) => k.type === "text")
              .map((knowledge: KnowledgeSource) => (
                <Card key={knowledge.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="text-primary h-4 w-4 shrink-0" />
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
                      {knowledge.content && (
                        <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                          {knowledge.content.substring(0, 150)}...
                        </p>
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
