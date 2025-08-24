import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Calendar, MapPin, Clock, Users, DollarSign, Image as ImageIcon,
  Plus, X, Globe, Building, ArrowLeft, Save 
} from 'lucide-react';
import { eventAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface EventForm {
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  endDate?: string;
  time: string;
  venue: string;
  isVirtual: boolean;
  zoomLink?: string;
  capacity: number;
  ticketPrice: number;
  isPaid: boolean;
  registrationDeadline?: string;
  tags: string;
  status: 'draft' | 'published';
}

interface AgendaItem {
  time: string;
  title: string;
  description: string;
  speaker: string;
}

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [poster, setPoster] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EventForm>({
    defaultValues: {
      isVirtual: false,
      isPaid: false,
      capacity: 50,
      ticketPrice: 0,
      status: 'draft'
    }
  });

  const watchedFields = watch(['isVirtual', 'isPaid']);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAgendaItem = () => {
    setAgenda([...agenda, { time: '', title: '', description: '', speaker: '' }]);
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: string) => {
    const updatedAgenda = [...agenda];
    updatedAgenda[index] = { ...updatedAgenda[index], [field]: value };
    setAgenda(updatedAgenda);
  };

  const removeAgendaItem = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        const value = data[key as keyof EventForm];
        if (value !== undefined && value !== '') {
          if (key === 'tags') {
            formData.append(key, JSON.stringify(value.split(',').map(tag => tag.trim()).filter(Boolean)));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add agenda
      if (agenda.length > 0) {
        formData.append('agenda', JSON.stringify(agenda));
      }

      // Add poster
      if (poster) {
        formData.append('poster', poster);
      }

      const response = await eventAPI.createEvent(formData);
      toast.success('Event created successfully!');
      navigate(`/admin/events/${response.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Events</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-gray-600 mt-2">Set up your event details and configuration</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Event title is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  {...register('shortDescription')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description for event cards (optional)"
                  maxLength={200}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed event description"
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Poster */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Poster</h2>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Event poster preview"
                    className="max-h-64 rounded-lg shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPoster(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-center">
                    <label htmlFor="poster" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Upload event poster
                      </span>
                      <input
                        id="poster"
                        type="file"
                        accept="image/*"
                        onChange={handlePosterChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-gray-500 text-sm mt-2">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Start date is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  {...register('time', { required: 'Start time is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.time && (
                  <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  {...register('registrationDeadline')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isVirtual')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Virtual Event</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {watchedFields[0] ? 'Meeting Platform/Link' : 'Venue'} *
                </label>
                <input
                  type="text"
                  {...register('venue', { required: 'Venue/platform is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={watchedFields[0] ? "e.g., Zoom, Google Meet, or custom link" : "Event venue address"}
                />
                {errors.venue && (
                  <p className="text-red-600 text-sm mt-1">{errors.venue.message}</p>
                )}
              </div>

              {watchedFields[0] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direct Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    {...register('zoomLink')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/123456789"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    If provided, will be automatically shared with attendees
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Capacity & Pricing */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Capacity & Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('capacity', { 
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Maximum attendees"
                />
                {errors.capacity && (
                  <p className="text-red-600 text-sm mt-1">{errors.capacity.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isPaid')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Paid Event</span>
                  </label>
                </div>

                {watchedFields[1] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('ticketPrice', { 
                        min: { value: 0, message: 'Price cannot be negative' }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                    {errors.ticketPrice && (
                      <p className="text-red-600 text-sm mt-1">{errors.ticketPrice.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Agenda */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Event Agenda</h2>
              <button
                type="button"
                onClick={addAgendaItem}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {agenda.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No agenda items added yet</p>
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first agenda item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agenda.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Agenda Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Time"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Session title"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <textarea
                          value={item.description}
                          onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Description (optional)"
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={item.speaker}
                          onChange={(e) => updateAgendaItem(index, 'speaker', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Speaker (optional)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags & Categories</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                {...register('tags')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., technology, networking, workshop"
              />
              <p className="text-gray-500 text-sm mt-1">
                Add relevant tags to help attendees find your event
              </p>
            </div>
          </div>

          {/* Publish Options */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Publication</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft - Not visible to public</option>
                  <option value="published">Published - Live and accepting registrations</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Publishing Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Draft events are only visible to you and can be edited freely</li>
                  <li>• Published events are live and accepting registrations</li>
                  <li>• You can update published events, but major changes may affect registrants</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
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
              <Save className="h-4 w-4" />
              <span>Create Event</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;