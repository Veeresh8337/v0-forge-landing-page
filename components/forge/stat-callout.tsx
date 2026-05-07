interface StatCalloutProps {
  number: string;
  label: string;
}

export function StatCallout({ number, label }: StatCalloutProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-3xl sm:text-4xl font-serif font-medium text-[#F5A623] mb-2">{number}</div>
      <p className="text-xs sm:text-sm font-sans text-[#F5F4F0]">{label}</p>
    </div>
  );
}
