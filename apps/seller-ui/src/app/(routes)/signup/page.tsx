"use client";

import Link from "next/link";
// import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { countries } from "@/utils/countries";
import CreateShop from "@/shared/module/auth/create-shop";

type FormData = {
  name: string;
  email: string;
  paypalEmail: string;
  phoneNumber: number;
  country: string;
  password: string;
};
export default function SignupPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [sellerData, setSellerData] = useState<FormData | null>(null);
  const [sellerId, setSellerId] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>(); // he removed FormData

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-seller`, data);

      return response.data;
    },
    onSuccess: (_, formData) => {
      setSellerData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!sellerData) return;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/verify-seller`, {
        ...sellerData,
        otp: otp.join(""),
      });

      return response.data;
    },
    onSuccess: (data) => {
      setSellerId(data?.seller?.id);
      setActiveStep(2);
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
    if (sellerData) {
      signupMutation.mutate(sellerData);
    }
  }

  async function connectStripe() {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-stripe-link`, { sellerId });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Stripe connection error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">
      {/* Stepper */}
      <div className="relative flex items-center justify-between md:w-[50%] mb-8">
        <div className="absolute top-[25%] left-0 w-[80%] md:w-[90%] h-1 bg-gray-300 -z-10" />
        {[1, 2, 3].map((step) => (
          <div key={step}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold ${
                step <= activeStep ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {step}
            </div>
            <span className="ml-[-15px]">{step === 1 ? "Create Account" : step === 2 ? "Setup Shop" : "Connect Bank"}</span>
          </div>
        ))}
      </div>

      {/* Steps content */}
      <div className="md:w-[480px] -p8 bg-white shadow rounded-lg p-8">
        {activeStep === 1 && (
          <>
            {!showOtp ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <h3 className="text-2xl font-semibold text-center mb-4">Create Account</h3>
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

                <label htmlFor="paypalEmail" className="block text-gray-700 mb-1 mt-2">
                  PayPal Email
                </label>
                <input
                  id="paypalEmail"
                  type="email"
                  placeholder="paypal@yourbusiness.com"
                  className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                  {...register("paypalEmail", {
                    required: "Paypal Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.paypalEmail && <p className="text-red-500 text-sm">{String(errors.paypalEmail.message)}</p>}

                <label htmlFor="phoneNumber" className="block text-gray-700 mb-1 mt-2">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+5912333***"
                  className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^\+?[1-9]\d{1,14}$/, // E.164  format
                      message: "Invalid phone number",
                    },
                    minLength: {
                      value: 10,
                      message: "Phone number must be at least 10 digits.",
                    },
                    maxLength: {
                      value: 15,
                      message: "Phone number must not exceed 15 digits.",
                    },
                  })}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm">{String(errors.phoneNumber.message)}</p>}

                <label htmlFor="country" className="block text-gray-700 mb-1 mt-2">
                  Country
                </label>
                <select
                  className="w-full p-2 border border-gray-300 outline-none rounded-[4px]"
                  {...register("country", {
                    required: "Country is required",
                  })}
                >
                  <option value={""}>Select your country</option>
                  {countries.map((country: any) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-sm">{String(errors.country.message)}</p>}

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
                {signupMutation.isError && signupMutation.error instanceof AxiosError && (
                  <p className="text-red-500 text-sm mt-2">{signupMutation.error.response?.data.message || signupMutation.error.message}</p>
                )}

                <p className="pt-3 text-center">
                  Already have an account?{" "}
                  <Link href={"/login"} className="text-blue-500">
                    Login
                  </Link>
                </p>
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
          </>
        )}
        {activeStep === 2 && <CreateShop sellerId={sellerId} setActiveStep={setActiveStep} />}
        {activeStep === 3 && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold">Withdrawal method</h3>
            <br />
            <button
              className="w-full m-autoflex items-center justify-center gap-3 text-lg bg-[#334155] text-white py-2 rounded-lg"
              onClick={connectStripe}
              disabled={loading}
            >
              Connect Stripe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
