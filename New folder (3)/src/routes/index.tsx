import { createFileRoute } from "@tanstack/react-router";
import { BoomStage } from "@/components/boom-stage";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <BoomStage />;
}
