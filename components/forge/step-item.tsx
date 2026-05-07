interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

export function StepItem({ number, title, description }: StepItemProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-11 sm:w-12 h-11 sm:h-12 border-2 border-[#F5A623] rounded-full flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
        <span className="text-base sm:text-lg font-serif font-medium text-[#F5A623]">{number}</span>
      </div>
      <h3 className="text-base sm:text-lg font-serif font-medium text-[#0D0D0D] mb-2 text-balance">{title}</h3>
      <p className="text-sm font-sans text-[#8A8A8A] max-w-xs">{description}</p>
    </div>
  );
}
