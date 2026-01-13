"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { GoogleSignInButton } from "../../../shared/components/google-button";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

type FormData = {
  name: string;
  email: string;
  password: string;
};
export default function SignupPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-user`, data);

      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-user`, {
        ...userData,
        otp: otp.join(""),
      });

      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  function startResendTimer() {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }

  function onSubmit(data: FormData) {
    signupMutation.mutate(data);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function resendOtp() {
    if (userData) {
      signupMutation.mutate(userData);
    }
  }

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">Sign Up</h1>
      <p className=" text-center text-lg font-medium py-3 text-[#00000099]">Home . Signup</p>

      <div className="w-full flex items-center justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">Signup to Ccius</h3>
          <p className="text-center text-gray-500 mb-4">
            Already have an account? &nbsp;
            <Link href="/login" className="text-blue-500">
              Login
            </Link>
          </p>
          <div className="flex justify-center">
            <GoogleSignInButton />
          </div>
          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign in with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <label htmlFor="name" className="block text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="name"
                placeholder="John Doe"
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                {...register("name", {
                  required: "Name is required",
                })}
              />
              {errors.name && <p className="text-red-500 text-sm">{String(errors.name.message)}</p>}

              <label htmlFor="email" className="block text-gray-700 mb-1 mt-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="support@ccius.com"
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && <p className="text-red-500 text-sm">{String(errors.email.message)}</p>}

              <label htmlFor="password" className="block text-gray-700 mb-1 mt-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />

                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {passwordVisible ? <Eye /> : <EyeOff />}
                </button>
                {errors.password && <p className="text-red-500 text-sm">{String(errors.password.message)}</p>}
              </div>

              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg mt-3"
              >
                {signupMutation.isPending ? "Signing up..." : "Sign up"}
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-center mb-4">Enter OTP</h3>
              <div className="flex justify-center gap-6">
                {otp?.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    className="w-12 h-12 text-center border border-gray-300 outline-none rounded-[4px] font-extrabold"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
              <button
                className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                onClick={() => verifyOtpMutation.mutate()}
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? "Verifying OTP..." : "Verify OTP"}
              </button>
              <p className="text-center text-sm mt-4">
                {canResend ? (
                  <button className="text-blue-500 cursor-pointer" onClick={resendOtp}>
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}s`
                )}
              </p>
              {verifyOtpMutation.isError && verifyOtpMutation.error instanceof AxiosError && (
                <p className="text-red-500 text-sm mt-2">{verifyOtpMutation.error.response?.data?.message || verifyOtpMutation.error.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
