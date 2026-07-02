import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot,
  CheckCircle,
  Loader2,
  MousePointer2,
  Sparkles,
} from "lucide-react";

export default function AgentMessage({ message, handleSideView }) {
  const data = message?.content;
  if (!data && !data.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Bot className="size-7" style={{ color: "#00A76F" }} />
        <h3 className="text-base font-semibold">Shothik AI Agent</h3>
      </div>
      {data[0]?.message?.includes("##") ? (
        <RenderResponse
          className="mt-1"
          item={data[0]}
          handleSideView={handleSideView}
        />
      ) : (
        <p className="mt-1 text-base">{data[0]?.message}</p>
      )}

      {data.slice(1, data.length).map((item, index, arr) => (
        <div className="relative" key={index}>
          <div className="absolute top-2.5 left-0 z-20">
            <CheckCircle className="text-primary size-4" />
          </div>
          <div
            className="border-primary absolute top-3 z-10 border-l border-dashed"
            style={{
              bottom: arr.length - 1 === index ? "12px" : "-12px",
              left: "8px",
            }}
          />

          <Accordion
            type="single"
            collapsible
            defaultValue="item"
            className="ml-3 border-none shadow-none"
          >
            <AccordionItem value="item" className="border-none">
              <AccordionTrigger
                hideChevron={item?.message?.includes("##")}
                className="py-0 hover:no-underline"
              >
                {item?.message?.includes("##") ? (
                  <RenderResponse item={item} handleSideView={handleSideView} />
                ) : (
                  <p>{item.message}</p>
                )}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 px-1 py-0">
                {item.data && item.data.length
                  ? item.data.map((subMessage, index) => {
                      if (subMessage.type === "text") {
                        return (
                          <p
                            className="text-muted-foreground text-sm"
                            key={index}
                          >
                            {subMessage.message}
                          </p>
                        );
                      } else if (subMessage.type === "tool") {
                        return (
                          <div
                            onClick={() => handleSideView(subMessage)}
                            className="border-primary/20 bg-primary/10 flex w-fit max-w-full cursor-pointer items-center gap-0.5 rounded-lg border px-1.5 py-0.5 text-sm"
                            key={index}
                          >
                            <span className="font-semibold">Tool</span>
                            <span>||</span>
                            {subMessage.agent_name === "browser_agent" ? (
                              <MousePointer2 className="text-primary size-4" />
                            ) : subMessage.agent_name === "planner_agent" ? (
                              <Sparkles className="text-primary size-4.5" />
                            ) : (
                              <Bot
                                className="size-4"
                                style={{ color: "#00A76F" }}
                              />
                            )}

                            <span className="grow truncate">
                              {subMessage.message}
                            </span>
                            {subMessage?.status === "progress" ? (
                              <Loader2 className="text-primary size-4 animate-spin" />
                            ) : (
                              <Button variant="ghost" className="h-auto p-0">
                                View
                              </Button>
                            )}
                          </div>
                        );
                      } else return null;
                    })
                  : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function RenderResponse({ item, handleSideView, className }) {
  if (!item) return null;
  return (
    <div
      onClick={() =>
        handleSideView({
          type: "result",
          data: item.message,
          status: item.status,
          agent_name: item.agent_name,
          message: "Shothik AI Agent Task is completed",
        })
      }
      className={cn(
        "border-primary/20 bg-primary/10 flex w-fit cursor-pointer items-center gap-0.5 rounded-lg border px-1.5 py-0.5",
        className,
      )}
    >
      <Bot className="size-4" style={{ color: "#00A76F" }} />
      <span className="text-sm font-semibold">
        Shothik AI Agent Task is completed
      </span>
      <span>||</span>
      <span className="text-sm font-semibold">View</span>
    </div>
  );
}
