import { WebhookSettings } from "@/components/(primary-layout)/(marketing-automation-page)/WebhookSettings";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const WebhookPage = () => {
  return (
    <AuthWrapper>
      <div>
        <WebhookSettings />
      </div>
    </AuthWrapper>
  );
};

export default WebhookPage;
