'use client';
import { useState, useEffect } from "react";
import Map from '@vis.gl/react-mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Types
interface Property {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  property_type: string;
  status: string;
  estimated_value?: number;
  risk_score: number;
  risk_factors: {
    flood?: number;
    fire?: number;
    crime?: number;
  };
  notes?: string;
  created_at: string;
}

// Risk-based marker colors
const getRiskColor = (riskScore: number) => {
  if (riskScore > 70) return '#EF4444'; // Red for high risk
  if (riskScore > 40) return '#F59E0B'; // Yellow for medium risk
  return '#10B981'; // Green for low risk
};

// Property Form Modal
function PropertyModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null,
  coordinates = null 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: any) => void;
  initialData?: Property | null;
  coordinates?: { lat: number; lng: number } | null;
}) {
  const [formData, setFormData] = useState({
    address: '',
    property_type: 'residential',
    estimated_value: '',
    notes: '',
    latitude: coordinates?.lat || 0,
    longitude: coordinates?.lng || 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        address: initialData.address,
        property_type: initialData.property_type,
        estimated_value: initialData.estimated_value?.toString() || '',
        notes: initialData.notes || '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    } else if (coordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      }));
    }
  }, [initialData, coordinates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      estimated_value: parseFloat(formData.estimated_value) || 0,
      id: initialData?.id,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Edit Property' : 'Add New Property'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select
              value={formData.property_type}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estimated Value (USD)</label>
            <input
              type="number"
              value={formData.estimated_value}
              onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              className="w-full p-2 border rounded-lg"
              min="0"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                step="any"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                step="any"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Save Property
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Enhanced Map Component
export default function EnhancedMapView() {
  const [viewState, setViewState] = useState({
    longitude: 36.8219, // Nairobi, Kenya coordinates
    latitude: -1.2921,
    zoom: 10
  });

  return (
    <div className="w-full flex justify-center">
      <div className="relative max-w-6xl w-full mx-auto">
        {/* Map Info Panel */}
        <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Interactive Map
          </div>
          <div className="text-xs text-gray-600">
            Zoom Level: {Math.round(viewState.zoom * 10) / 10}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            • Mouse wheel to zoom
          </div>
          <div className="text-xs text-gray-500">
            • Click and drag to pan
          </div>
        </div>

        {/* Map Container */}
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidmFsZW5jaWFnZW9yZ2UiLCJhIjoiY21mdHFzNG96MHl2aDJrc2RxOGZhemxwdyJ9.IGYdggPowFgd5cap8_g8tQ'}
          style={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            minHeight: '500px'
          }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          // Enable all zoom/pan interactions
          dragPan={true}
          scrollZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          keyboard={true}
          dragRotate={false}
          pitchWithRotate={false}
        />
      </div>
    </div>
  );
}
