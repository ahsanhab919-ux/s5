import { cn } from "@/lib/utils";
import { FileImage, FileText } from "lucide-react";
import { motion } from "motion/react";

export default function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-end"
    >
      <div
        className={cn(
          "border-border bg-card text-card-foreground border",
          "rounded-[15px_15px_0_15px] p-6",
          "max-w-[70%]",
        )}
      >
        <p className="text-base">{message.message}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-4">
        {message.files
          ? Array.from(message.files).map((file, index) => (
              <div
                key={index}
                className="border-border bg-card text-card-foreground flex items-center gap-4 rounded-md border px-6 py-4"
              >
                {file.name.includes(".pdf") ? (
                  <FileText className="text-destructive size-5" />
                ) : (
                  <FileImage className="text-primary size-5" />
                )}
                <span className="text-sm">{file.name}</span>
              </div>
            ))
          : null}
      </div>
    </motion.div>
  );
}
