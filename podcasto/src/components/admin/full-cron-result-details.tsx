'use client';

import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FullCronDetailedResult,
  FullCronIndividualJobResult
} from './cron-runner-constants';

interface FullCronResultDetailsProps {
  results: FullCronDetailedResult;
  timestamp?: string | Date | null;
}

// Sub-component for rendering a single job result item within the full run
function FullCronJobItem({ job }: { job: FullCronIndividualJobResult }) {
  return (
    <div className="border rounded p-2 bg-card">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate" title={job.job}>{job.job}</span>
        <Badge 
          variant={job.success ? "default" : "destructive"} 
          className={`text-xs ${job.success ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}
        >
          {job.success ? 'Success' : 'Failed'}
        </Badge>
      </div>
      {(job.result || job.error) && (
        <div className="mt-2 text-sm">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-xs py-1">
                {job.error ? 'Error Details' : 'Job Output Details'}
              </AccordionTrigger>
              <AccordionContent>
                <pre className="text-xs overflow-auto bg-muted p-2 rounded max-h-40">
                  {job.error ? job.error : JSON.stringify(job.result, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}

export function FullCronResultDetails({ results, timestamp }: FullCronResultDetailsProps) {
  const jobResults = results;

  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-1">Full CRON Run Results:</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="font-medium text-muted-foreground">Timestamp:</div>
        <div>
          {timestamp ? 
            new Date(timestamp as string).toLocaleString() : 
            'N/A'}
        </div>
      </div>
          
      {jobResults.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-2">Executed Jobs:</h5>
          <div className="space-y-2">
            {jobResults.map((job, index) => (
              <FullCronJobItem key={index} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 