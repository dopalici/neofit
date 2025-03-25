import React from 'react';

export default function ChatMessage({ message }) {
  return (
    <div 
      className={`${
        message.role === 'user' 
          ? 'bg-cyber-black border border-cyber-pink text-cyber-pink ml-8' 
          : 'bg-gray-950 border border-cyber-cyan text-cyber-cyan mr-8'
      } p-3 rounded-lg text-sm font-mono`}
    >
      <p>{message.content}</p>
      {message.references && (
        <div className="mt-2 text-xs opacity-70">
          <p>References:</p>
          <ul className="list-disc pl-4">
            {message.references.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}