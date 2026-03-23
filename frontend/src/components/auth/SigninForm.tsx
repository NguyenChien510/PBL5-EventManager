import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export const SigninForm = () => {
  const { signIn, googleSignIn, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await signIn(data);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        await googleSignIn(credentialResponse.credential);
        navigate("/");
      } catch (err) {
        console.error("Google sign in failed:", err);
      }
    }
  };

  const onGoogleError = () => {
    console.error('Google Sign In Failed');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/20">
      <div className="relative flex min-h-[100svh] w-full flex-col overflow-hidden">
        {/* Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 px-6 py-4 md:px-12 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-20">
          <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-80 transition-opacity group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-lg">confirmation_number</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Event<span className="text-primary">Platform</span></h2>
          </Link>
          <div className="flex gap-4 items-center">
            <span className="hidden md:inline-block text-sm font-medium text-slate-500 dark:text-slate-400">New to EventPlatform?</span>
            <Link to="/signup" className="flex items-center justify-center rounded-lg h-10 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              Create account
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center relative p-4 md:p-8 overflow-y-auto w-full max-h-screen">
          {/* Background Decorative Elements */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-electric/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          {/* Main Box Container */}
          <div className="max-w-[480px] w-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl z-10 m-auto mt-4">

            {/* Right Side: Login Form */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Welcome back</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">Enter your credentials to access your workspace.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-500/10 p-4 border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-3">
                  <span className="material-symbols-outlined shrink-0 text-red-500">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                    <input 
                      {...register("username")}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.username ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="Enter your username" 
                      type="text" 
                    />
                  </div>
                  {errors.username && <p className="text-sm font-medium text-red-500">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                    <input 
                      {...register("password")}
                      className={`w-full pl-11 pr-12 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.password ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="••••••••" 
                      type="password" 
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" type="button" aria-label="Toggle password visibility">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-sm font-medium text-red-500">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded cursor-pointer bg-white dark:bg-slate-900 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all" id="remember" type="checkbox" />
                      <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Keep me signed in</span>
                    
                  </label>
                  <a className="text-sm font-semibold text-primary hover:text-electric transition-colors" href="#">Forgot password?</a>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-electric text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all focus:ring-4 focus:ring-primary/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-2" 
                  type="submit"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 text-white" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="w-full flex justify-center mt-1">
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={onGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="pill"
                  width="350px"
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer Info */}
        <footer className="p-6 text-center text-xs text-slate-400 z-10 w-full mt-auto">
          <p>© 2024 MeetCraft Event Systems. All rights reserved. <a className="hover:text-primary underline px-2 transition-colors" href="#">Privacy Policy</a> <a className="hover:text-primary underline px-2 transition-colors" href="#">Terms of Service</a></p>
        </footer>
      </div>
    </div>
  );
};
