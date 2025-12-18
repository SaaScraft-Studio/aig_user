// app/(section)/registration/payment/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import CheckoutSummary from "@/components/registrations/myRegistration/CheckoutSummary";
import { useEventStore } from "@/app/store/useEventStore";
import { useRegistrationStore } from "@/app/store/useRegistrationStore";
import { Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const registrationId = searchParams.get("registrationId");
  const eventId = searchParams.get("eventId");

  const { currentEvent } = useEventStore();
  const { basicDetails } = useRegistrationStore();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("Loading payment gateway...");

  // ✅ Load Razorpay script with proper loading state
  useEffect(() => {
    const loadRazorpayScript = () => {
      // Check if script is already loaded
      if (window.Razorpay) {
        setScriptLoaded(true);
        return;
      }

      setStage("Loading payment gateway...");

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        setScriptLoaded(true);
        setStage("Payment gateway ready");
      };

      script.onerror = () => {
        setError("Failed to load payment gateway. Please refresh the page.");
        toast.error("Payment gateway failed to load");
      };

      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    loadRazorpayScript();
  }, []);

  // ✅ Create Razorpay order when registrationId is available
  useEffect(() => {
    if (!registrationId) {
      setError("Registration ID is required");
      toast.error("Registration ID is required");
      router.push("/dashboard/events");
      return;
    }

    if (!scriptLoaded && !error) {
      // Wait for script to load first
      return;
    }

    const createRazorpayOrder = async () => {
      try {
        setLoading(true);
        setStage("Creating payment order...");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login again");
          toast.error("Please login again");
          router.push("/login");
          return;
        }

        // Get amount from registration store or use a default
        const amount = basicDetails?.registrationCategory?.amount || 0;

        if (amount <= 0) {
          setError("Invalid registration amount");
          toast.error("Invalid registration amount");
          return;
        }

        setStage("Connecting to payment server...");

        // Create Razorpay order using new backend endpoint
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/create-order/${eventId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              eventRegistrationId: registrationId,
              amount: amount,
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || "Failed to create payment order"
          );
        }

        setStage("Processing order details...");

        const data = await res.json();

        if (data.success) {
          setOrder({
            id: data.data.orderId,
            amount: data.data.amount,
            currency: data.data.currency,
            razorpayKeyId: data.data.razorpayKeyId,
            paymentId: data.data.paymentId,
          });
          setStage("Payment ready");
          toast.success("Payment initialized successfully");
        } else {
          throw new Error("Failed to create order");
        }
      } catch (error) {
        console.error("Payment order creation error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to initialize payment";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createRazorpayOrder();
  }, [registrationId, basicDetails, router, scriptLoaded, error, eventId]);

  // ✅ Razorpay payment handler with better loading states
  const handlePay = () => {
    if (!order) {
      toast.error("Payment order not initialized");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setPaymentLoading(true);
    setStage("Opening payment gateway...");

    const options = {
      key: order.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount * 100, // Convert to paise
      currency: order.currency || "INR",
      name: "AIG Hospitals - Event Registration",
      description: "Complete your event registration payment",
      order_id: order.id,
      handler: async (response: any) => {
        try {
          setStage("Verifying payment...");
          const token = localStorage.getItem("accessToken");

          const verifyRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: order.paymentId,
              }),
            }
          );

          setStage("Processing verification...");

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setStage("Payment successful! Redirecting...");
              toast.success("Payment successful!");

              // Small delay to show success
              await new Promise((resolve) => setTimeout(resolve, 800));

              // Redirect to success page
              router.push(
                `/registration/payment/success?registrationId=${registrationId}&paymentId=${response.razorpay_payment_id}`
              );
            } else {
              setStage("Payment verification failed");
              toast.error("Payment verification failed");

              // Redirect to failed page
              router.push(
                `/registration/payment/failed?registrationId=${registrationId}&paymentId=${response.razorpay_payment_id}`
              );
            }
          } else {
            const errorData = await verifyRes.json();
            setStage("Payment verification error");

            // Redirect to failed page with error message
            router.push(
              `/registration/payment/failed?registrationId=${registrationId}&message=${encodeURIComponent(
                errorData.message || "Payment verification failed"
              )}`
            );
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          setStage("Network error occurred");
          toast.error("Network error occurred");

          // Redirect to error page
          router.push(
            `/registration/payment/error?registrationId=${registrationId}&message=${encodeURIComponent(
              "Network error occurred"
            )}`
          );
        } finally {
          setPaymentLoading(false);
        }
      },
      prefill: {
        name: basicDetails?.fullName || "",
        email: basicDetails?.email || "",
        contact: basicDetails?.phone || "",
      },
      theme: {
        color: "#00509E",
      },
      modal: {
        ondismiss: function () {
          setPaymentLoading(false);
          toast.info("Payment cancelled");
        },
        escape: false, // Prevent closing with ESC key
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      // Reset loading after modal opens (it might take a moment)
      setTimeout(() => {
        if (paymentLoading) {
          setPaymentLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Error opening Razorpay:", error);
      setPaymentLoading(false);
      toast.error("Failed to open payment gateway");
    }
  };

  // Loading component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-blue-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {paymentLoading ? "Processing Payment" : "Initializing Payment"}
            </h3>
            <p className="text-gray-600">{stage}</p>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: loading ? "40%" : paymentLoading ? "80%" : "100%",
                }}
              ></div>
            </div>

            <p className="text-xs text-gray-400">
              {paymentLoading
                ? "Please complete the payment in the opened window. Do not close this page."
                : "Please wait while we set up the payment gateway..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md mx-4">
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Error
          </h2>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#00509E] text-white px-6 py-2 rounded-lg hover:bg-[#003B73] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard/events")}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      {/* Show loading overlay during payment processing */}
      {(loading || paymentLoading) && <LoadingOverlay />}

      <div className="min-h-screen py-8 px-4">
        {/* Payment Status Indicator (floating) */}
        {(loading || paymentLoading) && (
          <div className="fixed top-4 right-4 z-40 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 shadow-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-700 font-medium">{stage}</span>
          </div>
        )}

        {/* Error Display */}
        {error && !loading && <ErrorDisplay message={error} />}

        {/* Main Content */}
        {!error && !loading && (
          <div className="p-6 max-w-4xl mx-auto">
            {order ? (
              <CheckoutSummary
                order={order}
                onPay={handlePay}
                event={currentEvent}
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">
                  Unable to initialize payment.
                </p>
                <button
                  onClick={() => router.push("/dashboard/events")}
                  className="bg-[#00509E] text-white px-6 py-2 rounded hover:bg-[#003B73] transition-colors"
                >
                  Back to Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Suspense>
  );
}
