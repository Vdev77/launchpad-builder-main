import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import logo from "@/assets/akh-logo.png";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
});

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        await api.auth.register(email, password);
        await api.logging.logSecurityEvent(email, 'registration', 'success');

        toast.success("Registration successful! You can now sign in.");
        setIsSignUp(false); // Switch to login mode
      } else {
        // Login flow
        const { token } = await api.auth.login(email, password);

        // Store token (basic implementation)
        localStorage.setItem('authToken', token);

        await api.logging.logSecurityEvent(email, 'login', 'success');
        toast.success("Login successful! Redirecting...");

        // Redirect to ak-hospital.com after successful login
        setTimeout(() => {
          window.location.href = 'https://ak-hospital.com';
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      await api.logging.logSecurityEvent(email, isSignUp ? 'registration' : 'login', 'failure', errorMessage);

      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      // Check if this is the second failure (or more)
      if (nextAttempts >= 2) {
        window.alert(" Added to system");
        setTimeout(() => {
          window.location.href = 'https://ak-hospital.com';
        }, 5000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="bg-card rounded-lg shadow-2xl overflow-hidden">
        {/* Logo Section */}
        <div className="p-8 pb-4 flex justify-center">
          <img
            src={logo}
            alt="Ain Al Khaleej Hospital"
            className="h-16 object-contain"
          />
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@ak-hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-input bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground font-medium">
              Password
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-input bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              required
              disabled={isLoading}
            />
          </div>

          {/* Toggle between Login/Signup */}


          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="px-8 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Processing..." : (isSignUp ? "Sign up" : "Sign in")}
            </Button>
          </div>
        </form>

        {/* Help Section */}
        <div className="px-8 py-4 bg-muted/50 border-t border-border">
          <p className="text-sm text-card-foreground">
            If you Need Help : <span className="font-medium">Contact to IT Team</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;

