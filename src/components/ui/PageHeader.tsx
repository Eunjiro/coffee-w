import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <div>
        <h1 className="font-bold text-[#776B5D] text-2xl lg:text-3xl">{title}</h1>
        {description && (
          <p className="text-[#776B5D]/70 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
