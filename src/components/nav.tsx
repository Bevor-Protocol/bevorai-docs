import { Image } from "fumadocs-core/framework";

export const Logo: React.FC = () => {
  return (
    <div className="flex flex-row gap-4 lg:gap-6 items-center justify-center">
      <Image
        src="/images/Bevor_Logo.png"
        alt="Bevor logo"
        className="h-6 w-auto object-contain"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
};
