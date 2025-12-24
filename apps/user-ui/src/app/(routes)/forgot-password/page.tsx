"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

type FormData = {
  email: string;
  password: string;
};
export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [canResend, setCanResend] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

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

  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/forgot-password`, { email });
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      setCanResend(false);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid OTP. Try again";
      setServerError(errorMessage);
    },
  });

  const verifyOtpForgotPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-forgot-password`, {
        email: userEmail,
        otp: otp.join(""),
      });

      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid OTP. Try again";
      setServerError(errorMessage);
    },
  });

  const resetPassswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/reset-password`, { email: userEmail, newPassword: password });
      return response.data;
    },
    onSuccess: () => {
      setStep("email");
      toast.success("Password reset succesfully. Please login with your new password.");
      setServerError(null);
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid OTP. Try again";
      setServerError(errorMessage);
    },
  });

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

  function onSubmitEmail({ email }: { email: string }) {
    forgotPasswordMutation.mutate({ email });
  }

  function onSubmitPassword({ password }: { password: string }) {
    resetPassswordMutation.mutate({ password });
  }

  function resendOtp() {
    if (userEmail) {
      forgotPasswordMutation.mutate({ email: userEmail });
    }
  }

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">Forgot Password</h1>
      <p className=" text-center text-lg font-medium py-3 text-[#00000099]">Home . Forgot-password</p>

      <div className="w-full flex items-center justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          {step === "email" && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">Login to Ccius</h3>
              <p className="text-center text-gray-500 mb-4">
                Go back to? &nbsp;
                <Link href="/login" className="text-blue-500">
                  Login
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label htmlFor="email" className="block text-gray-700 mb-1">
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

                <button
                  disabled={forgotPasswordMutation.isPending}
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg mt-4"
                >
                  {forgotPasswordMutation.isPending ? "Sending OTP..." : "Submit"}
                </button>
                {serverError && <p className="text-red-500 text-sm mt-1">{serverError}</p>}
              </form>
            </>
          )}
          {step === "otp" && (
            <>
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
                onClick={() => verifyOtpForgotPasswordMutation.mutate()}
                disabled={verifyOtpForgotPasswordMutation.isPending}
              >
                {verifyOtpForgotPasswordMutation.isPending ? "Verifying OTP..." : "Verify OTP"}
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
              {serverError && <p className="text-red-500 text-sm mt-2">{serverError}</p>}
            </>
          )}
          {step === "reset" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">Reset Password</h3>
              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label htmlFor="password" className="block text-gray-700 mb-1 mt-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                {errors.password && <p className="text-red-500 text-sm">{String(errors.password.message)}</p>}

                <button
                  disabled={resetPassswordMutation.isPending}
                  type="submit"
                  className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg"
                >
                  {resetPassswordMutation.isPending ? "Resetting..." : "Reset"}
                </button>
                {serverError && <p className="text-red-500 text-sm mt-2">{serverError}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
