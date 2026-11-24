import ScheduleTabs from "@/components/ScheduleTabs";
import { PageNav, SectionHeader } from "@/components/ui";

export const metadata = { title: "Schedule · The Last Protocol" };

export default function Schedule() {
  return (
    <>
      <SectionHeader tag="03 TIMELINE" title="Operation schedule" sub="15–17 December 2026 · supervised hours 08:30 – 20:00." />
      <ScheduleTabs />
      <PageNav prev={["/tracks", "Event"]} next={["/prizes", "Prizes"]} />
    </>
  );
}
