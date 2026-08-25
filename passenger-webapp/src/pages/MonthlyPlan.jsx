import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";

export default function MonthlyPlan() {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [locationError, setLocationError] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const locationWatchIdRef = useRef(null);
  const isLocationFetchingRef = useRef(false);

  // Reverse geocoding - Convert coordinates to address
  const getAddressFromCoordinates = async (lat, lng) => {
    setIsAddressLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.data && response.data.display_name) {
        const addressData = response.data.address;
        let formattedAddress = "";
        
        if (addressData.building) {
          formattedAddress += addressData.building + ", ";
        }
        if (addressData.road || addressData.street) {
          formattedAddress += (addressData.road || addressData.street) + ", ";
        }
        if (addressData.suburb || addressData.neighbourhood) {
          formattedAddress += (addressData.suburb || addressData.neighbourhood) + ", ";
        }
        if (addressData.city || addressData.town || addressData.village) {
          formattedAddress += (addressData.city || addressData.town || addressData.village) + ", ";
        }
        if (addressData.state) {
          formattedAddress += addressData.state + ", ";
        }
        if (addressData.country) {
          formattedAddress += addressData.country;
        }
        
        formattedAddress = formattedAddress.replace(/,\s*$/, "");
        
        if (formattedAddress.length < 10) {
          formattedAddress = response.data.display_name;
        }
        
        setAddress(formattedAddress);
        return formattedAddress;
      } else {
        setAddress("Address not available");
        return "Address not available";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Unable to fetch address");
      return "Unable to fetch address";
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Get user's current location with address
  const getUserLocation = () => {
    // Prevent multiple simultaneous location requests
    if (isLocationFetchingRef.current) {
      console.log("Location fetch already in progress, skipping...");
      return;
    }

    setIsLocationLoading(true);
    setLocationError(null);
    setAddress("");
    setShowErrorModal(false);
    isLocationFetchingRef.current = true;

    // Clear any existing watch
    if (locationWatchIdRef.current) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser";
      setLocationError(errorMsg);
      setIsLocationLoading(false);
      setShowErrorModal(true);
      isLocationFetchingRef.current = false;
      return;
    }

    // Try to get position with multiple attempts
    let attempts = 0;
    const maxAttempts = 3;

    const getPosition = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = {
            lat: latitude,
            lng: longitude,
            timestamp: position.timestamp,
          };
          
          // Success - clear all errors
          setLocation(locationData);
          setLocationError(null);
          setShowErrorModal(false);
          setIsLocationLoading(false);
          isLocationFetchingRef.current = false;
          
          console.log("Location captured:", latitude, longitude);
          
          // Fetch address from coordinates
          await getAddressFromCoordinates(latitude, longitude);
        },
        (error) => {
          let errorMessage = "Unable to get your location. Please enable location services.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again or enable GPS.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An error occurred while getting your location. Please try again.";
          }
          
          // Retry if attempts are less than maxAttempts
          if (attempts < maxAttempts) {
            attempts++;
            console.log(`Retrying location... Attempt ${attempts}`);
            setTimeout(getPosition, 2000);
          } else {
            setLocationError(errorMessage);
            setIsLocationLoading(false);
            setShowErrorModal(true);
            isLocationFetchingRef.current = false;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    };

    getPosition();
  };

  // Request location on component mount
  useEffect(() => {
    getUserLocation();
    
    // Cleanup on unmount
    return () => {
      if (locationWatchIdRef.current) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  const validateMobile = () => {
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobile) {
      alert("Please enter mobile number");
      return false;
    }

    if (!mobileRegex.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      return false;
    }

    return true;
  };

  const handlePurchase = async () => {
    if (!validateMobile()) {
      return;
    }

    // Check if location is available
    if (!location) {
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${config.API_URL}/monthly-pass/order`,
        {
          bus_id: busId,
          name,
          mobile,
          location: {
            lat: location.lat,
            lng: location.lng,
            timestamp: location.timestamp,
            address: address,
          },
        }
      );

      const data = response.data;

      const options = {
        key: data.key,
        amount: 1000 * 100,
        currency: "INR",
        name: "Monthly Bus Pass",
        description: "62 Rides (60 + 2 Free)",
        order_id: data.razorpay_order_id,

        handler: async function (response) {
          const successResponse = await axios.post(
            `${config.API_URL}/monthly-pass/success`,
            {
              payment_id: data.payment_id,
              bus_id: busId,
              name,
              mobile,
              razorpay_payment_id: response.razorpay_payment_id,
              location: {
                lat: location.lat,
                lng: location.lng,
                timestamp: location.timestamp,
                address: address,
              },
            }
          );

          const result = successResponse.data;

          navigate(`/monthly-pass-result`, {
            state: {
              status: "SUCCESS",
              pin: result.pin,
              rides: result.rides,
              mobile: mobile,
              name: name,
              address: address,
            },
          });
        },

        modal: {
          ondismiss: function () {
            navigate("/monthly-pass-result", {
              state: {
                status: "CANCELLED",
              },
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {
        navigate("/monthly-pass-result", {
          state: {
            status: "FAILED",
          },
        });
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Unable to create monthly pass");
    } finally {
      setLoading(false);
    }
  };

  // Reload the page
  const refreshLocation = () => {
    window.location.reload();
  };


  // Handle retry
  const handleRetry = () => {
    setShowErrorModal(false);
    setLocationError(null);
    getUserLocation();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-green-600 text-white shadow-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-green-100">
            Monthly Travel Pass
          </p>
          <h1 className="text-xl font-semibold">
            Purchase Monthly Pass
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">
        <section className="rounded-3xl bg-white p-5 shadow-sm border">
          <div className="mb-5 rounded-2xl bg-green-50 p-4 border border-green-200">
            <h3 className="font-semibold text-green-700">
              ₹1000 Monthly Plan
            </h3>
            <p className="mt-2 text-sm text-green-600">
              60 Rides + 2 Free Rides
            </p>
            <p className="text-sm text-green-600">
              Total 62 Rides
            </p>
          </div>

          {/* Location Section with Address */}
          <div className={`mb-5 rounded-xl border p-4 ${
            locationError ? 'border-red-200 bg-red-50' : 
            address ? 'border-green-200 bg-green-50' : 
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-medium ${
                  locationError ? 'text-red-700' : 
                  address ? 'text-green-700' : 
                  'text-blue-700'
                }`}>
                  📍 Current Location
                </h4>
                
                {isLocationLoading ? (
                  <p className="text-sm text-blue-600">
                    Getting location...
                    <span className="inline-block ml-1">
                      <svg className="animate-spin h-4 w-4 text-blue-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </p>
                ) : address && location ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-gray-800">
                      {isAddressLoading ? "Loading address..." : address}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                    </p>
                  </div>
                ) : locationError ? (
                  <div>
                    <p className="text-sm text-red-600">{locationError}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 underline"
                    >
                      Click here to retry
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">Waiting for location...</p>
                )}
              </div>
              <button
                onClick={refreshLocation}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 whitespace-nowrap ml-2"
              >
                🔄 Refresh
              </button>
            </div>
            
            {address && location && !locationError && (
              <div className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                <span className="flex items-center">
                  <span className="mr-1">⏱️</span>
                  Last updated: {new Date(location.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-2 block font-medium">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block font-medium">
              Mobile Number
            </label>
            <input
              type="text"
              maxLength={10}
              className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setMobile(value);
              }}
            />
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading || isLocationLoading || isAddressLoading || !location}
            className="w-full rounded-3xl bg-green-600 px-6 py-3.5 font-semibold text-white disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {loading
              ? "Processing..."
              : isLocationLoading || isAddressLoading
              ? "Getting Location..."
              : !location
              ? "Waiting for Location..."
              : "Purchase Pass ₹1000"}
          </button>

          {!location && !isLocationLoading && !locationError && (
            <p className="mt-3 text-center text-sm text-blue-600">
              ⏳ Waiting for location to be captured...
            </p>
          )}

          {address && location && !locationError && (
            <p className="mt-3 text-center text-xs text-green-600">
              ✓ Location verified: {address}
            </p>
          )}
        </section>
      </main>

      {/* Custom Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Error</h3>
              <p className="text-sm text-gray-600 mb-6">
                {locationError || "Unable to get your location. Please enable location services and try again."}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRetry}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}