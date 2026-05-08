import Link from 'next/link'

interface TalentCardProps {
  id: string;
  name: string;
  role: string;
  skills: string[];
  github: string;
  stars: number;
}

export function TalentCard({ id, name, role, skills, github, stars }: TalentCardProps) {
  return (
    <Link href={`/profile/${id}`} className="block border-2 border-[#8A8A8A] p-5 sm:p-6 bg-white hover:border-[#F5A623] transition-colors duration-300 flex flex-col h-full group">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-serif font-medium text-[#0D0D0D] text-balance group-hover:text-[#F5A623] transition-colors">{name}</h3>
        <p className="text-xs sm:text-sm font-sans text-[#8A8A8A] mt-1">{role}</p>
      </div>
      
      <div className="mb-4 flex-grow">
        <div className="flex gap-2 flex-wrap">
          {skills.map((skill) => (
            <span key={skill} className="text-xs font-sans bg-[#F5F4F0] text-[#0D0D0D] px-2 sm:px-3 py-1 border border-[#8A8A8A]">
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t-2 border-[#8A8A8A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <span className="text-xs sm:text-sm font-sans text-[#0D0D0D] group-hover:text-[#F5A623] transition-colors font-medium">
          View Profile →
        </span>
        <div className="text-xs font-sans text-[#8A8A8A] whitespace-nowrap">
          ⭐ {stars}
        </div>
      </div>
    </Link>
  );
}
