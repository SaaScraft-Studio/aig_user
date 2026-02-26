"use client";

export default function ContactUs() {
  return (
    <section
      id="contact"
      className="bg-gray-50 text-gray-800 px-4 md:px-12 py-16 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto space-y-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
          Contact Us
        </h2>

        {/* Main Hospital Address */}
        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold">AIG Hospitals – Gachibowli</h3>
          <p className="leading-relaxed">
            1-66/AIG/2 to 5, Mindspace Road, Gachibowli, Hyderabad, Telangana
            500032
          </p>

          <div className="space-y-2">
            <p>
              <span className="font-medium">Ambulance Services:</span>{" "}
              <a
                href="tel:+914042444244"
                className="text-blue-600 hover:underline"
              >
                +91 40 4244 4244
              </a>
            </p>

            <p>
              <span className="font-medium">Appointments:</span>{" "}
              <a
                href="tel:+914042444222"
                className="text-blue-600 hover:underline"
              >
                +91 40 4244 4222
              </a>
            </p>
          </div>
        </div>

        {/* Corporate Office */}
        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            Asian Institute of Gastroenterology Private Limited
          </h3>
          <p className="leading-relaxed">
            6/3/661, Somajiguda, Hyderabad, Telangana 500082
          </p>
        </div>
      </div>
    </section>
  );
}
