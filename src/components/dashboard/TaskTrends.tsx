import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useTaskStore from '@/lib/stores/useTaskStore';
import { Task } from '@/types/models';
import { format, startOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

export function TaskTrends() {
  const { tasks } = useTaskStore();

  const weeklyData = useMemo(() => {
    const now = new Date();
    const startDate = startOfWeek(subWeeks(now, 3));
    const days = eachDayOfInterval({ start: startDate, end: now });

    const dailyStats = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        const completedAt = task.status === 'completed' ? new Date(task.updatedAt) : null;
        return completedAt && format(completedAt, 'yyyy-MM-dd') === dayStr;
      });

      return {
        date: format(day, 'MMM d'),
        completed: dayTasks.length,
      };
    });

    return dailyStats;
  }, [tasks]);

  const weeklyStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const thisWeekTasks = tasks.filter(task => {
      const completedAt = task.status === 'completed' ? new Date(task.updatedAt) : null;
      return completedAt && completedAt >= thisWeekStart;
    });

    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekTasks = tasks.filter(task => {
      const completedAt = task.status === 'completed' ? new Date(task.updatedAt) : null;
      return completedAt && completedAt >= lastWeekStart && completedAt < thisWeekStart;
    });

    const weeklyChange = lastWeekTasks.length > 0
      ? Math.round(((thisWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100)
      : 0;

    return {
      completionRate,
      thisWeek: thisWeekTasks.length,
      lastWeek: lastWeekTasks.length,
      weeklyChange,
    };
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-2xl font-bold">{weeklyStats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{weeklyStats.thisWeek}</div>
            <div className="text-sm text-muted-foreground">Completed This Week</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${weeklyStats.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weeklyStats.weeklyChange > 0 ? '+' : ''}{weeklyStats.weeklyChange}%
            </div>
            <div className="text-sm text-muted-foreground">vs Last Week</div>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value}`}
              />
              <Tooltip
                content={(props: TooltipProps<ValueType, NameType>) => {
                  const { active, payload } = props;
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Tasks
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="completed"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 