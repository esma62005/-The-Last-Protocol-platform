import ScheduleTabs from "@/components/ScheduleTabs";
import { PageNav, SectionHeader } from "@/components/ui";

export const metadata = { title: "Schedule · The Last Protocol" };

export default function Schedule() {
  return (
    <>
      <SectionHeader tag="03 TIMELINE" title="Operation schedule" sub="Three phases. Zero sleep." />
      <ScheduleTabs />
      <PageNav prev={["/tracks", "Tracks"]} next={["/prizes", "Prizes"]} />
    </>
  );
}
