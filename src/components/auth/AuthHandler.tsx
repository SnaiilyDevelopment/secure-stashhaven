
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Handle the OAuth redirect and hash fragment
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a hash in the URL (from OAuth redirect)
    if (location.hash) {
      console.log("Processing OAuth redirect with hash params");
      
      // Let Supabase handle the hash and session setup
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error("Error processing OAuth session:", error);
          toast({
            title: "Authentication error",
            description: "Failed to complete authentication. Please try again.",
            variant: "destructive"
          });
        } else if (data.session) {
          try {
            // Generate and store encryption key for OAuth users
            const encryptionKey = btoa(String.fromCharCode(
              ...new Uint8Array(crypto.getRandomValues(new Uint8Array(32)))
            ));
            localStorage.setItem('encryption_key', encryptionKey);
            
            console.log("Successfully processed OAuth redirect");
            navigate('/dashboard', { replace: true });
          } catch (e) {
            console.error("Error generating encryption key:", e);
            toast({
              title: "Error setting up encryption",
              description: "There was a problem securing your account. Please try again.",
              variant: "destructive"
            });
          }
        }
      });
    }
  }, [location, navigate]);

  return null;
};

export default AuthHandler;
