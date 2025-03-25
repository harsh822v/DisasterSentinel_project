import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MapControlsProps {
  mapType: 'standard' | 'satellite' | 'terrain';
  onMapTypeChange: (type: 'standard' | 'satellite' | 'terrain') => void;
  onCenterMap: () => void;
  onToggleFullscreen: () => void;
  onToggleLayers: () => void;
}

const MapControls = ({ 
  mapType, 
  onMapTypeChange, 
  onCenterMap, 
  onToggleFullscreen, 
  onToggleLayers 
}: MapControlsProps) => {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-medium">Disaster Map</h2>
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
          <span className="material-icons text-gray-500 text-sm">public</span>
          <Select 
            value={mapType} 
            onValueChange={(value) => onMapTypeChange(value as any)}
          >
            <SelectTrigger className="border-none bg-transparent shadow-none h-7 text-sm">
              <SelectValue placeholder="Map type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={onToggleLayers}
        >
          <span className="material-icons">layers</span>
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={onToggleFullscreen}
        >
          <span className="material-icons">fullscreen</span>
        </Button>
        <Button 
          onClick={onCenterMap}
          className="flex items-center gap-1"
        >
          <span className="material-icons">center_focus_strong</span>
          <span className="text-sm">Center Map</span>
        </Button>
      </div>
    </div>
  );
};

export default MapControls;
