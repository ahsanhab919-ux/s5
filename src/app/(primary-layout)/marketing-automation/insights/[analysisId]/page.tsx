import AIInsights from "@/components/(primary-layout)/(marketing-automation-page)/AIInsights";
import AuthWrapper from "@/components/wrappers/AuthWrapper";

const AIInsightsPage = () => {
  return (
    <AuthWrapper>
      <div>
        <AIInsights />
      </div>
    </AuthWrapper>
  );
};

export default AIInsightsPage;
