import { Suspense } from "react";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplaceBrowser />
    </Suspense>
  );
}
