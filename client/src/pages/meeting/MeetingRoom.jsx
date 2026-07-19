import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import {
  useJoinOrCreateMeetingMutation,
  useLeaveMeetingMutation,
} from '../../features/meetings/meetingsApi';

// Toolbar without recording/livestreaming buttons.
const TOOLBAR_BUTTONS = [
  'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection',
  'hangup', 'chat', 'raisehand', 'participants-pane', 'tileview',
  'select-background', 'settings',
];

function loadJitsiScript(domain) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve(window.JitsiMeetExternalAPI);
    const src = `https://${domain}/external_api.js`;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.JitsiMeetExternalAPI));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(window.JitsiMeetExternalAPI);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function MeetingRoom() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const meetingIdRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const [joinOrCreate] = useJoinOrCreateMeetingMutation();
  const [leaveMeeting] = useLeaveMeetingMutation();

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const date = searchParams.get('date') || undefined;
        const data = await joinOrCreate({ scheduleId, date }).unwrap();
        if (disposed) return;
        meetingIdRef.current = data.meetingId;

        const JitsiMeetExternalAPI = await loadJitsiScript(data.jitsiDomain);
        if (disposed || !containerRef.current) return;

        const api = new JitsiMeetExternalAPI(data.jitsiDomain, {
          roomName: data.roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: data.displayName, email: data.email },
          configOverwrite: {
            prejoinPageEnabled: true,
            prejoinConfig: { enabled: true },
            disableDeepLinking: true,
            disableThirdPartyRequests: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS,
            SHOW_JITSI_WATERMARK: false,
          },
        });
        apiRef.current = api;
        setReady(true);

        const goBack = () => {
          if (meetingIdRef.current) leaveMeeting(meetingIdRef.current);
          navigate('/schedule');
        };
        api.addEventListener('readyToClose', goBack);
        api.addEventListener('videoConferenceLeft', goBack);
      } catch (err) {
        if (disposed) return;
        const msg = err?.data?.message || t('meeting.joinFailed');
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate('/schedule'), 1500);
      }
    })();

    return () => {
      disposed = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
        apiRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
