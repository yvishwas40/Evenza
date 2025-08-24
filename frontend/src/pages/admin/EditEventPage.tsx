import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Calendar, MapPin, Clock, Users, DollarSign, Image as ImageIcon,
  Plus, X, Globe, ArrowLeft, Save 
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

interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
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
  tags?: string[];
  status: 'draft' | 'published';
  poster?: string;
  agenda?: AgendaItem[];
}

const EditEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [poster, setPoster] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<EventForm>({
    defaultValues: {
      isVirtual: false,
      isPaid: false,
      capacity: 50,
      ticketPrice: 0,
      status: 'draft'
    }
  });

  const watchedFields = watch(['isVirtual', 'isPaid']);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setPageLoading(true);
      const response = await eventAPI.getEvents();
      const currentEvent = response.data.find((e: Event) => e._id === eventId);
      
      if (!currentEvent) {
        toast.error('Event not found');
        navigate('/admin/events');
        return;
      }

      setEvent(currentEvent);
      
      // Set form values
      const formData: EventForm = {
        title: currentEvent.title,
        description: currentEvent.description,
        shortDescription: currentEvent.shortDescription || '',
        date: currentEvent.date ? new Date(currentEvent.date).toISOString().split('T')[0] : '',
        endDate: currentEvent.endDate ? new Date(currentEvent.endDate).toISOString().split('T')[0] : '',
        time: currentEvent.time,
        venue: currentEvent.venue,
        isVirtual: currentEvent.isVirtual,
        zoomLink: currentEvent.zoomLink || '',
        capacity: currentEvent.capacity,
        ticketPrice: currentEvent.ticketPrice,
        isPaid: currentEvent.isPaid,
        registrationDeadline: currentEvent.registrationDeadline ? new Date(currentEvent.registrationDeadline).toISOString().split('T')[0] : '',
        tags: currentEvent.tags ? currentEvent.tags.join(', ') : '',
        status: currentEvent.status
      };

      reset(formData);
      
      // Set agenda
      if (currentEvent.agenda) {
        setAgenda(currentEvent.agenda);
      }

      // Set poster preview
      if (currentEvent.poster) {
        const posterUrl = currentEvent.poster.startsWith('http') 
          ? currentEvent.poster 
          : `${import.meta.env.VITE_API_URL || 'https://evenza-sjtt.onrender.com'}${currentEvent.poster}`;
        setPreviewUrl(posterUrl);
      }

    } catch (error: any) {
      toast.error('Failed to load event data');
      navigate('/admin/events');
    } finally {
      setPageLoading(false);
    }
  };

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
    if (!id) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        const value = data[key as keyof EventForm];
        if (value !== undefined && value !== '') {
          if (key === 'tags') {
            const stringValue = value as string;
            formData.append(key, JSON.stringify(stringValue.split(',').map((tag: string) => tag.trim()).filter(Boolean)));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add agenda
      if (agenda.length > 0) {
        formData.append('agenda', JSON.stringify(agenda));
      }

      // Add poster only if a new one was selected
      if (poster) {
        formData.append('poster', poster);
      }

      await eventAPI.updateEvent(id, formData);
      toast.success('Event updated successfully!');
      navigate(`/admin/events/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <button
            onClick={() => navigate('/admin/events')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/admin/events/${id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Event</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
              <p className="text-gray-600 mt-2">Update your event details and configuration</p>
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
                    className="w-full max-w-md h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPoster(null);
                      setPreviewUrl(event.poster ? (event.poster.startsWith('http') 
                        ? event.poster 
                        : `${import.meta.env.VITE_API_URL || 'https://evenza-sjtt.onrender.com'}${event.poster}`) : null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload event poster</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              
              <label className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
                {previewUrl ? 'Change Poster' : 'Upload Poster'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date & Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('date', { required: 'Event date is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    {...register('time', { required: 'Start time is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.time && (
                  <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    {...register('registrationDeadline')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('isVirtual')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">This is a virtual event</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {watchedFields[0] ? 'Platform/Meeting Details' : 'Venue'} *
                </label>
                <div className="relative">
                  {watchedFields[0] ? (
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  ) : (
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  )}
                  <input
                    type="text"
                    {...register('venue', { required: 'Venue is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={watchedFields[0] ? "Platform details or meeting information" : "Enter venue address"}
                  />
                </div>
                {errors.venue && (
                  <p className="text-red-600 text-sm mt-1">{errors.venue.message}</p>
                )}
              </div>

              {watchedFields[0] && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    {...register('zoomLink')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
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
                  Maximum Capacity *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    {...register('capacity', { 
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Capacity must be at least 1' }
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50"
                  />
                </div>
                {errors.capacity && (
                  <p className="text-red-600 text-sm mt-1">{errors.capacity.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('isPaid')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">This is a paid event</span>
                  </label>
                </div>

                {watchedFields[1] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('ticketPrice', { 
                          required: watchedFields[1] ? 'Ticket price is required for paid events' : false,
                          min: { value: 0, message: 'Price must be positive' }
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.ticketPrice && (
                      <p className="text-red-600 text-sm mt-1">{errors.ticketPrice.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="technology, networking, conference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Status *
                </label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                {errors.status && (
                  <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Event Agenda (Optional)</h2>
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
              <p className="text-gray-500 text-center py-8">No agenda items added yet. Click "Add Item" to get started.</p>
            ) : (
              <div className="space-y-4">
                {agenda.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Agenda Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Speaker</label>
                        <input
                          type="text"
                          value={item.speaker}
                          onChange={(e) => updateAgendaItem(index, 'speaker', e.target.value)}
                          placeholder="Speaker name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                          placeholder="Session title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                          placeholder="Session description"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${id}`)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
