import { Button } from './ui/button';
import React from 'react';

export function ButtonLink({ 
  href, 
  label, 
  icon 
}: { 
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Button asChild >
      <a href={href} target="_blank" aria-label={label}>
        {icon}
        {label}
      </a>
    </Button>
  );
}
