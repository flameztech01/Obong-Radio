// src/components/Toggle.jsx
import React from 'react';

const Toggle = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
        ${checked ? 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.3)]' : 'bg-zinc-800 border border-zinc-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* The Knob (White circle) */}
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0
          transition-transform duration-300 ease-in-out
          ${checked ? 'translate-x-[22px] bg-white' : 'translate-x-[3px] bg-zinc-500'}
        `}
      />
    </button>
  );
};

export default Toggle;