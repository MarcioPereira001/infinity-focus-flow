import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'custom';
export type TaskTab = 'all' | 'personal' | 'shared';

interface TaskFiltersProps {
  activeTab: TaskTab;
  onTabChange: (tab: TaskTab) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  dateRange?: { from: Date; to?: Date };
  onDateRangeChange: (range: { from: Date; to?: Date }) => void;
}

export function TaskFilters({
  activeTab,
  onTabChange,
  timeFilter,
  onTimeFilterChange,
  dateRange,
  onDateRangeChange
}: TaskFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!dateRange?.from || (dateRange.from && dateRange.to)) {
      onDateRangeChange({ from: date });
    } else {
      onDateRangeChange({ 
        from: dateRange.from, 
        to: date > dateRange.from ? date : dateRange.from 
      });
      setIsCalendarOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Selecionar período";
    
    if (!dateRange.to) {
      return format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
    }
    
    return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
  };

  return (
    <div className="space-y-6">
      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TaskTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Geral</TabsTrigger>
          <TabsTrigger value="personal">Pessoal</TabsTrigger>
          <TabsTrigger value="shared">Compartilhados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Time Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'daily' as TimeFilter, label: 'Diário' },
            { key: 'weekly' as TimeFilter, label: 'Semanal' },
            { key: 'monthly' as TimeFilter, label: 'Mensal' }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={timeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeFilterChange(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={timeFilter === 'custom' ? "default" : "outline"}
              size="sm"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
              onClick={() => {
                onTimeFilterChange('custom');
                setIsCalendarOpen(true);
              }}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {timeFilter === 'custom' ? formatDateRange() : "Período Flexível"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                if (range?.from) {
                  onDateRangeChange({
                    from: range.from,
                    to: range.to
                  });
                }
                if (range?.from && range?.to) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}