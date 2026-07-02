import PublishAdsScreen from "@/components/(primary-layout)/(marketing-automation-page)/PublishAdsScreen";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const PublishAdsPage = () => {
  return (
    <AuthWrapper>
      <div>
        <PublishAdsScreen />
      </div>
    </AuthWrapper>
  );
};

export default PublishAdsPage;
