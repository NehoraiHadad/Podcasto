import { UseFormReturn } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ContentSourceTabClient } from './content-source-tab-client';
import { MetadataTabClient } from './metadata-tab-client';
import { BasicSettingsTabClient } from './basic-settings-tab-client';
import { AdvancedSettingsTabClient } from './advanced-settings-tab-client';
import { StyleRolesTabClient } from './style-roles-tab-client';
import { FormValues } from './types';

type PodcastFormTabsProps = {
  form: UseFormReturn<FormValues>;
};

export function PodcastFormTabs({ form }: PodcastFormTabsProps) {
  return (
    <Tabs defaultValue="content-source" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="content-source">Content Source</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
        <TabsTrigger value="basic-settings">Basic Settings</TabsTrigger>
        <TabsTrigger value="advanced-settings">Advanced Settings</TabsTrigger>
        <TabsTrigger value="style-roles">Style & Roles</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content-source">
        <Card>
          <CardHeader>
            <CardTitle>Content Source</CardTitle>
            <CardDescription>
              Select the source of content for your podcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ContentSourceTabClient form={form} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="metadata">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Enter basic information about your podcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetadataTabClient form={form} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="basic-settings">
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>
              Configure the basic settings for your podcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BasicSettingsTabClient form={form} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="advanced-settings">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Configure advanced settings for your podcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdvancedSettingsTabClient form={form} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="style-roles">
        <Card>
          <CardHeader>
            <CardTitle>Style & Roles</CardTitle>
            <CardDescription>
              Configure the style and roles for your podcast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StyleRolesTabClient form={form} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 