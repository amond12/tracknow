import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-[13px] font-semibold text-gray-800">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-[11px] text-gray-400">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
