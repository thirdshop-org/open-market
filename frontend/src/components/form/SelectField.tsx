import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface SelectFieldProps {
    label: string;
    value?: string;
    options: string[];
    isRequired?: boolean;
    defaultOption?: string;
    onChange?: (value: string) => void;
}

export default function SelectField({
    label,
    value,
    options,
    isRequired = false,
    defaultOption,
    onChange
}: SelectFieldProps) {
    const [fieldValue, setFieldValue] = useState(value || defaultOption || '');

    useEffect(() => {
        setFieldValue(value || defaultOption || '');
    }, [value, defaultOption]);

    const handleValueChange = (newValue: string) => {
        setFieldValue(newValue);
        onChange?.(newValue);
    };

    return (
        <div>
            <Label>
                {label}
                <span className="text-destructive" hidden={!isRequired}>*</span>
            </Label>
            <Select value={fieldValue} onValueChange={handleValueChange} required={isRequired} >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a value" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((option, index) => (
                            <SelectItem key={index} value={option}>{option}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
