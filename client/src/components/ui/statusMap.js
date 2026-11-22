import {
  Check,
  CheckCheck,
  Clock,
  X,
  Feather,
  AlertTriangle,
  AlertOctagon,
  Info,
  Circle,
  Hourglass,
  Minus,
} from 'lucide-react';

// Status -> look + icon. Shared by StatusPill / StatusDot; see the table in StatusPill.jsx.
export const STATUS = {
  success: { look: 'filled', icon: Check },
  present: { look: 'filled', icon: CheckCheck },
  late: { look: 'striped', icon: Clock },
  partial: { look: 'striped', icon: Hourglass },
  absent: { look: 'outline', icon: X },
  pending: { look: 'outline', icon: Circle },
  excused: { look: 'dotted', icon: Feather },
  warning: { look: 'dashed', icon: AlertTriangle },
  error: { look: 'alert', icon: AlertOctagon },
  info: { look: 'muted', icon: Info },
  neutral: { look: 'muted', icon: Minus },
};
