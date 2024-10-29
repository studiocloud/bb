import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthForm } from './components/auth/AuthForm';
import { SingleEmailValidator } from './components/validation/SingleEmailValidator';
import { BulkEmailValidator } from './components/validation/BulkEmailValidator';
import { useAuth } from './hooks/useAuth';
import { Mail, Upload, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

function App() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <Toaster position="top-right" />
        {!session ? (
          <AuthForm />
        ) : (
          <>
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16">
                  {/* Logo on the left */}
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">Email Validator Pro</h1>
                  </div>

                  {/* Centered navigation */}
                  <div className="flex-grow flex items-center justify-center space-x-8">
                    <Link
                      to="/"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="mr-2" size={20} />
                      Single Validation
                    </Link>
                    <Link
                      to="/bulk"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="mr-2" size={20} />
                      Bulk Validation
                    </Link>
                  </div>

                  {/* Sign out button on the right */}
                  <div className="flex-shrink-0 flex items-center">
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <LogOut className="mr-2" size={18} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            <main className="flex-grow flex items-center justify-center p-6">
              <div className="w-full max-w-3xl mx-auto">
                <Routes>
                  <Route path="/" element={<SingleEmailValidator />} />
                  <Route path="/bulk" element={<BulkEmailValidator />} />
                </Routes>
              </div>
            </main>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;