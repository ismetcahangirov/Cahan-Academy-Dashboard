import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video } from 'lucide-react';
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
    <button
      onClick={handleJoin}
      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[11px] rounded-md font-medium transition-colors"
    >
      <Video size={12} />
      {t('schedule.join')}
    </button>
  );
}
