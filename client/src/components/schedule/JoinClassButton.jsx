import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video } from 'lucide-react';
import { Button } from '../ui';
import { joinWindowState } from '../../utils/academyTime';

export default function JoinClassButton({ entry }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState(() => joinWindowState(entry));

  useEffect(() => {
    const tick = () => setState(joinWindowState(entry));
    tick();
    const id = setInterval(tick, 30000); // re-evaluate every 30s so the button appears when class starts
    return () => clearInterval(id);
  }, [entry]);

  if (entry?.type !== 'online' || !state.show) return null;

  const handleJoin = () => {
    const qs = state.occurrenceDate ? `?date=${state.occurrenceDate}` : '';
    navigate(`/meeting/${entry._id}${qs}`);
  };

  return (
    <Button size="sm" className="mt-2" icon={Video} onClick={handleJoin}>
      {t('schedule.join')}
    </Button>
  );
}
