import { MessengerInbox } from "@/components/(primary-layout)/(marketing-automation-page)/MessengerInbox";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const MessengerPage = () => {
  return (
    <AuthWrapper>
      <div>
        <MessengerInbox />
      </div>
    </AuthWrapper>
  );
};

export default MessengerPage;
