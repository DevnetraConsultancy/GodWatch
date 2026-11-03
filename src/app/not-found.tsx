import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-dvh items-center justify-center">
      <div className="glass w-full max-w-lg rounded-xl">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="This page doesn't exist or has moved."
          action={
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
