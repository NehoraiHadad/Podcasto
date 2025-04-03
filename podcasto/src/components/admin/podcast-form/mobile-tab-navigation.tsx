import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface TabInfo {
  value: string;
  label: string;
}

interface MobileTabNavigationProps {
  tabs: TabInfo[];
  activeTab: string;
  currentTabIndex: number;
  goToPreviousTab: (e?: React.MouseEvent) => void;
  goToNextTab: (e?: React.MouseEvent) => void;
  setTabByIndex: (index: number) => (e: React.MouseEvent) => void;
}

export function MobileTabNavigation({
  tabs,
  activeTab,
  currentTabIndex,
  goToPreviousTab,
  goToNextTab,
  setTabByIndex,
}: MobileTabNavigationProps) {
  return (
    <div className="md:hidden">
      {/* Top Mobile tab navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousTab}
          disabled={currentTabIndex === 0}
          className="flex items-center gap-1 p-1 h-8"
          type="button"
          aria-label="Previous Tab"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only md:not-sr-only">Previous</span>
        </Button>

        <div className="flex-1 text-center font-medium">
          {tabs[currentTabIndex]?.label || 'Step'}
          <div className="text-xs text-muted-foreground mt-1">
            Step {currentTabIndex + 1} of {tabs.length}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextTab}
          disabled={currentTabIndex === tabs.length - 1}
          className="flex items-center gap-1 p-1 h-8"
          type="button"
          aria-label="Next Tab"
        >
          <span className="sr-only md:not-sr-only">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile step indicator dots */}
      <div className="flex justify-center space-x-2 mb-6">
        {tabs.map((tab, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={`w-2 h-2 p-0 rounded-full ${
              activeTab === tab.value ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={setTabByIndex(index)}
            aria-label={`Go to ${tab.label}`}
            type="button"
          />
        ))}
      </div>

      {/* Placeholder for where the content will be rendered in the parent */}
      {/* The bottom buttons will be moved below the content in the parent */}
    </div>
  );
}

export default MobileTabNavigation; 