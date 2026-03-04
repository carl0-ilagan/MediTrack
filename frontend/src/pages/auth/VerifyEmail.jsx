import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

export const VerifyEmail = () => {
  const { user, isAdmin, isClinician, isPatient } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification email to {user?.email || 'your email address'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-700">
              Please check your inbox and click the verification link to activate your account.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>Didn't receive the email?</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Check your spam or junk folder</li>
              <li>Make sure the email address is correct</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Resend Email
            </Button>
            <Link to={isAdmin ? '/admin/dashboard' : isClinician ? '/clinician/dashboard' : isPatient ? '/patient/dashboard' : '/'} className="flex-1">
              <Button className="w-full">Continue to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;