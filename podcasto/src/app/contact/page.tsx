import { Metadata } from "next";
import { MainLayout } from "@/components/layout/main-layout";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us | Podcasto",
  description: "Get in touch with the Podcasto team",
};

export default function ContactPage() {
  return (
    <MainLayout>
      <ContactForm />
    </MainLayout>
  );
} 