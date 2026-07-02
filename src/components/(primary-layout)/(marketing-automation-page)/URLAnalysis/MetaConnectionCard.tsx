import {
  Facebook,
  LogOut,
  Loader2,
  Settings,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetaUserData {
  user: {
    id: string;
    name: string;
    email: string;
    access_token: string;
  };
  pages: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    category_list: Array<{ id: string; name: string }>;
    tasks: string[];
  }>;
  businessAccounts: Array<{
    id: string;
    name: string;
    access_token: string;
    adsAccounts: Array<{
      id: string;
      name: string;
      account_status: number;
      currency: string;
      timezone_name: string;
    }>;
  }>;
  selectedPageIds: string[];
  selectedBusinessAccountId: string;
  selectedAdsAccountId: string;
}

interface MetaConnectionCardProps {
  metaUserData: MetaUserData;
  metaLoading: boolean;
  onDisconnect: () => void;
}

export default function MetaConnectionCard({
  metaUserData,
  metaLoading,
  onDisconnect,
}: MetaConnectionCardProps) {
  return (
    <Card className="mb-8 border-primary/20 bg-primary/10 p-8 shadow-xl sm:p-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Facebook className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Meta Account Connected
            </h3>
            <p className="text-muted-foreground text-sm">
              Connected as {metaUserData.user.name}
            </p>
          </div>
        </div>
        <Button
          onClick={onDisconnect}
          disabled={metaLoading}
          variant="destructive"
          className="flex items-center gap-2 shadow-lg transition-all hover:shadow-xl"
        >
          {metaLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Disconnect
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pages */}
        <Card className="border-border bg-card p-6 shadow-md">
          <CardHeader>
            <CardTitle className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Settings className="w-5 h-5 text-primary" />
              Facebook Pages ({metaUserData.pages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 space-y-2 overflow-y-auto custom-scrollbar">
              {metaUserData.pages.map((page) => (
                <Card
                  key={page.id}
                  className="flex items-center justify-between border-border bg-muted/50 p-3 transition-colors hover:border-primary/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{page.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                  </div>
                  {metaUserData.selectedPageIds.includes(page.id) && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Accounts */}
        <Card className="border-border bg-card p-6 shadow-md">
          <CardHeader>
            <CardTitle className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <ExternalLink className="w-5 h-5 text-primary" />
              Business Accounts ({metaUserData.businessAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 space-y-2 overflow-y-auto custom-scrollbar">
              {metaUserData.businessAccounts.map((account) => (
                <Card
                  key={account.id}
                  className="flex items-center justify-between border-border bg-muted/50 p-3 transition-colors hover:border-primary/30"
                >
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {account.id}</p>
                  </div>
                  {metaUserData.selectedBusinessAccountId === account.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-primary/30 bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 w-5 h-5 text-primary" />
          <div>
            <p className="text-primary font-medium text-sm">
              Ready for Campaign Publishing
            </p>
            <p className="text-primary/70 mt-1 text-xs">
              Your Meta account is connected and ready to publish campaigns. You
              can now create and publish ads directly to Facebook and Instagram.
            </p>
          </div>
        </div>
      </Card>
    </Card>
  );
}
