"use client";

import AccountGeneral from "@/components/(primary-layout)/(account-page)/AccountGeneralFormSection";
import AccountWalletSection from "@/components/(primary-layout)/(account-page)/AccountWalletSection";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PATH_ACCOUNT } from "@/config/route";
import { User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export const dynamic = "force-dynamic";

export default function AccountSettings() {
  const { push } = useRouter();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [currentTab, setCurrentTab] = useState("general");

  useEffect(() => {
    if (!accessToken || !user) {
      push("/");
    }
  }, [accessToken, user, push]);

  useEffect(() => {
    document.title = `Account Settings - ${currentTab} || Shothik AI`;
  }, [currentTab]);

  const handleTab = (newValue) => {
    setCurrentTab(newValue);
    const pathMap = {
      general: PATH_ACCOUNT.settings.general,
      billing: PATH_ACCOUNT.settings.billing,
      wallet: `${PATH_ACCOUNT.settings.root}?section=wallet`,
    };
    globalThis.window.history.pushState(
      {},
      "",
      pathMap[newValue] || PATH_ACCOUNT.settings.root,
    );
  };

  // Initialize tab from URL params
  useEffect(() => {
    if (globalThis.window !== undefined) {
      const params = new URLSearchParams(globalThis.window.location.search);
      const section = params.get("section");
      if (section && ["general", "billing", "wallet"].includes(section)) {
        setCurrentTab(section);
      }
    }
  }, []);

  return (
    <div className="px-4 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>Account</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize">{currentTab}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Tabs value={currentTab} onValueChange={handleTab} className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger
            value="general"
            className="flex cursor-pointer items-center gap-2"
          >
            <User className="text-muted-foreground h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="flex cursor-pointer items-center gap-2"
          >
            <Wallet className="text-muted-foreground h-4 w-4" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="my-8">
          <AccountGeneral user={user} />
        </TabsContent>

        <TabsContent value="wallet" className="my-8">
          <AccountWalletSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
