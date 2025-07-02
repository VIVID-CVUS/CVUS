// EmailBodyEditor.tsx
import React, { useState } from 'react';

interface EmailBodyEditorProps {
  emailBody: string;
  setEmailBody: (value: string) => void;
}

const EmailBodyEditor: React.FC<EmailBodyEditorProps> = ({ emailBody, setEmailBody }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 bg-purple-800 text-white font-bold p-4 flex items-center justify-center">
          <span className="text-lg">Corps du mail :</span>
        </div>
        
        <div className="w-full md:w-2/3 bg-gray-50 p-4">
          <div className={`border rounded-lg transition-all duration-200 ${
            isFocused ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'
          }`}>
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 rounded-t-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Message</span>
            </div>
            
            <textarea
              className="w-full p-4 bg-white rounded-b-lg focus:outline-none resize-y"
              style={{ minHeight: '180px' }}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Saisissez le corps de votre email ici..."
            />
          </div>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ce texte sera inclus dans l'email envoyé avec le rapport</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailBodyEditor;