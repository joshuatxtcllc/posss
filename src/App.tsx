import React from 'react';
import { Route, Switch } from 'wouter';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { FramingPOS } from './components/FramingPOS';
import { SuccessPage } from './components/SuccessPage';
import { OrderHistory } from './components/OrderHistory';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Jay's Frames...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <FramingPOS /> : <LoginPage />}
      </Route>
      
      <Route path="/signup">
        {user ? <FramingPOS /> : <SignupPage />}
      </Route>
      
      <Route path="/pricing">
        <FramingPOS />
      </Route>
      
      <Route path="/success">
        {user ? <SuccessPage /> : <LoginPage />}
      </Route>
      
      <Route path="/orders">
        {user ? <OrderHistory /> : <LoginPage />}
      </Route>
      
      <Route path="/">
        <FramingPOS />
      </Route>
      
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
            <a href="/" className="text-blue-600 hover:text-blue-500">
              Return to POS System
            </a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;