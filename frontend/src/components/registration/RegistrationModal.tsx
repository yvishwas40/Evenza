import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Phone, Building, Heart, Shield, LogIn } from 'lucide-react';
import { attendeeAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import PaymentModal from '../payment/PaymentModal';
import toast from 'react-hot-toast';

interface RegistrationModalProps {
  event: {
    _id: string;
    title: string;
    isPaid: boolean;
    ticketPrice: number;
    isVirtual: boolean;
  };
  onClose: () => void;
  onSuccess?: () => void;
  existingRegistration?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    organization?: string;
    designation?: string;
    dietaryRequirements?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    attendanceType?: 'physical' | 'virtual';
  } | null;
  isUpdate?: boolean;
}

interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  organization?: string;
  designation?: string;
  dietaryRequirements?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  attendanceType: 'physical' | 'virtual';
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  event, 
  onClose, 
  onSuccess,
  existingRegistration = null, 
  isUpdate = false 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<RegistrationForm>({
    defaultValues: {
      attendanceType: event.isVirtual ? 'virtual' : 'physical'
    }
  });

  // Autofill form with user data if logged in, or existing registration if updating
  useEffect(() => {
    if (isUpdate && existingRegistration) {
      reset({
        name: existingRegistration.name || '',
        email: existingRegistration.email || '',
        phone: existingRegistration.phone || '',
        organization: existingRegistration.organization || '',
        designation: existingRegistration.designation || '',
        dietaryRequirements: existingRegistration.dietaryRequirements || '',
        emergencyContactName: existingRegistration.emergencyContactName || '',
        emergencyContactPhone: existingRegistration.emergencyContactPhone || '',
        attendanceType: existingRegistration.attendanceType || (event.isVirtual ? 'virtual' : 'physical')
      });
    } else if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.company || '',
        attendanceType: event.isVirtual ? 'virtual' : 'physical'
      });
    }
  }, [user, reset, event.isVirtual, isUpdate, existingRegistration]);

  // Check if user is logged in, if not show login prompt
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <LogIn className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to register for this event. Your profile information will be automatically filled in the registration form.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigate('/login', { 
                    state: { 
                      from: { pathname: window.location.pathname },
                      eventId: event._id 
                    } 
                  });
                }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login to Register
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: RegistrationForm) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          from: { pathname: window.location.pathname },
          eventId: event._id 
        } 
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        userId: user.id,
        emergencyContact: data.emergencyContactName && data.emergencyContactPhone ? {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone
        } : undefined
      };

      let response;
      if (isUpdate && existingRegistration) {
        // Update existing registration
        response = await attendeeAPI.updateAttendee(existingRegistration.id, payload);
        toast.success('Registration updated successfully!');
        onSuccess?.();
        onClose();
      } else {
        // Create new registration
        response = await attendeeAPI.register(event._id, payload);
        setRegistrationData(response.data);

        if (event.isPaid) {
          setShowPayment(true);
        } else {
          toast.success('Registration successful! Check your email for confirmation.');
          onSuccess?.();
          onClose();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `${isUpdate ? 'Update' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  if (showPayment && registrationData) {
    return (
      <PaymentModal
        attendee={registrationData.attendee}
        event={event}
        amount={event.ticketPrice}
        onClose={onClose}
        onSuccess={() => {
          toast.success('Registration and payment completed successfully!');
          onSuccess?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isUpdate ? 'Update Registration' : 'Register for Event'}
            </h2>
            <p className="text-gray-600">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Full name is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  {...register('organization')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your company/organization"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title/Designation
                </label>
                <input
                  type="text"
                  {...register('designation')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your job title or designation"
                />
              </div>
            </div>
          </div>

          {/* Attendance Type */}
          {event.isVirtual && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="virtual"
                    {...register('attendanceType')}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    watch('attendanceType') === 'virtual'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">Virtual</div>
                      <div className="text-sm text-gray-600">Join online</div>
                    </div>
                  </div>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    value="physical"
                    {...register('attendanceType')}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    watch('attendanceType') === 'physical'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">In-Person</div>
                      <div className="text-sm text-gray-600">Attend physically</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Requirements
                </label>
                <textarea
                  {...register('dietaryRequirements')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Any dietary restrictions or food allergies?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    {...register('emergencyContactName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Emergency contact person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    {...register('emergencyContactPhone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          {event.isPaid && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Registration Fee:</span>
                <span className="text-2xl font-bold text-gray-900">${event.ticketPrice}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                You'll be redirected to secure payment after completing registration
              </p>
            </div>
          )}

          {/* Terms */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Privacy & Terms</p>
                <p>
                  By registering, you agree to our terms of service and privacy policy. 
                  Your information will be used solely for event management purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>
                {isUpdate 
                  ? 'Update Registration' 
                  : (event.isPaid ? 'Continue to Payment' : 'Register Now')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;