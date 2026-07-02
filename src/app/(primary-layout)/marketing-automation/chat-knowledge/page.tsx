import { Knowledge } from "@/components/(primary-layout)/(marketing-automation-page)/Knowledge";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const ChatKnowledgePage = () => {
  return (
    <AuthWrapper>
      <div suppressHydrationWarning>
        <Knowledge />
      </div>
    </AuthWrapper>
  );
};

export default ChatKnowledgePage;
