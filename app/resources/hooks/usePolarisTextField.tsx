import {useState, useCallback} from 'react';

export function usePolarisTextField(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const onChange = useCallback((newValue: string) => setValue(newValue), []);
  return {value, onChange};
}
