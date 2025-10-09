import { UseFormReturn } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { PodcastFormMode } from './types';
import { ContentSourceFields } from './content-source-fields';
import { BasicSettingsFields } from './basic-settings-fields';
import { AdvancedSettingsFields } from './advanced-settings-fields';
import { StyleRolesFields, FormValues as StyleRolesFormValues } from './style-roles-fields';
import { BasicInfoFields } from './basic-info-fields';
import { MobileTabNavigation } from './mobile-tab-navigation';
import { ScriptPromptEditor } from './script-prompt-editor';

// Combine required form values from child components if needed
// For now, just ensure compatibility with StyleRolesFields
type CombinedFormValues = StyleRolesFormValues & Record<string, unknown>;

export interface PodcastFormTabsProps<T extends CombinedFormValues> {
  form: UseFormReturn<T>;
  mode: PodcastFormMode;
  incompleteTabsMessage?: string;
}

// Define tab values as constants to avoid any typos
const TAB_VALUES = {
  BASIC_INFO: "basic-info",
  CONTENT_SOURCE: "content-source",
  BASIC_SETTINGS: "basic-settings",
  ADVANCED_SETTINGS: "advanced-settings",
  STYLE_ROLES: "style-roles",
  SCRIPT_PROMPT: "script-prompt"
};

export function PodcastFormTabs<T extends CombinedFormValues>({ form, mode, incompleteTabsMessage }: PodcastFormTabsProps<T>) {
  const [activeTab, setActiveTab] = useState<string>(TAB_VALUES.BASIC_INFO);
  
  const tabs = useMemo(() => [
    { value: TAB_VALUES.BASIC_INFO, label: "Basic Info" },
    { value: TAB_VALUES.CONTENT_SOURCE, label: "Content" },
    { value: TAB_VALUES.BASIC_SETTINGS, label: "Settings" },
    { value: TAB_VALUES.ADVANCED_SETTINGS, label: "Advanced" },
    { value: TAB_VALUES.STYLE_ROLES, label: "Style" },
    { value: TAB_VALUES.SCRIPT_PROMPT, label: "Script Prompt" }
  ], []);
  
  // Find current tab index to enable next/previous navigation
  const currentTabIndex = tabs.findIndex(tab => tab.value === activeTab);
  
  // Go to next tab - wrapped in useCallback
  const goToNextTab = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].value);
    }
  }, [currentTabIndex, tabs, setActiveTab]);
  
  // Go to previous tab - wrapped in useCallback
  const goToPreviousTab = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].value);
    }
  }, [currentTabIndex, tabs, setActiveTab]);
  
  // Handle tab change - wrapped in useCallback
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, [setActiveTab]);
  
  // Set a specific tab - wrapped in useCallback
  const setTabByIndex = useCallback((index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (index >= 0 && index < tabs.length) {
      setActiveTab(tabs[index].value);
    }
  }, [tabs, setActiveTab]);
  
  return (
    <div className="w-full max-w-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Desktop view tabs - hidden on mobile */}
        <div className="hidden md:block w-full overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-6 gap-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Mobile view navigation - Use the new component */}
        <MobileTabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          currentTabIndex={currentTabIndex}
          goToPreviousTab={goToPreviousTab}
          goToNextTab={goToNextTab}
          setTabByIndex={setTabByIndex}
        />
        
        <TabsContent value={TAB_VALUES.BASIC_INFO}>
          <Card className="border-0 shadow-sm md:border md:shadow">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                {mode === 'create' ? 'Enter basic information about your podcast' : 'Edit the basic information for your podcast'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 space-y-4">
              <BasicInfoFields form={form} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={TAB_VALUES.CONTENT_SOURCE}>
          <Card className="border-0 shadow-sm md:border md:shadow">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle>Content Source</CardTitle>
              <CardDescription>
                Select the source of content for your podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 space-y-4">
              <ContentSourceFields form={form} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={TAB_VALUES.BASIC_SETTINGS}>
          <Card className="border-0 shadow-sm md:border md:shadow">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for your podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 space-y-4">
              <BasicSettingsFields form={form} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={TAB_VALUES.ADVANCED_SETTINGS}>
          <Card className="border-0 shadow-sm md:border md:shadow">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced settings for your podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 space-y-4">
              <AdvancedSettingsFields form={form} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={TAB_VALUES.STYLE_ROLES}>
          <Card className="border-0 shadow-sm md:border md:shadow">
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle>Style & Roles</CardTitle>
              <CardDescription>
                Configure the style and roles for your podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 space-y-4">
              <StyleRolesFields form={form as unknown as UseFormReturn<StyleRolesFormValues>} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={TAB_VALUES.SCRIPT_PROMPT}>
          <div className="px-0 md:px-0">
            <ScriptPromptEditor
              value={form.watch('scriptGenerationPrompt' as keyof T) as unknown as string}
              onChange={(value) => form.setValue('scriptGenerationPrompt' as keyof T, value as unknown as T[keyof T])}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Bottom Mobile next/previous buttons - specific to mobile */}
      <div className="flex justify-between mt-6 md:hidden">
        <Button
          variant="outline"
          onClick={goToPreviousTab}
          disabled={currentTabIndex === 0}
          className="flex-1 mr-2"
          type="button"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="default"
          onClick={goToNextTab}
          disabled={currentTabIndex === tabs.length - 1}
          className="flex-1 ml-2"
          type="button"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      {incompleteTabsMessage && (
        <div className="text-red-500 text-sm mt-2 mb-4 text-center md:text-left">
          {incompleteTabsMessage}
        </div>
      )}
    </div>
  );
}

// Default export for dynamic import
export default PodcastFormTabs; 