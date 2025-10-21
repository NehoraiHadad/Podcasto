'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteAllCostData, getCostDataStats } from '@/lib/actions/cost';
import { useToast } from '@/hooks/use-toast';

interface CostDataStats {
  totalEvents: number;
  totalEpisodeCosts: number;
  totalDailySummaries: number;
  totalMonthlySummaries: number;
  oldestEvent: Date | null;
  newestEvent: Date | null;
  podcastLevelEvents: number;
  episodeLevelEvents: number;
}

export function CostDataManagement() {
  const [stats, setStats] = useState<CostDataStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    setLoading(true);
    const result = await getCostDataStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    } else {
      toast({
        title: 'שגיאה',
        description: result.error || 'Failed to load statistics',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteAllCostData();

    if (result.success) {
      toast({
        title: 'הצלחה',
        description: `נמחקו ${result.deletedCounts?.events} אירועי עלות, ${result.deletedCounts?.episodeCosts} עלויות פרקים`,
      });
      setStats(null);
      setShowDeleteDialog(false);
      // Refresh the page to update the tables
      window.location.reload();
    } else {
      toast({
        title: 'שגיאה',
        description: result.error || 'Failed to delete cost data',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          ניהול נתוני עלויות
        </CardTitle>
        <CardDescription>
          מחק נתוני עלויות היסטוריים שעלולים להיות לא מדויקים
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Box */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>למה למחוק?</strong> נתוני העלויות הקודמים עלולים להיות לא מדויקים כי
                לא עקבנו אחרי כל הקריאות ל-AI.
              </p>
              <p>
                <strong>מה קורה?</strong> המערכת תמחק את כל נתוני העלויות ההיסטוריים. מעכשיו,
                כל הקריאות ל-AI מעוקבות במדויק.
              </p>
              <p className="text-destructive font-medium">
                <strong>אזהרה:</strong> פעולה זו בלתי הפיכה!
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {!stats && (
          <Button onClick={loadStats} disabled={loading} variant="outline">
            {loading ? 'טוען...' : 'הצג סטטיסטיקה לפני מחיקה'}
          </Button>
        )}

        {stats && (
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">סטטיסטיקת נתונים קיימים:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">סה"כ אירועי עלות:</span>{' '}
                <strong>{stats.totalEvents.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">עלויות פרקים:</span>{' '}
                <strong>{stats.totalEpisodeCosts.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">עלויות רמת פודקאסט:</span>{' '}
                <strong>{stats.podcastLevelEvents.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">עלויות רמת פרק:</span>{' '}
                <strong>{stats.episodeLevelEvents.toLocaleString()}</strong>
              </div>
              {stats.oldestEvent && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">טווח זמן:</span>{' '}
                  <strong>
                    {new Date(stats.oldestEvent).toLocaleDateString('he-IL')} -{' '}
                    {stats.newestEvent
                      ? new Date(stats.newestEvent).toLocaleDateString('he-IL')
                      : 'עכשיו'}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Button */}
        <Button
          onClick={() => setShowDeleteDialog(true)}
          disabled={loading || !stats}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          מחק את כל נתוני העלויות
        </Button>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                האם אתה בטוח?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  פעולה זו תמחק את <strong>כל נתוני העלויות</strong> מהמערכת:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>{stats?.totalEvents.toLocaleString()} אירועי עלות</li>
                  <li>{stats?.totalEpisodeCosts.toLocaleString()} רשומות עלות פרקים</li>
                  <li>{stats?.totalDailySummaries.toLocaleString()} סיכומים יומיים</li>
                  <li>{stats?.totalMonthlySummaries.toLocaleString()} סיכומים חודשיים</li>
                </ul>
                <p className="text-destructive font-medium mt-2">
                  לא ניתן לשחזר נתונים אלו!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>ביטול</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {loading ? 'מוחק...' : 'כן, מחק הכל'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
