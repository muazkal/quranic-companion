import { Routes, Route } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Review } from '@/pages/Review';
import { LibraryPage } from '@/pages/LibraryPage';
import { AddPage } from '@/pages/AddPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review" element={<Review />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/add" element={<AddPage />} />
      </Routes>
    </Layout>
  );
};

export default Index;
