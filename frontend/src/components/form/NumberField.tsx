import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export interface NumberFieldProps {
    label: string;
    value?: number;
    isRequired?: boolean;
    onChange?: (value: number) => void;
}

export default function NumberField({
    label,
    value,
    isRequired = false,
    onChange
}: NumberFieldProps) {
    const [fieldValue, setFieldValue] = useState(value || 0);

    useEffect(() => {
        setFieldValue(value || 0);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
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
                type="number"
                value={fieldValue}
                onChange={handleChange}
                required={isRequired}
            />
        </div>
    )
}
