import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong className="text-foreground">Name and Contact Data:</strong> We collect your first and last name, email address, postal address, phone number, and other similar contact data.</li>
          <li><strong className="text-foreground">Credentials:</strong> We collect passwords, password hints, and similar security information used for authentication and account access.</li>
          <li><strong className="text-foreground">Payment Data:</strong> We collect data necessary to process your payment if you make purchases, such as your payment instrument number.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "how-we-use-information",
    title: "2. How We Use Information",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>To facilitate account creation and logon process.</li>
          <li>To send administrative information to you for business purposes, legal reasons, and/or possibly for contractual reasons.</li>
          <li>To fulfill and manage your orders, payments, returns, and exchanges.</li>
          <li>To post testimonials with your consent.</li>
          <li>To deliver targeted advertising to you.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "cookies-and-tracking",
    title: "3. Cookies and Tracking Technologies",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out below.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-foreground">Essential Cookies:</strong> Required for the operation of our website and cannot be switched off.</li>
          <li><strong className="text-foreground">Analytics Cookies:</strong> Allow us to count visits and traffic sources so we can measure and improve performance.</li>
          <li><strong className="text-foreground">Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "data-security",
    title: "4. Data Security",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
        <p>We will make any legally required notifications of any breach of security, confidentiality, or integrity of your unencrypted electronically stored personal data to you via email or conspicuous posting on our Services in the most expedient time possible.</p>
      </div>
    ),
  },
  {
    id: "third-party-services",
    title: "5. Third-Party Services",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We may share data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include payment processing, data analysis, email delivery, hosting services, customer service, and marketing efforts.</p>
        <p>We may allow selected third parties to use tracking technology on the Services, which would enable them to collect data about how you interact with the Services over time.</p>
      </div>
    ),
  },
  {
    id: "user-rights",
    title: "6. User Rights",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Request access and obtain a copy of your personal information.</li>
          <li>Request rectification or erasure.</li>
          <li>Restrict the processing of your personal information.</li>
          <li>Data portability (if applicable).</li>
          <li>Object to the processing of your personal information.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "childrens-privacy",
    title: "7. Children's Privacy",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We do not knowingly solicit data from or market to children under 13 years of age. By using the Services, you represent that you are at least 13 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.</p>
        <p>If we learn that personal information from users less than 13 years of age has been collected, we will take reasonable measures to promptly delete such data from our records.</p>
      </div>
    ),
  },
  {
    id: "changes-to-policy",
    title: "8. Changes To This Policy",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>
        <p>We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>
      </div>
    ),
  },
  {
    id: "contact-us",
    title: "9. Contact Us",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>If you have questions or comments about this policy, you may contact us at:</p>
        <ul className="list-none space-y-1">
          <li><strong className="text-foreground">Email:</strong> support@dormlink.com</li>
          <li><strong className="text-foreground">Phone:</strong> +1 (555) 123-4567</li>
          <li><strong className="text-foreground">Address:</strong> 123 Campus Dr, University City, USA</li>
        </ul>
      </div>
    ),
  },
];

const tocItems = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "cookies-and-tracking", label: "Cookies And Tracking" },
  { id: "data-security", label: "Data Security" },
  { id: "third-party-services", label: "Third Party Services" },
  { id: "user-rights", label: "User Rights" },
  { id: "childrens-privacy", label: "Childrens Privacy" },
  { id: "changes-to-policy", label: "Changes To This Policy" },
  { id: "contact-us", label: "Contact Us" },
];

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string>("information-we-collect");

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? "" : id);
  };

  const scrollToSection = (id: string) => {
    setOpenSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground max-w-2xl">
          Welcome to DormLink's Privacy Policy. We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and share information about you when you visit our website DormLink.com and use our services.
        </p>
        <div className="flex gap-3 mt-6">
          <Button className="gap-2 rounded-full">
            <Download className="h-4 w-4" /> Download Policy
          </Button>
          <Button variant="outline" className="gap-2 rounded-full" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Policy
          </Button>
        </div>
      </div>

      {/* Content with TOC */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
        {/* Table of Contents */}
        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Table of Contents</p>
          <nav className="space-y-2">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "block text-sm text-left transition-colors hover:text-primary",
                  openSection === item.id ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-0 divide-y rounded-xl border bg-card">
          {sections.map((section) => (
            <div key={section.id} id={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-primary">{section.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    openSection === section.id && "rotate-180"
                  )}
                />
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
