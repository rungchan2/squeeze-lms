"use client";

import { forwardRef } from "react";
import ReactDatePicker from "react-datepicker";
import styled from "@emotion/styled";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  dateFormat?: string;
  className?: string;
  error?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, error, disabled }, ref) => (
  <StyledInput
    ref={ref}
    value={value}
    onClick={onClick}
    placeholder={placeholder}
    readOnly
    error={error}
    disabled={disabled}
  />
));

CustomInput.displayName = "CustomInput";

export default function DatePicker({
  selected,
  onChange,
  placeholder = "날짜를 선택하세요",
  minDate,
  maxDate,
  disabled = false,
  dateFormat = "yyyy-MM-dd",
  className,
  error = false,
}: DatePickerProps) {
  return (
    <StyledDatePickerWrapper className={className}>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        customInput={<CustomInput error={error} disabled={disabled} />}
        popperClassName="date-picker-popper"
        calendarClassName="date-picker-calendar"
        showPopperArrow={false}
        popperPlacement="bottom-start"
      />
    </StyledDatePickerWrapper>
  );
}

const StyledInput = styled.input<{ error?: boolean; disabled?: boolean }>`
  width: 100%;
  height: 44px;
  padding: 12px 16px;
  border: 1px solid ${props => props.error ? 'var(--negative-500)' : 'var(--border-subtle)'};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
  background: ${props => props.disabled ? 'var(--background-muted)' : 'var(--background)'};
  color: ${props => props.disabled ? 'var(--text-muted)' : 'var(--text)'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: var(--primary-400);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px var(--primary-100);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const StyledDatePickerWrapper = styled.div`
  background-color: #fff;
  z-index: 9999;
  position: relative;
  width: 100%;

  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container {
    width: 100%;
  }

  /* Popper styling */
  .date-picker-popper {
    z-index: 1000;
    
    .react-datepicker {
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      font-family: inherit;
      background: #fff;
      border: 1px solid var(--border-subtle);
      
      &::before {
        display: none;
      }
      
      &::after {
        display: none;
      }
    }
    
    .react-datepicker__triangle {
      display: none;
    }
    
    .react-datepicker__header {
      background: var(--background);
      border-bottom: 1px solid var(--border-subtle);
      border-radius: 12px 12px 0 0;
      padding: 16px;
    }
    
    .react-datepicker__current-month {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .react-datepicker__navigation {
      top: 20px;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--background-hover);
      }
      
      &--previous {
        left: 16px;
        border-right-color: var(--text-muted);
      }
      
      &--next {
        right: 16px;
        border-left-color: var(--text-muted);
      }
    }
    
    .react-datepicker__day-names {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .react-datepicker__day-name {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      margin: 0;
    }
    
    .react-datepicker__month {
      padding: 0 16px 16px;
      margin: 0;
    }
    
    .react-datepicker__week {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .react-datepicker__day {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 400;
      color: var(--text);
      border-radius: 6px;
      margin: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--primary-100);
        color: var(--primary-600);
      }
      
      &--selected {
        background: var(--primary-500) !important;
        color: white !important;
        font-weight: 500;
        
        &:hover {
          background: var(--primary-600) !important;
        }
      }
      
      &--today {
        background: var(--primary-50);
        color: var(--primary-600);
        font-weight: 500;
      }
      
      &--outside-month {
        color: var(--text-muted);
        opacity: 0.5;
      }
      
      &--disabled {
        color: var(--text-muted);
        opacity: 0.3;
        cursor: not-allowed;
        
        &:hover {
          background: transparent;
          color: var(--text-muted);
        }
      }
      
      &--keyboard-selected {
        background: var(--primary-100);
        color: var(--primary-600);
      }
    }
  }
`;