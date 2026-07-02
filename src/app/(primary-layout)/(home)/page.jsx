// import HomeContentSection from "@/components/(primary-layout)/(home-v2-page)/HomeContentSection";

import HomeContentSection from "@/components/(primary-layout)/(home-v3-page)/page";

export async function generateMetadata() {
  const siteUrl = "https://www.shothik.ai";

  return {
    title:
      "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
    description:
      "Shothik AI: Paraphrase, humanize, detect AI & translate text to bypass Turnitin & GPTZero. Get a 100% human score & better writing for students, academics & SEOs.",
    keywords: [
      "Shothik",
      "Shothik AI",
      "AI writing tool",
      "Grammar Fix",
      "Sentence rephrasing",
      "Natural language generation",
      "Writing assistant",
      "Error-free writing",
      "Content optimization",
      "Writing enhancement",
      "Online writing tool",
      "AI-powered writing",
      "Writing productivity",
      "Writing efficiency",
      "Writing automation",
      "Online proofreading",
      "Writing software",
      "Language processing",
      "Contextual writing",
      "Automated writing",
      "Writing analysis",
    ],
    openGraph: {
      title:
        "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
      description:
        "Paraphrase, humanize, detect & translate AI text with Shothik AI. Get better writing and bypass Turnitin & GPTZero. Perfect for students, academics & SEOs.",
      images: [
        {
          url: `${siteUrl}/moscot.png`,
          width: 1200,
          height: 630,
          alt: "Shothik AI Logo",
        },
      ],
      type: "website",
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
      description:
        "Transform AI text with Shothik AI! Paraphrase, humanize, detect & translate. Perfect for students, academics, and SEOs. #Paraphrase #HumanizeText",
      images: [`${siteUrl}/moscot.png`],
    },
  };
}

const Home = async () => {
  return (
    <>
      <div hidden>
        <h1>Shothik AI: Humanize, Paraphrase, Detect & Translate AI Text</h1>
        <h2>Humanize AI Text: Make AI Sound Like a Human</h2>
        <p>
          Shothik AI&apos;s advanced algorithms use natural language processing
          to humanize AI-generated content. By refining the style, tone, and
          structure of your text, it transforms robotic AI writing into
          something that sounds natural, engaging, and truly human.
        </p>
        <h2>Paraphrase for Originality: Rewrite Text Effortlessly</h2>
        <p>
          Whether you&apos;re looking to rephrase a few sentences or an entire
          paragraph, Shothik AI makes it easy. It ensures that your rewritten
          content maintains the original meaning while improving its readability
          and flow, giving you unique, plagiarism-free text in seconds.
        </p>
        <h2>Detect AI Content: Ensure Authenticity & Avoid Penalties</h2>
        <p>
          Shothik AI can detect AI-generated content, helping you ensure the
          authenticity of your work. Whether you&apos;re an educator, publisher,
          or business owner, using our AI detection tool can help avoid
          penalties for plagiarism or duplicate content.
        </p>
        <h2>Translate Text: Break Language Barriers with AI</h2>
        <p>
          With Shothik AI&apos;s translation capabilities, you can break down
          language barriers and reach a global audience. Our tool offers
          seamless, accurate translations to and from multiple languages,
          ensuring that your content remains consistent across borders.
        </p>
        <h2>Edit Your Text: Fine-Tune Every Sentence</h2>
        <p>
          Shothik AI allows you to edit your text with precision. Whether
          you&apos;re adjusting the tone, grammar, or word choice, our tool
          provides intelligent suggestions to enhance your writing, making every
          sentence more polished and professional.
        </p>
        <h2>Why Choose Shothik AI</h2>
        <p>
          Shothik AI is the ultimate writing tool for anyone looking to improve
          the quality and originality of their content. With features like AI
          humanization, paraphrasing, detection, and translation, it&apos;s the
          all-in-one solution for creating authentic, error-free text in any
          language.
        </p>
        <h2>How Shothik AI Works</h2>
        <p>
          Shothik AI uses cutting-edge machine learning and natural language
          processing techniques to analyze and improve text. Whether you&apos;re
          paraphrasing, humanizing, detecting AI-generated content, or
          translating text, Shothik AI provides a seamless, intuitive experience
          with fast and accurate results.
        </p>
      </div>

      <main className="container mx-auto">
        <HomeContentSection />
      </main>
    </>
  );
};

export default Home;
