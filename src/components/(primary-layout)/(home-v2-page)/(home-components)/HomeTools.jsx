import { NAV_TOOLS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";
import Link from "next/link";
import BgContainer from "./components/hero/BgContainer";
import UserActionButton from "./components/hero/UserActionButton";

export default function HomeTools() {
  return (
    <BgContainer
      className="bg-primary/8 mb-3 px-2 py-8 sm:px-4 md:px-6"
      // image='url(/home/bg.png)'
    >
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-6 text-center text-[1.8rem] leading-tight font-semibold sm:text-[2rem] md:text-[3rem] lg:text-[3rem]"
        >
          Seven powerful{" "}
          <b
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 40%, hsl(var(--primary)) 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800,
            }}
          >
            tools
          </b>
          , <br />
          one unified platform
        </motion.h2>

        <div className="grid grid-cols-12 gap-3">
          {NAV_TOOLS.map((tool, i) =>
            tool.link ? (
              <motion.div
                key={tool.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 * (i + 1) }}
                viewport={{ once: true }}
                className="col-span-12 sm:col-span-6 md:col-span-4"
              >
                <Link
                  href={tool.link}
                  className={cn(
                    "border-border block flex h-full min-h-[90px] cursor-pointer items-start gap-2 rounded-xl border-[0.5px] bg-transparent p-2 no-underline shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
                  )}
                >
                  <div
                    style={{ color: tool.iconColor }}
                    className="[&_svg]:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full [&_svg]:text-2xl"
                  >
                    {tool.icon}
                  </div>
                  {tool.label && (
                    <span
                      style={{
                        backgroundColor: tool.iconColor,
                      }}
                      className="text-foreground rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase sm:text-xs"
                    >
                      {tool.label}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        "after:text-primary flex max-w-full items-center gap-0.5 overflow-hidden text-lg font-medium text-ellipsis whitespace-nowrap after:shrink-0 after:content-['›'] sm:text-xl md:text-xl lg:text-[22px] xl:text-[22px]",
                      )}
                    >
                      {tool.title}
                    </h3>
                    <p
                      className={cn(
                        "text-muted-foreground line-clamp-2 overflow-hidden text-sm text-ellipsis",
                      )}
                    >
                      {tool.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ) : null,
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <UserActionButton />
        </div>
      </div>
    </BgContainer>
  );
}
