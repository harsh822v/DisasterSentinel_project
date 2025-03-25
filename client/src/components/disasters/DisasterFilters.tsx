import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DisasterType, AlertType } from '@/lib/types';
import { motion } from 'framer-motion';

interface DisasterFiltersProps {
  onFilterChange: (filters: {
    types: DisasterType[];
    alertTypes: AlertType[];
    timeRange: string;
  }) => void;
}

const DisasterFilters = ({ onFilterChange }: DisasterFiltersProps) => {
  const [selectedTypes, setSelectedTypes] = useState<DisasterType[]>([]);
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<AlertType[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');

  const handleTypeToggle = (type: DisasterType) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];
      
      onFilterChange({
        types: newTypes,
        alertTypes: selectedAlertTypes,
        timeRange
      });
      
      return newTypes;
    });
  };

  const handleAlertTypeToggle = (alertType: AlertType) => {
    setSelectedAlertTypes(prev => {
      const newAlertTypes = prev.includes(alertType)
        ? prev.filter(t => t !== alertType)
        : [...prev, alertType];
      
      onFilterChange({
        types: selectedTypes,
        alertTypes: newAlertTypes,
        timeRange
      });
      
      return newAlertTypes;
    });
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    onFilterChange({
      types: selectedTypes,
      alertTypes: selectedAlertTypes,
      timeRange: value
    });
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setSelectedAlertTypes([]);
    setTimeRange('24h');
    
    onFilterChange({
      types: [],
      alertTypes: [],
      timeRange: '24h'
    });
  };

  return (
    <div className="space-y-4">
      {/* Disaster Type Filters */}
      <div>
        <p className="text-sm font-medium mb-2">Disaster Type</p>
        <div className="flex flex-wrap gap-2">
          <TypeButton 
            type={DisasterType.Storm}
            icon="bolt"
            label="Storms"
            isSelected={selectedTypes.includes(DisasterType.Storm)}
            onClick={() => handleTypeToggle(DisasterType.Storm)}
          />
          <TypeButton 
            type={DisasterType.Earthquake}
            icon="vibration"
            label="Earthquakes"
            isSelected={selectedTypes.includes(DisasterType.Earthquake)}
            onClick={() => handleTypeToggle(DisasterType.Earthquake)}
          />
          <TypeButton 
            type={DisasterType.Flood}
            icon="water"
            label="Floods"
            isSelected={selectedTypes.includes(DisasterType.Flood)}
            onClick={() => handleTypeToggle(DisasterType.Flood)}
          />
          <TypeButton 
            type={DisasterType.Wildfire}
            icon="local_fire_department"
            label="Wildfires"
            isSelected={selectedTypes.includes(DisasterType.Wildfire)}
            onClick={() => handleTypeToggle(DisasterType.Wildfire)}
          />
        </div>
      </div>
      
      {/* Severity Filter */}
      <div>
        <p className="text-sm font-medium mb-2">Severity Level</p>
        <div className="flex flex-wrap gap-2">
          <AlertTypeButton 
            type={AlertType.Warning}
            label="Warning"
            isSelected={selectedAlertTypes.includes(AlertType.Warning)}
            onClick={() => handleAlertTypeToggle(AlertType.Warning)}
          />
          <AlertTypeButton 
            type={AlertType.Watch}
            label="Watch"
            isSelected={selectedAlertTypes.includes(AlertType.Watch)}
            onClick={() => handleAlertTypeToggle(AlertType.Watch)}
          />
          <AlertTypeButton 
            type={AlertType.Advisory}
            label="Advisory"
            isSelected={selectedAlertTypes.includes(AlertType.Advisory)}
            onClick={() => handleAlertTypeToggle(AlertType.Advisory)}
          />
        </div>
      </div>
      
      {/* Time Range Filter */}
      <div>
        <p className="text-sm font-medium mb-2">Time Range</p>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Reset Button */}
      <div className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
          onClick={handleReset}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

interface TypeButtonProps {
  type: DisasterType;
  icon: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const TypeButton = ({ icon, label, isSelected, onClick }: TypeButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`px-3 py-1 rounded-full text-sm flex items-center ${
      isSelected 
        ? 'bg-primary text-white'
        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
    onClick={onClick}
  >
    <span className="material-icons text-sm mr-1">{icon}</span> {label}
  </motion.button>
);

interface AlertTypeButtonProps {
  type: AlertType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const AlertTypeButton = ({ type, label, isSelected, onClick }: AlertTypeButtonProps) => {
  const getColors = () => {
    switch (type) {
      case AlertType.Warning:
        return isSelected 
          ? 'bg-red-500 text-white' 
          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
      case AlertType.Watch:
        return isSelected 
          ? 'bg-amber-500 text-white' 
          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
      case AlertType.Advisory:
        return isSelected 
          ? 'bg-green-500 text-white' 
          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 py-1 rounded-full text-sm ${getColors()}`}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
};

export default DisasterFilters;
