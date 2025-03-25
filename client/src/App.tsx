import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import Dashboard from "@/pages/Dashboard";
import AlertsPage from "@/pages/AlertsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import AlertBanner from "@/components/layout/AlertBanner";
import { Disaster } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

function App() {
  const [location] = useLocation();
  const [currentAlert, setCurrentAlert] = useState<Disaster | null>(null);

  const { data: disasters } = useQuery({
    queryKey: ['/api/disasters'],
    refetchInterval: 60000, // Refresh every minute to check for new disasters
  });

  useEffect(() => {
    // Set the most severe warning as current alert if available
    if (disasters && disasters.length > 0) {
      const warnings = disasters.filter((d: Disaster) => d.alertType === 'warning');
      if (warnings.length > 0) {
        // Sort by timestamp to get the most recent warning
        const latestWarning = warnings.sort((a: Disaster, b: Disaster) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        setCurrentAlert(latestWarning);
      }
    }
  }, [disasters]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <Header />
      
      {currentAlert && (
        <AlertBanner 
          message={currentAlert.title}
          onClose={() => setCurrentAlert(null)}
        />
      )}
      
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
      
      <Toaster />
    </div>
  );
}

export default App;
