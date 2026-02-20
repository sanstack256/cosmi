type AvatarProps = {
  name: string;
};

export default function Avatar({ name }: AvatarProps) {
  const firstLetter = name?.charAt(0).toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
      {firstLetter}
    </div>
  );
}
