import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CronJobType, CRON_JOB_OPTIONS } from '../../cron-runner-constants';

interface JobSelectorProps {
  selectedJob: CronJobType;
  onJobChange: (job: CronJobType) => void;
  disabled?: boolean;
}

export function JobSelector({ selectedJob, onJobChange, disabled }: JobSelectorProps) {
  return (
    <Select
      value={selectedJob}
      onValueChange={(value) => onJobChange(value as CronJobType)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full mt-4">
        <SelectValue placeholder="Select a job" />
      </SelectTrigger>
      <SelectContent>
        {CRON_JOB_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
