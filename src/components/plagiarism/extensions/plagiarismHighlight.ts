import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export type PlagiarismDecoration = {
  from: number;
  to: number;
  similarity: number;
};

const pluginKey = new PluginKey<DecorationSet>("plagiarismHighlight");

const similarityLevel = (similarity: number): "high" | "medium" | "low" => {
  if (similarity >= 75) return "high";
  if (similarity >= 50) return "medium";
  return "low";
};

const buildDecorationSet = (
  doc: Parameters<typeof DecorationSet.create>[0],
  highlights: PlagiarismDecoration[],
) => {
  if (!highlights?.length) {
    return DecorationSet.empty;
  }

  const decorations = highlights
    .filter(
      (range) => {
        const isValid = typeof range?.from === "number" &&
          typeof range?.to === "number" &&
          range.to > range.from &&
          range.from >= 0 &&
          range.to <= doc.content.size;
        
        if (!isValid) {
          console.warn("[Plagiarism Extension] Invalid range filtered:", {
            range,
            docSize: doc.content.size,
            reason: !range ? "null/undefined" :
              typeof range.from !== "number" ? "invalid from" :
              typeof range.to !== "number" ? "invalid to" :
              range.to <= range.from ? "to <= from" :
              range.from < 0 ? "from < 0" :
              range.to > doc.content.size ? "to > docSize" : "unknown"
          });
        }
        
        return isValid;
      },
    )
    .map((range) => {
      const level = similarityLevel(range.similarity ?? 0);
      // Use colors matching AI Detector design system for consistency
      // High similarity = yellow tones (like AI detection), Medium = lighter yellow, Low = lightest yellow
      // Using CSS classes that match AI Detector color scheme: #f5c33b (high), #f5c33bcc (medium), #f5c33b4d (low)
      const highlightClasses = {
        high: "plagiarism-highlight plagiarism-highlight-high rounded-sm px-1 py-0.5 font-semibold shadow-sm",
        medium: "plagiarism-highlight plagiarism-highlight-medium rounded-sm px-1 py-0.5 font-medium",
        low: "plagiarism-highlight plagiarism-highlight-low rounded-sm px-1 py-0.5",
      };
      
      return Decoration.inline(range.from, range.to, {
        class: highlightClasses[level],
        "data-similarity": range.similarity?.toString() ?? "0",
        "data-highlight-level": level,
      });
    });

  return DecorationSet.create(doc, decorations);
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    plagiarismHighlight: {
      /**
       * Update the plagiarism highlight ranges.
       */
      setPlagiarismHighlights: (ranges: PlagiarismDecoration[]) => ReturnType;
    };
  }
}

export const PlagiarismHighlightExtension = Extension.create({
  name: "plagiarismHighlight",

  addStorage() {
    return {
      highlights: [] as PlagiarismDecoration[],
    };
  },

  addCommands() {
    return {
      setPlagiarismHighlights:
        (ranges: PlagiarismDecoration[] = []) =>
        ({ tr, dispatch }) => {
          const sanitized = Array.isArray(ranges) ? ranges : [];
          this.storage.highlights = sanitized;
          if (dispatch) {
            dispatch(tr.setMeta(pluginKey, { highlights: sanitized }));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    const plugin = new Plugin<DecorationSet>({
      key: pluginKey,
      state: {
        init: (_, state) => {
          const decorations = buildDecorationSet(state.doc, extension.storage.highlights);
          return decorations;
        },
        apply(tr, old, oldState, newState) {
          const meta = tr.getMeta(pluginKey);
          if (meta && Array.isArray(meta.highlights)) {
            extension.storage.highlights = meta.highlights;
            return buildDecorationSet(
              newState.doc,
              extension.storage.highlights,
            );
          }

          if (tr.docChanged) {
            return buildDecorationSet(
              newState.doc,
              extension.storage.highlights,
            );
          }

          return old;
        },
      },
      props: {
        decorations(state) {
          const decorations = plugin.getState(state) ?? null;
          if (decorations && decorations !== DecorationSet.empty) {
          }
          return decorations;
        },
      },
    });

    return [plugin];
  },
});

export default PlagiarismHighlightExtension;
