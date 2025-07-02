// src/components/Layout/FormContainer.tsx
import React, { ReactNode, RefObject } from 'react';

interface FormContainerProps {
  children: ReactNode;
  formRef?: RefObject<HTMLFormElement | null>;
}

const FormContainer: React.FC<FormContainerProps> = ({ children, formRef }) => {
  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50 shadow-lg rounded-lg">
      <form ref={formRef}>
        {children}
      </form>
    </div>
  );
};

export default FormContainer;
