import React, { useState, useRef } from 'react';
import { Upload, Download, Loader } from 'lucide-react';
import Papa from 'papaparse';
import { validateEmail } from '../../utils/emailValidation';
import { sendValidationResults } from '../../utils/emailService';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export const BulkEmailValidator: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalEmails, setTotalEmails] = useState(0);
  const [validEmails, setValidEmails] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setValidEmails(0);

    try {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const emailColumn = results.meta.fields?.find(
            field => field.toLowerCase().includes('email')
          );

          if (!emailColumn) {
            toast.error('No email column found in CSV');
            setIsProcessing(false);
            return;
          }

          const emails = results.data
            .map((row: any) => row[emailColumn])
            .filter(Boolean);

          if (emails.length > 50000) {
            toast.error('Maximum 50,000 emails allowed');
            setIsProcessing(false);
            return;
          }

          setTotalEmails(emails.length);
          const validatedData = [];
          let validCount = 0;

          for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const validationResult = await validateEmail(email);
            if (validationResult.formatValid && validationResult.mxRecords) {
              validCount++;
            }
            validatedData.push({
              ...results.data[i],
              validation_result: JSON.stringify(validationResult)
            });
            setProgress(Math.round(((i + 1) / emails.length) * 100));
            setValidEmails(validCount);
          }

          const csv = Papa.unparse(validatedData);
          const blob = new Blob([csv], { type: 'text/csv' });
          const buffer = await blob.arrayBuffer();

          // Send email with results
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const emailSent = await sendValidationResults(
              user.email,
              Buffer.from(buffer),
              emails.length,
              validCount
            );
            
            if (emailSent) {
              toast.success('Results have been sent to your email');
            } else {
              toast.error('Failed to send results email');
            }
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'validated_emails.csv';
          a.click();
          URL.revokeObjectURL(url);
          
          setIsProcessing(false);
        },
        error: (error) => {
          toast.error('Error processing file: ' + error.message);
          setIsProcessing(false);
        }
      });
    } catch (error) {
      toast.error('Failed to process file');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-2xl font-bold text-white">Bulk Email Validation</h2>
        <p className="text-blue-100 mt-2">Upload a CSV file to validate multiple email addresses</p>
      </div>
      
      <div className="p-8">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
            disabled={isProcessing}
          />
          
          {!isProcessing ? (
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Upload className="mr-2" size={20} />
                Upload CSV File
              </button>
              <p className="text-sm text-gray-600">or drag and drop your file here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Loader className="animate-spin mx-auto text-blue-600" size={32} />
              <div className="text-sm text-gray-600">
                Processing {progress}% ({Math.round((progress / 100) * totalEmails)} of {totalEmails} emails)
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {progress > 0 && (
                <div className="text-sm text-gray-600">
                  Valid emails found: {validEmails}
                </div>
              )}
              <p className="text-sm text-red-500 font-medium">
                Please do not close this browser tab
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Upload a CSV file with an email column
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Maximum 50,000 emails per file
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Results will be emailed to you automatically
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Download option available after processing
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};