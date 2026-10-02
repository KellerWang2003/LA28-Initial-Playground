import { Link } from 'react-router'
import { User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ProfileButton({ className }: { className?: string }) {
  return (
    <Link to="/profile" aria-label="Profile" className={cn('rounded-full', className)}>
      <Avatar size="lg">
        <AvatarFallback>
          <User className="size-5" />
        </AvatarFallback>
      </Avatar>
    </Link>
  )
}
