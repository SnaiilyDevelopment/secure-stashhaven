import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Loader2, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { registerUser } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import OAuthButtons from './OAuthButtons';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Generate CAPTCHA on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaText(captcha);
    setUserCaptcha('');
  };

  // Check password strength
  const PASSWORD_MIN_LENGTH = 12;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= PASSWORD_MIN_LENGTH) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };

  const validatePassword = (password: string): boolean => {
    if (!password) return false;
    if (password.length < PASSWORD_MIN_LENGTH) return false;
    if (!PASSWORD_REGEX.test(password)) return false;
    return true;
  };

  const validateEmail = (email: string): boolean => {
    if (!EMAIL_REGEX.test(email)) return false;
    
    // Additional validation for disposable emails
    const disposableDomains = [
      'tempmail', 'mailinator', 'guerrillamail', 
      '10minutemail', 'throwawaymail', 'fakeinbox'
    ];
    const domain = email.split('@')[1];
    return !disposableDomains.some(d => domain.includes(d));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs with user feedback
    if (password !== confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Registration Failed",
        description: "Please enter a valid email address (disposable emails not allowed)",
        variant: "destructive"
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: "Registration Failed",
        description: `Password must be at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, number and special character`,
        variant: "destructive"
      });
      return;
    }

    if (!consentGiven) {
      toast({
        title: "Registration Failed",
        description: "You must agree to the terms and privacy policy",
        variant: "destructive"
      });
      return;
    }

    if (userCaptcha.toLowerCase() !== captchaText.toLowerCase()) {
      toast({
        title: "Registration Failed",
        description: "CAPTCHA verification failed",
        variant: "destructive"
      });
      generateCaptcha();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await registerUser(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <OAuthButtons isLoading={isOAuthLoading} />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-green-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-green-600 rounded">Or continue with</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-green-800">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-green-600/60" />
              </div>
              <Input
                id="email"
                placeholder="you@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-green-200 focus:ring-green-500"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-green-800">Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-green-600/60" />
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={handlePasswordChange}
                className="pl-10 border-green-200 focus:ring-green-500"
                required
              />
            </div>
            
            <PasswordStrengthIndicator 
              password={password} 
              passwordStrength={passwordStrength} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-green-800">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-green-200 focus:ring-green-500"
              required
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                ref={captchaRef}
                className="flex-1 bg-gray-100 p-2 rounded text-center font-mono text-lg tracking-widest select-none"
                onClick={generateCaptcha}
              >
                {captchaText}
              </div>
              <Input
                placeholder="Enter CAPTCHA"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
                className="flex-1"
                required
              />
            </div>
            <p className="text-xs text-gray-500">Click on CAPTCHA to refresh</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              required
            />
            <label htmlFor="consent" className="text-sm text-gray-700">
              I agree to the <Link to="/terms" className="text-green-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <Alert variant="default" className="bg-green-50 border-green-200">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-700">
              Your password is never sent to our servers. It's used to create encryption keys that only you control.
            </AlertDescription>
          </Alert>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={isLoading || (password !== confirmPassword) || !email || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your vault...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
