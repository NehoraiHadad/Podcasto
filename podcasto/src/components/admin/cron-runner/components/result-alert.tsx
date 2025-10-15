import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { CronOperationResult } from '@/lib/actions/admin';

interface ResultAlertProps {
  result: CronOperationResult;
  children?: React.ReactNode;
}

export function ResultAlert({ result, children }: ResultAlertProps) {
  return (
    <Alert variant={result.success ? 'default' : 'destructive'}>
      {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>{result.success ? 'Run Completed' : 'Run Failed'}</AlertTitle>
      <AlertDescription>
        {result.message}
        {children}
      </AlertDescription>
    </Alert>
  );
}
