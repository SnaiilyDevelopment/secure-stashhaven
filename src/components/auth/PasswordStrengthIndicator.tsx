
import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  passwordStrength: number;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  passwordStrength 
}) => {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-green-700">Password strength</span>
        <span className="text-xs font-medium text-green-800">
          {password ? 
            passwordStrength <= 2 ? "Weak" : 
            passwordStrength <= 4 ? "Good" : 
            "Strong" 
            : ""}
        </span>
      </div>
      <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            passwordStrength <= 2 ? "bg-red-500" : 
            passwordStrength <= 4 ? "bg-amber-500" : 
            "bg-green-500"
          }`}
          style={{ width: `${(passwordStrength / 5) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
