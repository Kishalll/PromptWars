export default function LoadingSpinner({ size = "w-8 h-8", color = "border-cyan-400" }) {
  return (
    <div className="flex items-center justify-center">
      <div className={`${size} border-4 border-gray-700 ${color} border-t-transparent rounded-full animate-spin shadow-lg`}></div>
    </div>
  );
}