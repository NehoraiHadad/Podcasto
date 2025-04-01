'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { runEpisodeChecker } from '@/lib/actions/admin-actions';

export interface CronResult {
  checked: number;
  timed_out: number;
  completed: number;
  processed: number;
  requires_processing: number;
  errors: string[];
}

export function CronRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      results?: CronResult;
      timestamp?: string;
    };
  } | null>(null);

  const handleRunCron = async () => {
    try {
      setIsRunning(true);
      const result = await runEpisodeChecker();
      
      setLastRunTime(new Date());
      setLastResult(result);
      
      if (result.success) {
        toast.success('CRON process completed successfully');
      } else {
        toast.error(`CRON process failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error running CRON:', error);
      toast.error('Failed to run CRON process');
      
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>Manual CRON Runner</span>
        </CardTitle>
        <CardDescription>
          Manually run the episode checker CRON job to process pending episodes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lastResult && (
          <Alert variant={lastResult.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5" />
              )}
              <div>
                <AlertTitle className="text-base">
                  {lastResult.success ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  {lastResult.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
        
        {lastResult?.details?.results && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger>Run Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Timestamp:</div>
                    <div className="text-sm">
                      {lastResult.details.timestamp ? 
                        new Date(lastResult.details.timestamp).toLocaleString() : 
                        'Not available'}
                    </div>
                    
                    <div className="text-sm font-medium">Episodes Checked:</div>
                    <div className="text-sm">{lastResult.details.results.checked}</div>
                    
                    <div className="text-sm font-medium">Timed Out:</div>
                    <div className="text-sm">
                      <Badge variant="outline" className="font-normal">
                        {lastResult.details.results.timed_out}
                      </Badge>
                    </div>
                    
                    <div className="text-sm font-medium">Completed:</div>
                    <div className="text-sm">
                      <Badge variant="outline" className="font-normal">
                        {lastResult.details.results.completed}
                      </Badge>
                    </div>
                    
                    <div className="text-sm font-medium">Processed:</div>
                    <div className="text-sm">
                      <Badge variant="outline" className="font-normal">
                        {lastResult.details.results.processed}
                      </Badge>
                    </div>
                  </div>
                  
                  {lastResult.details.results.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Errors:</h4>
                      <ul className="text-sm space-y-1">
                        {lastResult.details.results.errors.map((error, index) => (
                          <li key={index} className="text-destructive">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastRunTime ? (
            <>Last run: {lastRunTime.toLocaleString()}</>
          ) : (
            <>Never run manually</>
          )}
        </div>
        
        <Button onClick={handleRunCron} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>Run Now</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 