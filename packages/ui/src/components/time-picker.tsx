import * as React from "react";
import { ClockIcon } from "lucide-react";

import { Button } from "@orksys-eventownia/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@orksys-eventownia/ui/components/popover";
import { cn } from "@orksys-eventownia/ui/lib/utils";

type TimePickerProps = {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minuteStep?: number;
  className?: string;
};

const hours = Array.from({ length: 24 }, (_, hour) => hour);

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseTime(value: string | undefined) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  const hour = Number(match?.[1] ?? 12);
  const minute = Number(match?.[2] ?? 0);

  return {
    hour: hour >= 0 && hour <= 23 ? hour : 12,
    minute: minute >= 0 && minute <= 59 ? minute : 0,
  };
}

function formatTime(hour: number, minute: number) {
  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

function TimePicker({
  id,
  value,
  onValueChange,
  placeholder = "Wybierz godzinę",
  disabled,
  minuteStep = 1,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { hour, minute } = parseTime(value);
  const normalizedMinuteStep = Math.min(Math.max(Math.floor(minuteStep), 1), 60);
  const minutes = React.useMemo(
    () =>
      Array.from({ length: Math.ceil(60 / normalizedMinuteStep) }, (_, index) =>
        Math.min(index * normalizedMinuteStep, 59),
      ),
    [normalizedMinuteStep],
  );

  const setHour = (nextHour: number) => {
    onValueChange(formatTime(nextHour, minute));
  };

  const setMinute = (nextMinute: number) => {
    onValueChange(formatTime(hour, nextMinute));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between text-left",
              !value && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          />
        }
      >
        <span className="min-w-0 truncate">
          {value ? formatTime(hour, minute) : placeholder}
        </span>
        <ClockIcon data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72">
        <div className="grid grid-cols-2 gap-3">
          <TimeColumn label="Godzina">
            {hours.map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === hour ? "default" : "ghost"}
                size="sm"
                aria-pressed={item === hour}
                className="w-full justify-center"
                onClick={() => setHour(item)}
              >
                {padTimePart(item)}
              </Button>
            ))}
          </TimeColumn>
          <TimeColumn label="Minuty">
            {minutes.map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === minute ? "default" : "ghost"}
                size="sm"
                aria-pressed={item === minute}
                className="w-full justify-center"
                onClick={() => setMinute(item)}
              >
                {padTimePart(item)}
              </Button>
            ))}
          </TimeColumn>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl bg-surface-container-low p-1">
        {children}
      </div>
    </div>
  );
}

export { TimePicker };
