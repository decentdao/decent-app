function Input({
  value,
  type,
  min,
  disabled,
  placeholder,
  width,
  borderColor,
  onChange,
  onKeyDown,
}: {
  value: string,
  type: string,
  min: string | number | undefined,
  disabled: boolean,
  placeholder?: string,
  width:string,
  borderColor:string,
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined,
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement> | undefined,
}) {
  // border-black-100
  return (
    <input
      type={type}
      min={min}
      className={`${width} border ${borderColor} bg-black-500 rounded py-1 px-2 shadow-inner text-mediumGray ${disabled ? "disabled" : ""}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onWheel={e => (e.target as HTMLInputElement).blur()}
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck="false"
    />
  );
}

export {
  Input,
};