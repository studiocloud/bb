import React, { useState } from 'react';
import { Mail, Loader } from 'lucide-react';
import { validateEmail } from '../../utils/emailValidation';
import toast from 'react-hot-toast';

export const SingleEmailValidator: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validateEmail(email);
      setValidationResult(result);
      toast.success('Email validation complete');
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-2xl font-bold text-white">Single Email Validation</h2>
        <p className="text-blue-100 mt-2">Validate individual email addresses instantly</p>
      </div>
      
      <div className="p-8">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isValidating}
          />
          <Mail className="absolute right-3 top-3.5 text-gray-400" size={20} />
        </div>

        <button
          onClick={handleValidation}
          disabled={isValidating || !email}
          className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center font-medium"
        >
          {isValidating ? (
            <>
              <Loader className="animate-spin mr-2" size={20} />
              Validating...
            </>
          ) : (
            'Validate Email'
          )}
        </button>

        {validationResult && (
          <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 rounded-t-lg">
              <h3 className="font-semibold text-gray-800">Validation Results</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                {Object.entries(validationResult).map(([key, value]: [string, any]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {value.toString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};