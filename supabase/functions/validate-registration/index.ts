
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Password strength criteria - must match client-side criteria
const PASSWORD_CRITERIA = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true, 
  requireNumbers: true,
  requireSpecial: true
}

// Valid email regex for server-side validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Validation function for email
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" }
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Please enter a valid email address" }
  }
  
  // Check for disposable email domains
  const disposableDomains = [
    'tempmail', 'mailinator', 'guerrillamail', 
    '10minutemail', 'throwawaymail', 'fakeinbox'
  ]
  
  const domain = email.split('@')[1]
  if (disposableDomains.some(d => domain.includes(d))) {
    return { valid: false, error: "Disposable email addresses are not allowed" }
  }
  
  return { valid: true }
}

// Validation function for password
function validatePasswordStrength(password: string): { 
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = []
  
  if (password.length < PASSWORD_CRITERIA.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CRITERIA.minLength} characters long`)
  }
  
  if (PASSWORD_CRITERIA.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (PASSWORD_CRITERIA.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (PASSWORD_CRITERIA.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (PASSWORD_CRITERIA.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Check if a user with this email already exists
async function checkExistingUser(supabase: any, email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    })
    
    if (error) {
      console.error("Error checking existing user:", error)
      // If there's an error, we'll assume the user doesn't exist
      return false
    }
    
    return data && data.users && data.users.length > 0
  } catch (err) {
    console.error("Exception checking existing user:", err)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
    // Create Supabase admin client (with service role key)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { email, password, confirmPassword } = await req.json()
    
    // Validation results object
    const validationResults = {
      valid: true,
      errors: [] as string[]
    }
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      validationResults.valid = false
      validationResults.errors.push(emailValidation.error!)
    }
    
    // Check if email already exists
    const userExists = await checkExistingUser(supabase, email)
    if (userExists) {
      validationResults.valid = false
      validationResults.errors.push("A user with this email already exists")
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      validationResults.valid = false
      validationResults.errors = [...validationResults.errors, ...passwordValidation.errors]
    }
    
    // Confirm passwords match
    if (password !== confirmPassword) {
      validationResults.valid = false
      validationResults.errors.push("Passwords do not match")
    }
    
    // Return validation results
    return new Response(
      JSON.stringify(validationResults),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: validationResults.valid ? 200 : 400
      }
    )
  } catch (error) {
    console.error("Error in validate-registration function:", error)
    
    return new Response(
      JSON.stringify({ 
        valid: false, 
        errors: ["An unexpected error occurred during validation"] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
