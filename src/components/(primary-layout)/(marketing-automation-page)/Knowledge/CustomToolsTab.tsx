import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomTool,
  useCustomTools,
  useDeleteCustomTool,
} from "@/hooks/(marketing-automation-page)/useKnowledgeApi";
import { AlertCircle, Loader2, Plus, Wrench } from "lucide-react";
import { useState } from "react";
// import {
//   useCreateCustomTool,
//   useCustomTools,
//   useDeleteCustomTool,
// } from "../../hooks/useKnowledgeApi";

interface CustomTool {
  id: string;
  pageId: string;
  name: string;
  description: string;
  apiEndpoint: string;
  method: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
  createdAt: string;
}

interface CustomToolsTabProps {
  selectedPage: string;
}

export const CustomToolsTab = ({ selectedPage }: CustomToolsTabProps) => {
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolEndpoint, setToolEndpoint] = useState("");
  const [toolMethod, setToolMethod] = useState("GET");
  const [authToken, setAuthToken] = useState("");
  const [toolHeaders, setToolHeaders] = useState("");
  const [toolParameters, setToolParameters] = useState("");

  const createCustomToolMutation = useCreateCustomTool();
  const deleteCustomToolMutation = useDeleteCustomTool();
  const { data: customToolsData } = useCustomTools(selectedPage || null);

  // Dynamic placeholders based on HTTP method
  const getHeadersPlaceholder = () => {
    switch (toolMethod) {
      case "GET":
        return '{"Accept": "application/json"}';
      case "POST":
        return '{"Content-Type": "application/json"}';
      case "PUT":
        return '{"Content-Type": "application/json"}';
      case "DELETE":
        return '{"Accept": "application/json"}';
      default:
        return "{}";
    }
  };

  const getParametersPlaceholder = () => {
    switch (toolMethod) {
      case "GET":
        return '{"status": "active", "limit": "10", "page": "1"}';
      case "POST":
        return '{"name": "John Doe", "email": "john@example.com", "age": "30"}';
      case "PUT":
        return '{"id": "123", "name": "Updated Name", "status": "active"}';
      case "DELETE":
        return '{"id": "123"}';
      default:
        return "{}";
    }
  };

  const getEndpointPlaceholder = () => {
    switch (toolMethod) {
      case "GET":
        return "https://api.example.com/users (query params will be appended)";
      case "POST":
        return "https://api.example.com/users";
      case "PUT":
        return "https://api.example.com/users/:id (use :id for path params)";
      case "DELETE":
        return "https://api.example.com/users/:id (use :id for path params)";
      default:
        return "https://api.example.com/endpoint";
    }
  };

  const getParametersHelpText = () => {
    switch (toolMethod) {
      case "GET":
        return "Query parameters (will be added as ?status=active&limit=10)";
      case "POST":
        return "Request body parameters (sent as JSON in request body)";
      case "PUT":
        return "Path params like :id will be replaced, others sent in body";
      case "DELETE":
        return "Path params like :id will be replaced from these values";
      default:
        return "Request parameters";
    }
  };

  const handleCreateTool = async () => {
    if (!toolName || !toolDescription || !toolEndpoint || !selectedPage) return;

    try {
      // Parse headers and parameters, use empty object if empty
      let headersObj: Record<string, string> = {};
      let parametersObj: Record<string, string> = {};

      try {
        headersObj = toolHeaders ? JSON.parse(toolHeaders) : {};
      } catch {
        console.error("Invalid headers JSON, using empty object");
      }

      try {
        parametersObj = toolParameters ? JSON.parse(toolParameters) : {};
      } catch {
        console.error("Invalid parameters JSON, using empty object");
      }

      // Merge auth token into headers if provided
      if (authToken) {
        headersObj["Authorization"] = `Bearer ${authToken}`;
      }

      await createCustomToolMutation.mutateAsync({
        pageId: selectedPage,
        name: toolName,
        description: toolDescription,
        apiEndpoint: toolEndpoint,
        method: toolMethod,
        headers: JSON.stringify(headersObj),
        parameters: JSON.stringify(parametersObj),
      });

      // Reset form
      setToolName("");
      setToolDescription("");
      setToolEndpoint("");
      setAuthToken("");
      setToolHeaders("");
      setToolParameters("");
    } catch (error) {
      console.error("Failed to create tool:", error);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Create Custom AI Tool
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Create custom AI tools with API integrations using LangGraph and Gemini.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tool-name">Tool Name</Label>
          <Input
            id="tool-name"
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder="e.g., Weather API, Stock Price Checker"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="tool-description">Description</Label>
          <Textarea
            id="tool-description"
            value={toolDescription}
            onChange={(e) => setToolDescription(e.target.value)}
            placeholder="Describe what this tool does..."
            rows={3}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="tool-endpoint">API Endpoint</Label>
          <Input
            id="tool-endpoint"
            type="url"
            value={toolEndpoint}
            onChange={(e) => setToolEndpoint(e.target.value)}
            placeholder={getEndpointPlaceholder()}
            className="mt-2"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {toolMethod === "GET"
              ? "Base URL only - query params will be added automatically"
              : toolMethod === "POST"
                ? "Full endpoint URL for creating resources"
                : "Use :paramName for path parameters (e.g., /users/:id)"}
          </p>
        </div>

        <div>
          <Label htmlFor="tool-method">HTTP Method</Label>
          <Select value={toolMethod} onValueChange={setToolMethod}>
            <SelectTrigger id="tool-method" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET - Retrieve data</SelectItem>
              <SelectItem value="POST">POST - Create new resource</SelectItem>
              <SelectItem value="PUT">
                PUT - Update existing resource
              </SelectItem>
              <SelectItem value="DELETE">DELETE - Remove resource</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tool-auth-token">Auth Token (Optional)</Label>
          <Input
            id="tool-auth-token"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="your-api-token-here (will be added as Bearer token)"
            className="mt-2"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            If provided, will be added as "Authorization: Bearer token" header
          </p>
        </div>

        <div>
          <Label htmlFor="tool-headers">Headers (JSON)</Label>
          <Textarea
            id="tool-headers"
            value={toolHeaders}
            onChange={(e) => setToolHeaders(e.target.value)}
            placeholder={getHeadersPlaceholder()}
            rows={3}
            className="mt-2 font-mono text-sm"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Additional headers (auth token will be auto-added if provided above)
          </p>
        </div>

        <div>
          <Label htmlFor="tool-parameters">Parameters (JSON)</Label>
          <Textarea
            id="tool-parameters"
            value={toolParameters}
            onChange={(e) => setToolParameters(e.target.value)}
            placeholder={getParametersPlaceholder()}
            rows={3}
            className="mt-2 font-mono text-sm"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {getParametersHelpText()}
          </p>
        </div>

        <Button
          onClick={handleCreateTool}
          disabled={
            !toolName ||
            !toolDescription ||
            !toolEndpoint ||
            !selectedPage ||
            createCustomToolMutation.isPending
          }
          className="w-full"
        >
          {createCustomToolMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Create Tool</span>
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

      {/* Display existing custom tools */}
      {selectedPage && customToolsData && customToolsData.length > 0 && (
        <div className="border-border mt-6 border-t pt-6">
          <h3 className="text-md text-foreground mb-4 font-semibold">
            Existing Tools ({customToolsData.length})
          </h3>
          <div className="space-y-3">
            {customToolsData.map((tool: CustomTool) => (
              <Card key={tool.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Wrench className="text-primary h-4 w-4 shrink-0" />
                      <h4 className="text-foreground truncate text-sm font-medium">
                        {tool.name}
                      </h4>
                    </div>
                    <p className="text-muted-foreground mb-2 text-xs">
                      {tool.description}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <Badge variant="secondary" className="px-2 py-1">
                        {tool.method}
                      </Badge>
                      <span className="truncate">{tool.apiEndpoint}</span>
                    </div>
                  </div>
                  {/* <Button
                    onClick={() =>
                      deleteCustomToolMutation.mutate({
                        id: tool.id,
                        pageId: selectedPage,
                      })
                    }
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    title="Delete tool"
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
