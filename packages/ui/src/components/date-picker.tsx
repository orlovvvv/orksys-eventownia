import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@orksys-eventownia/ui/components/button";
import { Calendar } from "@orksys-eventownia/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@orksys-eventownia/ui/components/popover";
import { cn } from "@orksys-eventownia/ui/lib/utils";

type DatePickerProps = {
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
};

function parseDate(value: string | undefined) {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function formatDateLabel(date: Date | undefined) {
  if (!date) return "";
  return format(date, "d MMMM yyyy", { locale: pl });
}

function DatePicker({
  id,
  value,
  onValueChange,
  placeholder = "Wybierz datę",
  disabled,
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDate(value);
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left",
              !selected && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {selected ? formatDateLabel(selected) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          locale={pl}
          className="mx-auto"
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          onSelect={(date) => {
            if (!date) return;
            onValueChange(toDateInputValue(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
