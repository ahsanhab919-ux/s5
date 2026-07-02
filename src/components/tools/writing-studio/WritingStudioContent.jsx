"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  Wand2,
  RefreshCw,
  Bot,
  CheckCircle2,
  Copy,
  Download,
  Sparkles,
  Type,
  FileText,
  Loader2,
  Link as LinkIcon,
  Unlink,
  X,
  Check,
  AlertTriangle,
  Eye,
  FlaskConical,
  FileSearch,
  ChevronDown,
  FileDown,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import {
  useParaphrasedMutation,
  useHumanizeContendMutation,
  useSpellCheckerMutation,
  useScanAidetectorMutation,
} from "@/redux/api/tools/toolsApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { cn } from "@/lib/utils";
import { getFullAnalysis } from "@/lib/text-analysis";
import { formatCitation } from "@/lib/citation-lookup";
import { analyzePlagiarism } from "@/services/plagiarismService";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import WritingStudioOnboarding from "./WritingStudioOnboarding";
import { 
  WritingStudioUpgradeModal, 
  UsageLimitBanner, 
  USAGE_LIMITS,
} from "./WritingStudioUpgrade";
import { useWritingStudioLimits, getUpgradeMessage } from "@/hooks/useWritingStudioLimits";
import { AI_TOOLS, PARAPHRASE_MODES, WRITING_TEMPLATES } from "./constants";
import {
  DiffPreview,
  WritingTemplates,
  WritingAnalysisPanel,
  CitationFormatHelper,
  CitationLookup,
  ReferenceListPanel,
  PlagiarismCheckPanel,
  AIScorePanel,
} from "./components";
export default function WritingStudioContent() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedMode, setSelectedMode] = useState("Fluency");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [processedResult, setProcessedResult] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [aiScore, setAiScore] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState(null);
  const [savedReferences, setSavedReferences] = useState([]);
  const [citationFormat, setCitationFormat] = useState("apa");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLimitType, setUpgradeLimitType] = useState("ai_actions");
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [plagiarismError, setPlagiarismError] = useState(null);
  const selectionRef = useRef({ from: 0, to: 0 });
  const analysisTimeoutRef = useRef(null);

  const {
    isPro,
    isAuthenticated,
    checkFeatureAccess,
    refetchAll,
    paraphraseLimits,
    humanizeLimits,
  } = useWritingStudioLimits();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("writing-studio-onboarding");
    if (!hasSeenTour) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const checkLimit = useCallback((type) => {
    const featureMap = {
      ai_actions: "paraphrase",
      citations: "citations",
      ai_scans: "ai_detector",
      plagiarism: "plagiarism",
    };
    const feature = featureMap[type] || type;
    const access = checkFeatureAccess(feature);
    return access.allowed;
  }, [checkFeatureAccess]);

  const trackUsage = useCallback((type) => {
    refetchAll();
  }, [refetchAll]);

  const [paraphrase] = useParaphrasedMutation();
  const [humanize] = useHumanizeContendMutation();
  const [grammarCheck] = useSpellCheckerMutation();
  const [scanAi] = useScanAidetectorMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your paper, thesis, or research here...",
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      analysisTimeoutRef.current = setTimeout(() => {
        const analysis = getFullAnalysis(text);
        setTextAnalysis(analysis);
      }, 500);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      selectionRef.current = { from, to };
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text);
      } else {
        setSelectedText("");
      }
    },
  });

  const handleToolSelect = (toolId) => {
    if (!user) {
      dispatch(setShowLoginModal(true));
      return;
    }
    setSelectedTool(toolId);
    setProcessedResult("");
    setShowDiff(false);
  };

  const getTextToProcess = useCallback(() => {
    const { from, to } = selectionRef.current;
    if (from !== to && editor) {
      return editor.state.doc.textBetween(from, to, " ");
    }
    if (selectedText) return selectedText;
    return editor?.getText() || "";
  }, [selectedText, editor]);

  const handleProcess = async (toolOverride = null) => {
    const tool = toolOverride || selectedTool;
    if (!tool) {
      toast.error("Please select an AI tool first");
      return;
    }

    const text = getTextToProcess();
    if (!text.trim()) {
      toast.error("Please enter or select some text first");
      return;
    }

    if (!user) {
      dispatch(setShowLoginModal(true));
      return;
    }

    const toolFeatureMap = {
      paraphrase: "paraphrase",
      grammar: "grammar",
      summarize: "summarize",
      humanize: "humanize",
    };
    const feature = toolFeatureMap[tool] || "paraphrase";
    const access = checkFeatureAccess(feature);
    
    if (!access.allowed) {
      const limitTypeMap = {
        login_required: "ai_actions",
        word_limit_reached: "ai_actions",
        pro_required: "ai_actions",
      };
      setUpgradeLimitType(limitTypeMap[access.reason] || "ai_actions");
      
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setShowUpgradeModal(true);
      }
      return;
    }

    if (toolOverride) {
      setSelectedTool(toolOverride);
    }

    setIsProcessing(true);
    setProcessedResult("");
    setOriginalText(text);
    setShowDiff(false);

    try {
      let result;
      let processedText = "";

      switch (tool) {
        case "paraphrase":
          result = await paraphrase({
            text,
            mode: selectedMode,
            synonymLevel: 40,
          }).unwrap();
          processedText = result?.data?.paraphrased_text || result?.paraphrased_text || "";
          break;

        case "humanize":
          result = await humanize({
            text,
            readability: "University",
            purpose: "Academic Writing",
          }).unwrap();
          processedText = result?.data?.humanized_text || result?.humanized_text || "";
          break;

        case "grammar":
          result = await grammarCheck({
            text,
            language: "en-US",
          }).unwrap();
          processedText = result?.data?.corrected_text || result?.corrected_text || result?.text || "";
          break;

        case "summarize":
          result = await paraphrase({
            text,
            mode: "Shorten",
            synonymLevel: 20,
          }).unwrap();
          processedText = result?.data?.paraphrased_text || result?.paraphrased_text || "";
          break;

        default:
          toast.error("Please select an AI tool first");
          return;
      }

      if (processedText) {
        setProcessedResult(processedText);
        setShowDiff(true);
        trackUsage("ai_actions");
        toast.success("Text enhanced! Review the changes below.");
      } else {
        toast.error("No result received. Please try again.");
      }
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to process text. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptChanges = () => {
    if (!processedResult || !editor) return;

    const { from, to } = selectionRef.current;
    if (selectedText && from !== to) {
      editor.chain().focus().deleteRange({ from, to }).insertContent(processedResult).run();
    } else {
      editor.commands.setContent(`<p>${processedResult}</p>`);
    }
    setProcessedResult("");
    setOriginalText("");
    setSelectedText("");
    setShowDiff(false);
    toast.success("Changes applied!");
  };

  const handleRejectChanges = () => {
    setProcessedResult("");
    setOriginalText("");
    setShowDiff(false);
    toast.info("Changes rejected");
  };

  const handleCopyResult = () => {
    if (!processedResult) return;
    navigator.clipboard.writeText(processedResult);
    toast.success("Copied to clipboard!");
  };

  const handleScanForAI = async () => {
    const text = editor?.getText() || "";
    if (!text.trim() || text.trim().split(/\s+/).length < 50) {
      toast.error("Please write at least 50 words before scanning");
      return;
    }

    const access = checkFeatureAccess("ai_detector");
    if (!access.allowed) {
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setUpgradeLimitType("ai_scan");
        setShowUpgradeModal(true);
      }
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanAi({ text }).unwrap();
      const score = result?.data?.ai_percentage || result?.ai_percentage || 0;
      setAiScore(Math.round(score));
      trackUsage("ai_scans");
      toast.success("Scan complete!");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    const text = editor?.getText() || "";
    if (!text.trim() || text.trim().split(/\s+/).length < 50) {
      toast.error("Please write at least 50 words before checking");
      return;
    }

    const access = checkFeatureAccess("plagiarism");
    if (!access.allowed) {
      if (access.reason === "login_required") {
        dispatch(setShowLoginModal(true));
      } else {
        setUpgradeLimitType("plagiarism");
        setShowUpgradeModal(true);
      }
      return;
    }

    setIsCheckingPlagiarism(true);
    setPlagiarismError(null);
    
    try {
      const result = await analyzePlagiarism({ text });
      setPlagiarismResult(result);
      trackUsage("plagiarism");
      toast.success("Plagiarism check complete!");
    } catch (error) {
      console.error("Plagiarism check error:", error);
      const errorMessage = error?.message || "Failed to check plagiarism. Please try again.";
      setPlagiarismError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingPlagiarism(false);
    }
  };

  const handleSetLink = () => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    editor?.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleExport = async (format, includeRefs = true) => {
    const exportFeature = format === "docx" ? "export_docx" : format === "html" ? "export_html" : "export_txt";
    const access = checkFeatureAccess(exportFeature);
    
    if (!access.allowed) {
      setUpgradeLimitType("export");
      setShowUpgradeModal(true);
      return;
    }

    const content = editor?.getHTML() || "";
    const text = editor?.getText() || "";
    
    let referencesText = "";
    let referencesHtml = "";
    
    if (includeRefs && savedReferences.length > 0) {
      referencesText = "\n\n---\n\nReferences\n\n" + 
        savedReferences.map(ref => formatCitation(ref, citationFormat)).join("\n\n");
      referencesHtml = `<hr><h2>References</h2>` + 
        savedReferences.map(ref => `<p>${formatCitation(ref, citationFormat)}</p>`).join("");
    }

    if (format === "txt") {
      const blob = new Blob([text + referencesText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.txt";
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "html") {
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1,h2,h3{margin-top:1.5em}p{margin:1em 0}</style></head><body>${content}${referencesHtml}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.html";
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "docx") {
      try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
        
        const extractTextRuns = (node, TextRun, inheritBold = false, inheritItalic = false) => {
          const runs = [];
          
          const processChild = (child, bold = inheritBold, italic = inheritItalic) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent;
              if (text) {
                runs.push(new TextRun({ text, bold, italics: italic }));
              }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const tag = child.tagName.toLowerCase();
              const isBold = bold || tag === "strong" || tag === "b";
              const isItalic = italic || tag === "em" || tag === "i";
              
              if (tag === "a") {
                runs.push(new TextRun({ text: child.textContent, bold, italics: italic }));
              } else {
                child.childNodes.forEach(c => processChild(c, isBold, isItalic));
              }
            }
          };
          
          node.childNodes.forEach(child => processChild(child));
          return runs.length > 0 ? runs : [new TextRun(node.textContent || "")];
        };
        
        const htmlToDocxElements = (html) => {
          const elements = [];
          const div = document.createElement("div");
          div.innerHTML = html;
          
          const processNode = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            const tag = node.tagName.toLowerCase();
            
            if (tag === "h1") {
              elements.push(new Paragraph({ 
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_1 
              }));
            } else if (tag === "h2") {
              elements.push(new Paragraph({ 
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_2 
              }));
            } else if (tag === "h3") {
              elements.push(new Paragraph({ 
                children: extractTextRuns(node, TextRun),
                heading: HeadingLevel.HEADING_3 
              }));
            } else if (tag === "p") {
              elements.push(new Paragraph({ children: extractTextRuns(node, TextRun) }));
            } else if (tag === "ul") {
              let idx = 0;
              node.querySelectorAll(":scope > li").forEach(li => {
                idx++;
                elements.push(new Paragraph({ 
                  children: [new TextRun("• "), ...extractTextRuns(li, TextRun)]
                }));
              });
            } else if (tag === "ol") {
              let idx = 0;
              node.querySelectorAll(":scope > li").forEach(li => {
                idx++;
                elements.push(new Paragraph({ 
                  children: [new TextRun(`${idx}. `), ...extractTextRuns(li, TextRun)]
                }));
              });
            } else if (tag === "blockquote") {
              elements.push(new Paragraph({ 
                children: extractTextRuns(node, TextRun, false, true),
                indent: { left: 720 }
              }));
            } else if (tag === "hr") {
              elements.push(new Paragraph({ text: "—".repeat(40) }));
            } else if (tag === "br") {
              elements.push(new Paragraph({ text: "" }));
            } else {
              node.childNodes.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  processNode(child);
                }
              });
            }
          };
          
          div.childNodes.forEach(child => processNode(child));
          return elements;
        };
        
        const docElements = htmlToDocxElements(content + referencesHtml);
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: docElements.length > 0 ? docElements : [new Paragraph({ text: text })]
          }]
        });
        
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.docx";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("DOCX export error:", err);
        toast.error("Failed to export DOCX");
        return;
      }
    }
    toast.success(`Exported as ${format.toUpperCase()}${includeRefs && savedReferences.length > 0 ? " with references" : ""}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Academic Writing Studio</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Take a Tour
          </Button>
        </div>
        <p className="text-muted-foreground">
          Write, critique, and enhance your papers, theses, and research with AI-powered tools
        </p>
      </div>

      {showOnboarding && (
        <WritingStudioOnboarding
          onComplete={() => setShowOnboarding(false)}
          onLoadSample={(content) => {
            if (editor) {
              const currentContent = editor.getText().trim();
              if (!currentContent || currentContent.length < 10) {
                editor.commands.setContent(content);
              }
            }
          }}
        />
      )}

      <WritingStudioUpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        limitType={upgradeLimitType}
      />

      {!isPro && paraphraseLimits && paraphraseLimits.totalWordLimit !== 99999 && (
        <div className="mb-4">
          <UsageLimitBanner 
            used={paraphraseLimits.totalWordLimit - paraphraseLimits.remainingWord} 
            limit={paraphraseLimits.totalWordLimit} 
            type="words"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/30 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={cn("h-8 w-8", editor?.isActive("bold") && "bg-muted")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={cn("h-8 w-8", editor?.isActive("italic") && "bg-muted")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={cn("h-8 w-8", editor?.isActive("underline") && "bg-muted")}
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={cn("h-8 w-8", editor?.isActive("strike") && "bg-muted")}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (editor?.isActive("link")) {
                      editor?.chain().focus().unsetLink().run();
                    } else {
                      setShowLinkInput(true);
                    }
                  }}
                  className={cn("h-8 w-8", editor?.isActive("link") && "bg-muted")}
                >
                  {editor?.isActive("link") ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                  className={cn("h-8 w-8", editor?.isActive({ textAlign: "left" }) && "bg-muted")}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                  className={cn("h-8 w-8", editor?.isActive({ textAlign: "center" }) && "bg-muted")}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                  className={cn("h-8 w-8", editor?.isActive({ textAlign: "right" }) && "bg-muted")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={cn("h-8 w-8", editor?.isActive("bulletList") && "bg-muted")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={cn("h-8 w-8", editor?.isActive("orderedList") && "bg-muted")}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="h-8 w-8"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="h-8 w-8"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Type className="h-3 w-3" />
                  {wordCount} words
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" id="writing-studio-export">
                      <FileDown className="h-4 w-4" />
                      Export
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("docx")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Word Document (.docx)
                      {!isPro && <Badge variant="outline" className="ml-auto text-xs">Pro</Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("html")}>
                      <FileText className="h-4 w-4 mr-2" />
                      HTML File (.html)
                      {!isPro && <Badge variant="outline" className="ml-auto text-xs">Pro</Badge>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("txt")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Plain Text (.txt)
                    </DropdownMenuItem>
                    {savedReferences.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                          {savedReferences.length} reference{savedReferences.length > 1 ? "s" : ""} will be included
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {showLinkInput && (
              <div className="border-b bg-muted/20 px-4 py-2 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Enter URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 bg-background border rounded px-2 py-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
                />
                <Button size="sm" onClick={handleSetLink}>Apply</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {editor && (
              <BubbleMenu editor={editor}>
                <div className="flex items-center gap-1 bg-popover border rounded-lg shadow-lg p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleProcess("paraphrase")}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Paraphrase
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleProcess("grammar")}
                    disabled={isProcessing}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Fix Grammar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleProcess("humanize")}
                    disabled={isProcessing}
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    Humanize
                  </Button>
                </div>
              </BubbleMenu>
            )}

            <EditorContent editor={editor} className="min-h-[500px]" id="writing-studio-editor" />

            {selectedText && !showDiff && (
              <div className="border-t bg-primary/5 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
                  {selectedText.split(/\s+/).length} words selected
                </span>
                <span className="text-xs text-muted-foreground">
                  Use the floating menu or sidebar tools to enhance
                </span>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <Tabs defaultValue="actions" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="actions" className="gap-1" id="writing-studio-ai-tools">
                  <Wand2 className="h-4 w-4" />
                  AI Actions
                </TabsTrigger>
                <TabsTrigger value="review" className="gap-1" id="writing-studio-review-tab">
                  <FileSearch className="h-4 w-4" />
                  Review
                </TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="m-0">
                <ScrollArea className="h-[550px]">
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {selectedText ? "Apply to selected text" : "Apply to entire document"}
                    </p>

                    {AI_TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          selectedTool === tool.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg", tool.bgColor)}>
                            <tool.icon className={cn("h-4 w-4", tool.color)} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{tool.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {selectedTool === "paraphrase" && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2">Paraphrase Mode</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PARAPHRASE_MODES.map((mode) => (
                            <TooltipProvider key={mode.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setSelectedMode(mode.id)}
                                    className={cn(
                                      "p-2 rounded border text-xs transition-all text-center",
                                      selectedMode === mode.id
                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                        : "hover:border-primary/50 hover:bg-muted/50"
                                    )}
                                  >
                                    {mode.name}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {mode.description}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTool && (
                      <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Enhance Text
                          </>
                        )}
                      </Button>
                    )}

                    {showDiff && processedResult && (
                      <DiffPreview
                        original={originalText}
                        modified={processedResult}
                        onAccept={handleAcceptChanges}
                        onReject={handleRejectChanges}
                      />
                    )}

                    {!selectedTool && !showDiff && (
                      <div className="pt-4 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Select an AI tool to enhance your academic writing
                        </p>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <WritingTemplates 
                      onApply={(content) => {
                        if (editor) {
                          editor.commands.setContent(content);
                        }
                      }}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="review" className="m-0">
                <ScrollArea className="h-[550px]">
                  <div className="p-4 space-y-4">
                    <WritingAnalysisPanel analysis={textAnalysis} />

                    <Separator />

                    <AIScorePanel aiScore={aiScore} isScanning={isScanning} />

                    <Button
                      onClick={handleScanForAI}
                      disabled={isScanning || wordCount < 50}
                      variant="outline"
                      className="w-full"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="h-4 w-4 mr-2" />
                          Scan for AI Content
                        </>
                      )}
                    </Button>

                    {wordCount < 50 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Write at least 50 words to enable AI detection
                      </p>
                    )}

                    <Separator />

                    <PlagiarismCheckPanel 
                      result={plagiarismResult} 
                      isChecking={isCheckingPlagiarism} 
                      error={plagiarismError}
                      onRetry={handleCheckPlagiarism}
                    />

                    <Button
                      onClick={handleCheckPlagiarism}
                      disabled={isCheckingPlagiarism || wordCount < 50}
                      variant="outline"
                      className="w-full"
                    >
                      {isCheckingPlagiarism ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <FileSearch className="h-4 w-4 mr-2" />
                          Check for Plagiarism
                        </>
                      )}
                    </Button>

                    {wordCount < 50 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Write at least 50 words to check for plagiarism
                      </p>
                    )}

                    <Separator />

                    <ReferenceListPanel 
                      references={savedReferences}
                      onRemove={(index) => {
                        setSavedReferences(prev => prev.filter((_, i) => i !== index));
                        toast.success("Reference removed");
                      }}
                      onInsert={(formattedCitation) => {
                        if (editor) {
                          editor.chain().focus().insertContent({
                            type: "paragraph",
                            content: [{ type: "text", text: formattedCitation }]
                          }).run();
                          toast.success("Citation inserted!");
                        }
                      }}
                      citationFormat={citationFormat}
                      onCopyAll={async () => {
                        if (savedReferences.length === 0) return;
                        const formatted = savedReferences
                          .map(ref => formatCitation(ref, citationFormat))
                          .join("\n\n");
                        try {
                          await navigator.clipboard.writeText(formatted);
                          toast.success("All citations copied!");
                        } catch {
                          toast.error("Failed to copy");
                        }
                      }}
                    />

                    <Separator />

                    <div id="writing-studio-citations-tab">
                    <CitationLookup 
                      onSave={(item) => {
                        const exists = savedReferences.some(
                          ref => ref.title === item.title && ref.year === item.year
                        );
                        if (!exists) {
                          setSavedReferences(prev => [...prev, item]);
                          toast.success("Added to references!");
                          return true;
                        } else {
                          toast.info("This reference is already saved");
                          return false;
                        }
                      }}
                      onInsert={(formattedCitation) => {
                        if (editor) {
                          editor.chain().focus().insertContent({
                            type: "paragraph",
                            content: [{ type: "text", text: formattedCitation }]
                          }).run();
                          toast.success("Citation inserted!");
                        }
                      }}
                      citationFormat={citationFormat}
                      onFormatChange={setCitationFormat}
                      checkLimit={checkLimit}
                      trackUsage={trackUsage}
                      onLimitReached={(type) => {
                        setUpgradeLimitType(type);
                        setShowUpgradeModal(true);
                      }}
                    />
                    </div>

                    <Separator />

                    <CitationFormatHelper />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
