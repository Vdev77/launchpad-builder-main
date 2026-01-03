import { useEffect } from "react";
import LoginCard from "@/components/LoginCard";
import hospitalBg from "@/assets/hospital-bg.jpg";
import { api } from "@/lib/api";

const Index = () => {
  useEffect(() => {
    const logVisitor = async () => {
      try {
        await api.logging.logVisitor(
          window.location.pathname,
          document.referrer || ""
        );
      } catch (error) {
        console.error('Error logging visitor:', error);
      }
    };

    logVisitor();
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hospitalBg})` }}
      >
        {/* Dark Overlay for better contrast */}
        <div className="absolute inset-0 bg-hospital-navy/30" />
      </div>

      {/* Login Card - Centered */}
      <div className="relative z-10 w-full px-4 flex justify-center">
        <LoginCard />
      </div>

      {/* Footer Links */}
      <div className="absolute bottom-4 right-4 flex gap-4 text-foreground/70 text-sm">
        <a href="#" className="hover:text-foreground transition-colors">Terms of use</a>
        <a href="#" className="hover:text-foreground transition-colors">Privacy & cookies</a>
      </div>
    </div>
  );
};

export default Index;
