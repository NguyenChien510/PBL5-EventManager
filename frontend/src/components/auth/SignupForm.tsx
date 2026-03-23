import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignupForm = () => {
  const { signUp, googleSignIn, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signUp(data);
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
        console.error("Google sign up failed:", err);
      }
    }
  };

  const onGoogleError = () => {
    console.error('Google Sign Up Failed');
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
            <span className="hidden md:inline-block text-sm font-medium text-slate-500 dark:text-slate-400">Already have an account?</span>
            <Link to="/signin" className="flex items-center justify-center rounded-lg h-10 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              Log in
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center relative p-4 md:p-8 overflow-y-auto w-full max-h-screen">
          {/* Background Decorative Elements */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-electric/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          {/* Main Box Container */}
          <div className="max-w-[480px] w-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl z-10 m-auto mt-4">

            {/* Right Side: Signup Form */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Create Account</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">Start organizing amazing events today.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-500/10 p-4 border border-red-200 dark:border-red-500/20 text-sm font-medium text-red-600 dark:text-red-400 flex items-start gap-3">
                  <span className="material-symbols-outlined shrink-0 text-red-500">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                {/* Full Name & Username Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Full Name</label>
                    <input 
                      {...register("fullName")}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.fullName ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="John Doe" 
                      type="text" 
                    />
                    {errors.fullName && <p className="text-xs font-medium text-red-500">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Username</label>
                    <input 
                      {...register("username")}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.username ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="johndoe" 
                      type="text" 
                    />
                    {errors.username && <p className="text-xs font-medium text-red-500">{errors.username.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">mail</span>
                    <input 
                      {...register("email")}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.email ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="john@example.com" 
                      type="email" 
                    />
                  </div>
                  {errors.email && <p className="text-xs font-medium text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">lock</span>
                    <input 
                      {...register("password")}
                      className={`w-full pl-11 pr-12 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-sm ${errors.password ? 'border-red-300 dark:border-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary'}`}
                      placeholder="••••••••" 
                      type="password" 
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" type="button" aria-label="Toggle password visibility">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium text-red-500">{errors.password.message}</p>}
                </div>

                {/* User Type Toggle */}
                <div className="space-y-2 py-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">I am an...</span>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <input defaultChecked className="peer sr-only" name="user-type" type="radio" value="attendee" />
                      <div className="text-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-500 dark:text-slate-400 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                        Attendee
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input className="peer sr-only" name="user-type" type="radio" value="organizer" />
                      <div className="text-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-500 dark:text-slate-400 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                        Organizer
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-electric text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all focus:ring-4 focus:ring-primary/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-2" 
                  type="submit"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 text-white" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 font-medium text-xs uppercase tracking-widest">Or sign up with</span>
                </div>
              </div>

              <div className="w-full flex justify-center mt-1">
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={onGoogleError}
                  theme="outline"
                  size="large"
                  text="signup_with"
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
