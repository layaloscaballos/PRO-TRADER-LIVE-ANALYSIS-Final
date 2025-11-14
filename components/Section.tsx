
import React from 'react';

interface SectionProps {
    title: React.ReactNode;
    icon: React.ReactNode;
    children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg shadow-md p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2 text-gray-200 border-b border-gray-700 pb-2">
            {icon} {title}
        </h3>
        {children}
    </div>
);

// A helper for input fields to keep styling consistent
const inputCss = `
    width: 100%;
    padding: 0.5rem;
    background-color: #374151; /* bg-gray-700 */
    border: 1px solid #4B5563; /* border-gray-600 */
    border-radius: 0.375rem; /* rounded-md */
    text-align: center;
    color: #F9FAFB; /* text-gray-50 */
    font-weight: 700; /* bold */
    -webkit-appearance: none;
    -moz-appearance: textfield;
`;

const buttonStyles = "w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm";


// Augmenting global scope for shared styles - not ideal but works for this structure
const style = document.createElement('style');
style.textContent = `
    .input-field {
        ${inputCss}
    }
    .input-field:focus {
        outline: none;
        border-color: #06b6d4; /* cyan-500 */
        box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.5); /* Simplified ring */
    }
    .btn-secondary {
        ${buttonStyles.split(' ').join('; ')}
    }
    /* Style browser autofill to match the dark theme for inputs */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #374151 inset !important; /* bg-gray-700 */
        -webkit-text-fill-color: #F9FAFB !important; /* text-gray-50 */
        font-weight: 700 !important;
    }
    /* Keep textarea autofill dark to match its explicit styling */
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    textarea:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #1F2937 inset !important; /* bg-gray-800 from DataInput textarea */
        -webkit-text-fill-color: #ffffff !important;
    }
`;
document.head.append(style);
