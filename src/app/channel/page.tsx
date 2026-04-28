import type { Metadata } from "next";
import { ChannelStudio } from "@/components/channel-studio";

export const metadata: Metadata = {
  title: "TRAM - Channel Configuration",
  description: "TRAM Channel Configuration",
};

export default function ChannelPage() {
  return <ChannelStudio />;
}