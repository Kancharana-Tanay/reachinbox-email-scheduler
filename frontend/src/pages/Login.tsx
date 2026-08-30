import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export const Login = () => {
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F5F9]">Loading...</div>;
  if (user) return <Navigate to="/dashboard/scheduled" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F9] font-sans">
      <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm w-[400px] flex flex-col items-center">
        <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
          R
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-sm text-gray-500 mb-8 text-center">
          Sign in to access your email scheduler workspace.
        </p>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm hover:bg-gray-50 transition shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};
