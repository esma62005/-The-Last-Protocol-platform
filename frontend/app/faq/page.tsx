import Faq from "@/components/Faq";
import { PageNav, SectionHeader } from "@/components/ui";

export const metadata = { title: "FAQ · The Last Protocol" };

export default function FaqPage() {
  return (
    <>
      <SectionHeader tag="06 INTEL" title="FAQ" sub="Everything you need to know." />
      <Faq />
      <PageNav prev={["/prizes", "Prizes"]} next={["/register", "Register"]} />
    </>
  );
}
