import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "@/components/ui/loader";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignupForm = () => {
  const { signUp, isLoading, error } = useAuthStore();
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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhập thông tin để tạo tài khoản
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Họ tên
            </label>
            <input
              {...register("fullName")}
              type="text"
              id="fullName"
              placeholder="Nhập họ tên"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Tên đăng nhập
            </label>
            <input
              {...register("username")}
              type="text"
              id="username"
              placeholder="Nhập tên đăng nhập"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              placeholder="Nhập email"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>
            <input
              {...register("password")}
              type="password"
              id="password"
              placeholder="Nhập mật khẩu"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader className="h-4 w-4 text-white" />}
            {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/signin" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
