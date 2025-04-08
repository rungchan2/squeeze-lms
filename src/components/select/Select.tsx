import Select, { ActionMeta, OnChangeValue } from "react-select";
import makeAnimated from "react-select/animated";

interface SelectOption {
  label: string;
  value: any;
  isFixed?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  defaultValues: SelectOption[];
  onChange: (value: any) => void;
  onBlur: (value: any) => void;
  isDisabled?: boolean;
}

// 옵션 정렬 함수: isFixed가 true인 항목을 먼저 정렬
const orderOptions = (values: readonly SelectOption[]) => {
  return values
    .filter((v) => v.isFixed)
    .concat(values.filter((v) => !v.isFixed));
};

export const StlyedSelect = ({
  options,
  defaultValues,
  onChange,
  onBlur,
  isDisabled = false,
}: SelectProps) => {
  const animatedComponents = makeAnimated();
  
  // 변경 이벤트 핸들러
  const handleChange = (
    newValue: OnChangeValue<SelectOption, true>,
    actionMeta: ActionMeta<SelectOption>
  ) => {
    switch (actionMeta.action) {
      case 'remove-value':
      case 'pop-value':
        // isFixed가 true인 항목은 제거 방지
        if (actionMeta.removedValue.isFixed) {
          return;
        }
        break;
      case 'clear':
        // 전체 삭제 시 isFixed인 항목은 유지
        newValue = options.filter((v) => v.isFixed);
        break;
    }

    // 정렬된 값을 상위 컴포넌트에 전달
    onChange(orderOptions(newValue));
  };

  return (
    <Select
      onBlur={onBlur}
      isClearable={defaultValues.some(v => !v.isFixed)}
      onChange={handleChange}
      closeMenuOnSelect={false}
      components={animatedComponents}
      defaultValue={orderOptions(defaultValues)}
      isMulti
      options={options}
      placeholder="팀원을 선택하세요"
      className="team-select"
      classNamePrefix="team-select"
      isDisabled={isDisabled}
      styles={{
        control: (baseStyles, state) => ({
          ...baseStyles,
          borderRadius: "8px",
          border: state.isFocused
            ? "1px solid var(--primary-500)"
            : "1px solid var(--grey-300)",
          boxShadow: state.isFocused ? "0 0 0 1px var(--primary-300)" : "none",
          "&:hover": {
            borderColor: "var(--primary-400)",
          },
          padding: "2px",
          backgroundColor: isDisabled ? "var(--grey-100)" : "white",
        }),
        multiValue: (baseStyles, { data }) => ({
          ...baseStyles,
          backgroundColor: data.isFixed 
            ? "var(--grey-300)" 
            : "var(--primary-100)",
          borderRadius: "4px",
          padding: "2px 4px",
        }),
        multiValueLabel: (baseStyles, { data }) => ({
          ...baseStyles,
          color: data.isFixed 
            ? "var(--grey-700)" 
            : "var(--primary-700)",
          fontWeight: data.isFixed ? 700 : 500,
          fontSize: "14px",
        }),
        multiValueRemove: (baseStyles, { data }) => ({
          ...baseStyles,
          color: "var(--primary-500)",
          display: data.isFixed ? "none" : "flex",
          "&:hover": {
            backgroundColor: "var(--primary-200)",
            color: "var(--primary-800)",
          },
        }),
        menu: (baseStyles) => ({
          ...baseStyles,
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }),
        option: (baseStyles, { isSelected, isFocused, data }) => ({
          ...baseStyles,
          backgroundColor: isSelected
            ? "var(--primary-500)"
            : isFocused
            ? "var(--primary-100)"
            : "white",
          color: isSelected ? "white" : "var(--grey-700)",
          fontWeight: data.isFixed ? 700 : 400,
          "&:hover": {
            backgroundColor: isSelected
              ? "var(--primary-600)"
              : "var(--primary-100)",
          },
          padding: "10px 12px",
        }),
        dropdownIndicator: (baseStyles) => ({
          ...baseStyles,
          color: "var(--grey-500)",
          "&:hover": {
            color: "var(--primary-500)",
          },
        }),
      }}
    />
  );
};
