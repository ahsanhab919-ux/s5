import PolicyPageLayout from "@/components/(secondary-layout)/PolicyPageLayout";

export async function generateMetadata() {
  return {
    title: "Shothik AI: Terms & Conditions | Shothik AI",
    description: "This is terms and condition page",
  };
}

export default function TermsPage() {
  const navigationItems = [
    {
      id: "terms-main",
      label: "Shothik AI Terms and Conditions",
    },
    {
      id: "section-1",
      label: "1. Acceptance of Terms",
    },
    {
      id: "section-2",
      label: "2. Services Provided",
    },
    {
      id: "section-3",
      label: "3. User Responsibilities",
    },
    {
      id: "section-4",
      label: "4. Prohibited Activities",
    },
    {
      id: "section-5",
      label: "5. Intellectual Property",
    },
    {
      id: "section-6",
      label: "6. Payment for Services",
    },
    {
      id: "section-7",
      label: "7. Modifications to the Services",
    },
    {
      id: "section-8",
      label: "8. Disclaimer of Warranties",
    },
    {
      id: "section-9",
      label: "9. Limitation of Liability",
    },
    {
      id: "section-10",
      label: "10. Governing Law and Dispute Resolution",
    },
    {
      id: "marketing-automation-terms",
      label: "Shothik AI Marketing Automation - Terms and Conditions",
    },
    {
      id: "ma-section-1",
      label: "1. Agreement to Terms",
    },
    {
      id: "ma-section-2",
      label: "2. Eligibility",
    },
    {
      id: "ma-section-3",
      label: "3. Account Registration",
    },
    {
      id: "ma-section-4",
      label: "4. Acceptable Use",
    },
    {
      id: "ma-section-5",
      label: "5. Meta Platform Integration",
    },
    {
      id: "ma-section-6",
      label: "6. AI-Generated Content",
    },
    {
      id: "ma-section-7",
      label: "7. Intellectual Property",
    },
    {
      id: "ma-section-8",
      label: "8. Payment and Billing",
    },
    {
      id: "ma-section-9",
      label: "9. Data and Privacy",
    },
    {
      id: "ma-section-10",
      label: "10. Service Availability",
    },
    {
      id: "ma-section-11",
      label: "11. Limitation of Liability",
    },
    {
      id: "ma-section-12",
      label: "12. Disclaimer of Warranties",
    },
    {
      id: "ma-section-13",
      label: "13. Indemnification",
    },
    {
      id: "ma-section-14",
      label: "14. Termination",
    },
    {
      id: "ma-section-15",
      label: "15. Governing Law and Disputes",
    },
    {
      id: "ma-section-16",
      label: "16. Changes to Terms",
    },
    {
      id: "ma-section-17",
      label: "17. General Provisions",
    },
    {
      id: "ma-section-18",
      label: "18. Meta-Specific Terms",
    },
    {
      id: "ma-section-19",
      label: "19. Contact Information",
    },
  ];

  return (
    <PolicyPageLayout
      heading="Terms & Conditions"
      links={[{ name: "Legal" }, { name: "Terms & Conditions" }]}
      subtitle="These Terms govern your use of our website and services. By using our Services, you agree to these Terms."
      navigationItems={navigationItems}
    >
      {/* Main content */}
      <div className="space-y-6">
        <h1 id="terms-main" className="text-2xl font-bold md:text-3xl">Shothik AI Terms and Conditions</h1>

        <p className="text-base leading-relaxed">
          These Terms of Service ("Agreement") are made between Shothik AI
          (referred to as "Company", "we", "us", or "our") and you ("User",
          "you", or "your"), the individual accessing our services. By using the
          Shothik AI platform, you agree to comply with the terms and conditions
          outlined below. If you do not agree, please discontinue using the
          services immediately.
        </p>

        <div className="space-y-4">
          <h2 id="section-1" className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-base leading-relaxed">
            By using the Shothik AI services, you affirm that you are at least
            13 years of age. Minors (under 18 years of age) must have the
            consent of a parent or guardian to use the services. Shothik AI
            reserves the right to change these terms at any time. You will be
            notified of any changes via email or a notice on our website. Your
            continued use of the services after any modifications indicates your
            acceptance of the updated terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-2" className="text-2xl font-semibold">2. Services Provided</h2>
          <p className="text-base leading-relaxed">
            Shothik AI offers a wide range of AI-powered writing and translation
            tools designed to assist users in creating, refining, and improving
            content. The services provided include:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Paraphrasing: Rewriting content while maintaining the original
              meaning.
            </li>
            <li>
              Bypass GPT: Advanced paraphrasing and content generation that
              avoids detection by AI detection tools, ideal for academic or
              content creation use cases.
            </li>
            <li>
              Grammar Fix: Correcting grammatical errors, improving sentence
              structure, and ensuring content is written clearly.
            </li>
            <li>
              Summarizing: Condensing long pieces of text into shorter summaries
              that capture the main points.
            </li>
            <li>
              Translator: Translating content between multiple languages,
              providing accurate and context-aware translations.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 id="section-3" className="text-2xl font-semibold">3. User Responsibilities</h2>
          <p className="text-base leading-relaxed">Users agree to:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Provide accurate, current, and complete information during
              registration.
            </li>
            <li>
              Maintain the confidentiality of account credentials and notify us
              immediately of unauthorized use of your account.
            </li>
            <li>
              Comply with all applicable laws and not use our services for any
              unlawful or fraudulent purposes.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 id="section-4" className="text-2xl font-semibold">4. Prohibited Activities</h2>
          <p className="text-base leading-relaxed">Users may not:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Attempt to breach or bypass security features of the site.</li>
            <li>
              Use the services to defraud, mislead, or impersonate others.
            </li>
            <li>
              Use Shothik AI for any illegal purposes, including sending
              harassing or harmful content.
            </li>
            <li>Reverse-engineer or misuse any part of the service.</li>
            <li>
              Share account credentials with unauthorized persons or resell the
              services without permission.
            </li>
          </ul>
          <p className="text-base leading-relaxed">
            Violation of any of these prohibitions may result in termination of
            your account and legal action.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-5" className="text-2xl font-semibold">5. Intellectual Property</h2>
          <p className="text-base leading-relaxed">
            All content, technology, and trademarks on Shothik AI are owned by
            the Company. Users are granted a limited, non-exclusive license to
            use the services for personal or internal business purposes only. No
            content may be reproduced, distributed, or publicly displayed
            without our express written consent.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-6" className="text-2xl font-semibold">6. Payment for Services</h2>
          <p className="text-base leading-relaxed">
            See our Payment Policy below for details on fees, billing, and
            subscription terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-7" className="text-2xl font-semibold">
            7. Modifications to the Services
          </h2>
          <p className="text-base leading-relaxed">
            Shothik AI reserves the right to modify, suspend, or discontinue any
            part of our services at any time, with or without notice.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-8" className="text-2xl font-semibold">
            8. Disclaimer of Warranties
          </h2>
          <p className="text-base leading-relaxed">
            Shothik AI services are provided "AS IS" and "AS AVAILABLE". We do
            not guarantee that the services will meet your needs or be
            error-free. We disclaim all warranties, express or implied,
            including any warranties of merchantability or fitness for a
            particular purpose.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-9" className="text-2xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-base leading-relaxed">
            In no event shall Shothik AI be liable for any direct, indirect,
            incidental, special, or consequential damages arising from the use
            of our services. This limitation applies to all claims, including
            but not limited to lost profits, service interruptions, or
            inaccuracies in service content.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-10" className="text-2xl font-semibold">
            10. Governing Law and Dispute Resolution
          </h2>
          <p className="text-base leading-relaxed">
            These Terms are governed by the laws of Bangladesh. Any disputes
            arising out of or related to these Terms or the use of our services
            will be settled in the courts of Bangladesh.
          </p>
        </div>
      </div>

      {/* Marketing automation content */}
      <div className="space-y-6 border-t border-border pt-12 mt-12">
        <h1 id="marketing-automation-terms" className="text-2xl font-bold md:text-3xl">
          Shothik AI Marketing Automation - Terms and Conditions
        </h1>

        <div className="space-y-6">
          <div className="text-sm">Last updated: October 20, 2025</div>

          <div className="space-y-4">
            <h2 id="ma-section-1" className="text-2xl font-semibold">1. Agreement to Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing or using <strong>Shothik AI</strong> (the
              "Platform"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, you may not access
              or use the Platform.
            </p>
            <p className="text-base leading-relaxed">
              Shothik AI is a marketing automation platform that provides
              AI-powered campaign creation, competitive intelligence, and
              advertising management for Facebook and Instagram.
            </p>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-2" className="text-2xl font-semibold">2. Eligibility</h2>
            <p className="text-base leading-relaxed">
              You must meet the following requirements to use the Platform:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Have the legal authority to enter into this agreement</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>
                Not be prohibited from using the Platform under applicable law
              </li>
              <li>
                Have a valid Facebook/Meta Business account (for campaign
                management features)
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-3" className="text-2xl font-semibold">3. Account Registration</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">3.1 Account Creation</h3>
              <p className="text-base leading-relaxed">
                To use certain features of the Platform, you must register for
                an account by providing:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Valid email address</li>
                <li>Secure password</li>
                <li>Company information (optional)</li>
                <li>
                  Facebook/Meta account connection (for campaign features)
                </li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">3.2 Account Security</h3>
              <p className="text-base leading-relaxed">
                You are responsible for:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>
                  Ensuring your account information is accurate and current
                </li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                3.3 Facebook/Meta Account Connection
              </h3>
              <p className="text-base leading-relaxed">
                By connecting your Facebook/Meta account, you authorize Shothik
                AI to access and manage your ad accounts, pages, and campaigns
                on your behalf. You are responsible for ensuring you have proper
                authorization to connect these accounts.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-4" className="text-2xl font-semibold">4. Acceptable Use</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">4.1 Permitted Use</h3>
              <p className="text-base leading-relaxed">
                You may use the Platform to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  Create and manage Facebook/Instagram advertising campaigns
                </li>
                <li>
                  Research competitor advertising strategies (using public data)
                </li>
                <li>Generate AI-powered campaign ideas and content</li>
                <li>Monitor and optimize your advertising performance</li>
                <li>Create images, videos, and Reels for advertising</li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">4.2 Prohibited Use</h3>
              <p className="text-base leading-relaxed">You agree NOT to:</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  <strong>Violate Meta's Policies</strong> - All campaigns must
                  comply with Meta's Advertising Policies and Community
                  Standards
                </li>
                <li>
                  <strong>Create deceptive ads</strong> - No misleading,
                  fraudulent, or false advertising
                </li>
                <li>
                  <strong>Spam or harass</strong> - No unsolicited messages or
                  harassment campaigns
                </li>
                <li>
                  <strong>Infringe intellectual property</strong> - Respect
                  copyrights, trademarks, and patents
                </li>
                <li>
                  <strong>Scrape or abuse</strong> - No unauthorized data
                  collection or system abuse
                </li>
                <li>
                  <strong>Resell the service</strong> - Platform is for your
                  business use only
                </li>
                <li>
                  <strong>Reverse engineer</strong> - No attempts to copy,
                  modify, or steal our technology
                </li>
                <li>
                  <strong>Promote illegal activities</strong> - No drugs,
                  weapons, illegal services
                </li>
                <li>
                  <strong>Share accounts</strong> - Each account is for
                  individual/business use only
                </li>
              </ul>
            </div>

            <div className="border-border bg-muted/50 rounded-lg border p-4">
              <p className="text-base leading-relaxed">
                <strong>Important:</strong> Violations of Meta's Advertising
                Policies may result in your Meta ad account being suspended. We
                are not responsible for Meta account suspensions resulting from
                policy violations.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-5" className="text-2xl font-semibold">
              5. Meta Platform Integration
            </h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">5.1 Third-Party Platform</h3>
              <p className="text-base leading-relaxed">
                Shothik AI integrates with Meta's platforms (Facebook,
                Instagram) through official APIs. Your use of Meta's platforms
                is subject to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>
                  <a
                    href="https://www.facebook.com/terms.php"
                    target="_blank"
                    className="text-primary"
                  >
                    Meta Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/policies/ads/"
                    target="_blank"
                    className="text-primary"
                  >
                    Meta Advertising Policies
                  </a>
                </li>
                <li>
                  <a
                    href="https://developers.facebook.com/terms"
                    target="_blank"
                    className="text-primary"
                  >
                    Meta Platform Terms
                  </a>
                </li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">5.2 Meta API Compliance</h3>
              <p className="text-base leading-relaxed">
                We access Meta's APIs in compliance with their Platform Terms.
                Changes to Meta's APIs, policies, or terms may affect Platform
                functionality. We are not responsible for disruptions caused by
                Meta's changes.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                5.3 Ad Account Requirements
              </h3>
              <p className="text-base leading-relaxed">
                To use campaign management features:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>You must have a valid Meta Business Manager account</li>
                <li>Your ad account must be in good standing</li>
                <li>
                  You must have proper payment methods configured in Meta Ads
                  Manager
                </li>
                <li>You are responsible for all ad spend charges from Meta</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-6" className="text-2xl font-semibold">6. AI-Generated Content</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">6.1 Content Generation</h3>
              <p className="text-base leading-relaxed">
                The Platform uses AI (Google Gemini, Vertex AI, Fal AI) to
                generate campaign ideas, ad copy, images, and videos.
                AI-generated content is provided as suggestions and requires
                your review and approval before publishing.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                6.2 Content Responsibility
              </h3>
              <p className="text-base leading-relaxed">
                <strong>
                  You are solely responsible for all content you publish
                </strong>
                , including AI-generated content. You must:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Review all AI-generated content before publishing</li>
                <li>
                  Ensure content complies with Meta's Advertising Policies
                </li>
                <li>Verify accuracy of claims and statements</li>
                <li>Respect intellectual property rights</li>
                <li>
                  Comply with applicable advertising laws (FTC, FDA, etc.)
                </li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                6.3 No Warranty on AI Content
              </h3>
              <p className="text-base leading-relaxed">
                AI-generated content is provided "as is" without warranties of
                accuracy, completeness, or suitability. We do not guarantee ad
                performance or compliance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-7" className="text-2xl font-semibold">7. Intellectual Property</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                7.1 Our Intellectual Property
              </h3>
              <p className="text-base leading-relaxed">
                Shothik AI owns all rights to the Platform, including software,
                algorithms, UI design, branding, and documentation. You may not
                copy, modify, distribute, or create derivative works without
                permission.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">7.2 Your Content</h3>
              <p className="text-base leading-relaxed">
                You retain ownership of content you upload (product images,
                brand materials, etc.). By uploading content, you grant us a
                license to:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Store and process your content to provide the service</li>
                <li>Use content to train and improve our AI models</li>
                <li>Display content in your campaigns and analytics</li>
              </ul>
              <p className="text-base leading-relaxed">
                This license ends when you delete your content or account.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                7.3 AI-Generated Content Ownership
              </h3>
              <p className="text-base leading-relaxed">
                You own AI-generated content created for your campaigns. We do
                not claim ownership of campaign materials generated through the
                Platform.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-8" className="text-2xl font-semibold">8. Payment and Billing</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">8.1 Platform Fees</h3>
              <p className="text-base leading-relaxed">
                Shothik AI may charge subscription fees for Platform access.
                Current pricing is available at [pricing page]. By subscribing,
                you agree to pay all applicable fees.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                8.2 Meta Advertising Costs
              </h3>
              <p className="text-base leading-relaxed">
                <strong>
                  You are responsible for all Facebook/Instagram advertising
                  costs.
                </strong>
                Ad spend is billed directly by Meta through your ad account. We
                do not charge or collect ad spend fees.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">8.3 Refunds</h3>
              <p className="text-base leading-relaxed">
                Platform subscription fees are non-refundable except as required
                by law. We do not provide refunds for Meta ad spend (contact
                Meta directly for billing issues).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-9" className="text-2xl font-semibold">9. Data and Privacy</h2>
            <p className="text-base leading-relaxed">
              Your use of the Platform is subject to our{" "}
              <a href="/privacy" className="text-primary">
                Privacy Policy
              </a>
              , which explains how we collect, use, and protect your data.
            </p>
            <p className="text-base leading-relaxed">Key points:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>We collect account information and campaign data</li>
              <li>Your data is encrypted and stored securely</li>
              <li>You can request data deletion at any time</li>
              <li>We comply with GDPR and CCPA</li>
              <li>We do not sell your personal information</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-10" className="text-2xl font-semibold">10. Service Availability</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">10.1 Uptime</h3>
              <p className="text-base leading-relaxed">
                We strive to maintain Platform availability but do not guarantee
                uninterrupted service. Maintenance, updates, or technical issues
                may cause temporary downtime.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">10.2 Service Changes</h3>
              <p className="text-base leading-relaxed">
                We may modify, suspend, or discontinue features at any time. We
                will provide notice of material changes when possible.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                10.3 Third-Party Dependencies
              </h3>
              <p className="text-base leading-relaxed">
                The Platform relies on third-party services (Meta APIs, Google
                AI, MongoDB, etc.). Disruptions to these services may affect
                Platform functionality.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-11" className="text-2xl font-semibold">
              11. Limitation of Liability
            </h2>

            <p className="text-base leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHOTHIK AI SHALL NOT BE
              LIABLE FOR:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Ad performance</strong> - We do not guarantee campaign
                results, conversions, or ROI
              </li>
              <li>
                <strong>Meta account suspensions</strong> - Policy violations or
                ad disapprovals by Meta
              </li>
              <li>
                <strong>Data loss</strong> - Loss of campaigns, analytics, or
                content due to technical issues
              </li>
              <li>
                <strong>Third-party services</strong> - Failures of Meta,
                Google, or other integrated services
              </li>
              <li>
                <strong>AI content issues</strong> - Inaccuracies, errors, or
                policy violations in AI-generated content
              </li>
              <li>
                <strong>Indirect damages</strong> - Lost profits, business
                interruption, or consequential damages
              </li>
            </ul>

            <p className="text-base leading-relaxed">
              Our total liability for any claims shall not exceed the amount you
              paid to Shothik AI in the 12 months prior to the claim.
            </p>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-12" className="text-2xl font-semibold">
              12. Disclaimer of Warranties
            </h2>
            <p className="text-base leading-relaxed">
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>
                Accuracy, reliability, or completeness of AI-generated content
              </li>
              <li>Uninterrupted, secure, or error-free operation</li>
              <li>Compliance with Meta's evolving policies</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-13" className="text-2xl font-semibold">13. Indemnification</h2>
            <p className="text-base leading-relaxed">
              You agree to indemnify and hold harmless Shothik AI from any
              claims, damages, or expenses arising from:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Your use of the Platform</li>
              <li>Your advertising campaigns and content</li>
              <li>Violations of these Terms or applicable laws</li>
              <li>Violations of Meta's policies</li>
              <li>Infringement of third-party intellectual property rights</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-14" className="text-2xl font-semibold">14. Termination</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                14.1 Your Right to Terminate
              </h3>
              <p className="text-base leading-relaxed">
                You may terminate your account at any time by:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Deleting your account in Platform settings</li>
                <li>Contacting support@shothik.ai</li>
                <li>Removing the app from your Facebook account</li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                14.2 Our Right to Terminate
              </h3>
              <p className="text-base leading-relaxed">
                We may suspend or terminate your account if you:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Violate these Terms or Meta's policies</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Abuse or misuse the Platform</li>
                <li>Fail to pay applicable fees</li>
              </ul>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">
                14.3 Effect of Termination
              </h3>
              <p className="text-base leading-relaxed">Upon termination:</p>
              <ul className="ml-4 list-inside list-disc space-y-1">
                <li>Your access to the Platform will be revoked</li>
                <li>
                  Your data will be deleted per our{" "}
                  <a href="/deletion" className="text-primary">
                    deletion policy
                  </a>
                </li>
                <li>
                  Active campaigns will continue running in Meta (pause them
                  separately)
                </li>
                <li>You remain responsible for any outstanding fees</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-15" className="text-2xl font-semibold">
              15. Governing Law and Disputes
            </h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">15.1 Governing Law</h3>
              <p className="text-base leading-relaxed">
                These Terms are governed by the laws of Bangladesh, without
                regard to conflict of law principles.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">15.2 Dispute Resolution</h3>
              <p className="text-base leading-relaxed">
                Before filing a lawsuit, you agree to contact us at
                legal@shothik.ai to attempt to resolve the dispute informally.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">15.3 Arbitration</h3>
              <p className="text-base leading-relaxed">
                Any disputes that cannot be resolved informally shall be settled
                through binding arbitration in accordance with Bangladesh
                Arbitration Act rules.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-16" className="text-2xl font-semibold">16. Changes to Terms</h2>
            <p className="text-base leading-relaxed">
              We may update these Terms periodically. Changes will be posted on
              this page with an updated "Last updated" date. Material changes
              will be communicated via email or Platform notification.
            </p>
            <p className="text-base leading-relaxed">
              Continued use of the Platform after changes take effect
              constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-17" className="text-2xl font-semibold">17. General Provisions</h2>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">17.1 Entire Agreement</h3>
              <p className="text-base leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and Shothik AI.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">17.2 Severability</h3>
              <p className="text-base leading-relaxed">
                If any provision of these Terms is found unenforceable, the
                remaining provisions will remain in full effect.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">17.3 Waiver</h3>
              <p className="text-base leading-relaxed">
                Our failure to enforce any provision does not constitute a
                waiver of that provision.
              </p>
            </div>

            <div className="ml-4 space-y-3">
              <h3 className="text-xl font-medium">17.4 Assignment</h3>
              <p className="text-base leading-relaxed">
                You may not assign these Terms without our consent. We may
                assign our rights and obligations to any successor or acquirer.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="ma-section-18" className="text-2xl font-semibold">18. Meta-Specific Terms</h2>
            <p className="text-base leading-relaxed">
              Additional terms for Meta platform integration:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                You acknowledge that Meta is a third-party beneficiary of these
                Terms
              </li>
              <li>
                You comply with Meta's Platform Terms and Advertising Policies
              </li>
              <li>
                Meta may enforce provisions related to their platforms directly
                against you
              </li>
              <li>
                We access Meta data only as permitted by their Platform Terms
              </li>
              <li>
                You understand that Meta's policy changes may affect Platform
                features
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-lg">
            <h2 id="ma-section-19" className="text-2xl font-semibold">19. Contact Information</h2>
            <p className="text-base leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <p className="text-base leading-relaxed">
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@shothik.ai" className="text-primary">
                legal@shothik.ai
              </a>
              <br />
              <strong>Support:</strong>{" "}
              <a href="mailto:support@shothik.ai" className="text-primary">
                support@shothik.ai
              </a>
              <br />
              <strong>Privacy:</strong>{" "}
              <a href="mailto:privacy@shothik.ai" className="text-primary">
                privacy@shothik.ai
              </a>
            </p>
            <p className="text-base leading-relaxed">
              <strong>Related Documents:</strong>
              <br />
              <a href="/privacy" className="text-primary">
                Privacy Policy
              </a>{" "}
              |
              <a href="/deletion" className="text-primary ml-2">
                Data Deletion Instructions
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        <p>©️ 2025 Shothik AI. All rights reserved.</p>
        <p className="mt-2">
          By using this Platform, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service.
        </p>
      </div> */}
    </PolicyPageLayout>
  );
}
