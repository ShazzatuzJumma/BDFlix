import { BDnFlixApp } from "@/components/bdnflix/BDnFlixApp";
import { ErrorBoundary } from "@/components/bdnflix/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <BDnFlixApp />
    </ErrorBoundary>
  );
}
