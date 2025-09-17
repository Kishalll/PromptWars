// src/components/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 6 }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-t-transparent border-gray-700 w-${size} h-${size}`}></div>
  );
}
