import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export interface TextFieldProps {
    label: string;
    value?: string;
    isRequired?: boolean;
    onChange?: (value: string) => void;
}

export default function TextField({
    label,
    value,
    isRequired = false,
    onChange
}: TextFieldProps) {
    const [fieldValue, setFieldValue] = useState(value || '');

    useEffect(() => {
        setFieldValue(value || '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setFieldValue(newValue);
        onChange?.(newValue);
    };

    return (
        <div>
            <Label>
                {label}
                <span className="text-destructive" hidden={!isRequired}>*</span>
            </Label>
            <Input
                type="text"
                value={fieldValue}
                onChange={handleChange}
                required={isRequired}
            />
        </div>
    )
}
