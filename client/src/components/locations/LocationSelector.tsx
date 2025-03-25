import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Location } from '@/lib/types';
import { searchLocation, detectUserLocation } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface LocationSelectorProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

const LocationSelector = ({ onLocationSelect, initialLocation }: LocationSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation?.name || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const { toast } = useToast();

  const { data: lastUpdated } = useQuery({
    queryKey: ['/api/disasters/lastUpdated'],
    refetchInterval: 60000, // Refresh every minute
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term or use current location",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search for locations",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSearchQuery(location.name);
    setSearchResults([]);
    onLocationSelect(location);
    
    // Invalidate queries that depend on location
    queryClient.invalidateQueries({ queryKey: ['/api/disasters'] });
    queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
  };

  const handleDetectLocation = async () => {
    try {
      const location = await detectUserLocation();
      setSearchQuery(location.name);
      onLocationSelect(location);
      toast({
        title: "Location detected",
        description: `Your location: ${location.name}`,
      });
      
      // Invalidate location-dependent queries
      queryClient.invalidateQueries({ queryKey: ['/api/disasters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
    } catch (error) {
      toast({
        title: "Location detection failed",
        description: error instanceof Error ? error.message : "Could not detect your location",
        variant: "destructive",
      });
    }
  };

  // Format the last updated time
  const formattedLastUpdated = lastUpdated ? 
    new Date(lastUpdated).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'Loading...';

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type="text"
            className="w-full pr-8"
            placeholder="Enter location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5"
            onClick={handleSearch}
            disabled={isSearching}
          >
            <span className="material-icons text-gray-500">search</span>
          </Button>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg">
              {searchResults.map((location, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectLocation(location)}
                >
                  {location.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          size="icon"
          onClick={handleDetectLocation}
          disabled={isSearching}
        >
          <span className="material-icons">my_location</span>
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
        <span className="material-icons text-xs mr-1">schedule</span>
        <span>Last updated: <span className="font-mono">{formattedLastUpdated}</span></span>
      </div>
    </div>
  );
};

export default LocationSelector;
