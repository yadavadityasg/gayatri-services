import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";

export function FloatingActions() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex flex-col gap-3">
      <a href="https://wa.me/918080848188" target="_blank" rel="noopener"
         className="bg-[#25D366] text-white rounded-full p-3 shadow-elevated animate-float" aria-label="WhatsApp">
        <MessageCircle className="h-6 w-6" />
      </a>
      {show && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-secondary text-secondary-foreground rounded-full p-3 shadow-elevated" aria-label="Back to top">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
