// components/registrations/myRegistration/CheckoutSummary.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Event } from "@/app/store/useEventStore";
import { formatEventDate } from "@/app/utils/formatEventDate";
import { Loader2, Shield, CreditCard } from "lucide-react";

interface CheckoutSummaryProps {
  order: any;
  event?: Event | null;
  onPay: () => void;
  processing?: boolean;
}

export default function CheckoutSummary({
  event,
  order,
  onPay,
  processing = false,
}: CheckoutSummaryProps) {
  const total = order?.amount || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT SECTION ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-[#00509E]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Payment Checkout
            </h2>
          </div>

          {/* ORDER DETAILS CARD */}
          <div className="border border-gray-200 rounded-2xl bg-white p-5 md:p-6 shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 border-b pb-3">
              ORDER DETAILS
            </h3>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              {/* Event Info */}
              <div className="flex items-start gap-4">
                <img
                  src={event?.eventImage || "/eventImg/event1.png"}
                  alt={event?.eventName || "Event"}
                  width={90}
                  height={90}
                  className="rounded-xl object-cover border shadow-sm flex-shrink-0"
                />

                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 break-words">
                    {event?.eventName || "Event Name"}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    {formatEventDate(event?.startDate, event?.endDate)}
                  </p>

                  {order?.registrationCategory && (
                    <p className="text-sm text-blue-600 font-medium mt-2">
                      {order.registrationCategory}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              {/* <div className="text-left md:text-right">
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  ₹ {total.toLocaleString("en-IN")}.00
                </p>
              </div> */}
            </div>
          </div>

          {/* SECURITY INFO */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  256-bit SSL Secured Payment
                </p>
                <p className="text-xs text-blue-600">
                  Your payment is protected with Razorpay security
                </p>
              </div>
            </div>

            {processing && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                  <p className="text-sm text-yellow-700">
                    Opening payment gateway...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        <div className="border border-gray-200 rounded-2xl bg-white p-6 shadow-sm h-fit lg:sticky lg:top-24">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 border-b pb-3">
            Payment Summary
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Registration Fee</span>
              <span className="text-gray-800 font-medium">
                ₹ {total.toLocaleString("en-IN")}.00
              </span>
            </div>

            <hr className="border-gray-200" />

            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-green-600">
                ₹ {total.toLocaleString("en-IN")}.00
              </span>
            </div>
          </div>

          {/* PAY BUTTON */}
          <Button
            onClick={onPay}
            disabled={processing}
            className="w-full mt-6 bg-[#00509E] hover:bg-[#003B73] text-white font-semibold rounded-xl py-3 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹ {total.toLocaleString("en-IN")}.00
              </>
            )}
          </Button>

          {/* TRUST BADGES */}
          {/* <div className="mt-6 space-y-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-500" />
              <span>PCI DSS compliant payment processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>No credit card details stored on our servers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Instant payment confirmation</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
