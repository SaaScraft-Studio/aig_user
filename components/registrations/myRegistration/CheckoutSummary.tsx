// components/registrations/myRegistration/CheckoutSummary.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Event } from "@/app/store/useEventStore";
import { formatEventDate } from "@/app/utils/formatEventDate";
import { Loader2, Shield, CreditCard } from "lucide-react";

interface CheckoutSummaryProps {
  order: any;
  event?: Event | null;
  onPay: () => void;
  processing?: boolean; // Add this prop
}

export default function CheckoutSummary({
  event,
  order,
  onPay,
  processing = false, // Default to false
}: CheckoutSummaryProps) {
  const total = order?.amount || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {/* Left: Order Details */}
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-6 h-6 text-[#00509E]" />
          <h2 className="text-2xl font-bold text-gray-900">Payment Checkout</h2>
        </div>

        <div className="border border-gray-200 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            ORDER DETAILS
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={event?.eventImage || "/eventImg/event1.png"}
                alt={event?.eventName || "Event"}
                width={80}
                height={80}
                className="rounded-lg object-cover border shadow-sm"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {event?.eventName || "Event Name"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formatEventDate(event?.startDate, event?.endDate)}
                </p>
                {order?.registrationCategory && (
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {order.registrationCategory}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              ₹ {total.toLocaleString("en-IN")}.00
            </p>
          </div>
        </div>

        {/* Payment Security Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                256-bit SSL Secured Payment
              </p>
              <p className="text-xs text-blue-600">
                Your payment is protected with Razorpay security
              </p>
            </div>
          </div>
          
          {/* Payment Status Indicator */}
          {processing && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
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

      {/* Right: Summary */}
      <div className="border border-gray-200 rounded-xl bg-white p-6 shadow-sm h-fit">
        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">
          Payment Summary
        </h3>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Registration Fee</span>
            <span className="text-gray-800 font-medium">
              ₹ {total.toLocaleString("en-IN")}.00
            </span>
          </div>

          <hr className="my-4 border-gray-300" />

          <div className="flex justify-between items-center font-semibold text-lg">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-green-600">
              ₹ {total.toLocaleString("en-IN")}.00
            </span>
          </div>
        </div>

        <Button
          onClick={onPay}
          disabled={processing}
          className="w-full mt-6 bg-[#00509E] hover:bg-[#003B73] text-white text-base font-semibold rounded-lg py-3 transition-all duration-300 cursor-pointer relative overflow-hidden"
          size="lg"
        >
          {processing ? (
            <>
              <div className="absolute inset-0 bg-blue-700 animate-pulse"></div>
              <span className="relative flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </span>
            </>
          ) : (
            <span className="flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ₹ {total.toLocaleString("en-IN")}.00
            </span>
          )}
        </Button>

        <div className="mt-6 space-y-3 text-xs text-gray-500">
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
        </div>
      </div>
    </div>
  );
}