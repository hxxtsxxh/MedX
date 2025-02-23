
import { setNotificationsEnabled, getNotificationsEnabled } from '../utils/notificationSettings';

export default function Profile() {
  // ... other state ...
  const [notifications, setNotifications] = useState(true);

  // Load notification settings on mount
  useEffect(() => {
    getNotificationsEnabled().then(enabled => {
      setNotifications(enabled);
    });
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    setNotifications(enabled);
    await setNotificationsEnabled(enabled);
  };

  return (
    // ... existing JSX ...
    <List.Item
      title="Notifications"
      left={props => <List.Icon {...props} icon="bell" />}
      right={() => (
        <Switch
          value={notifications}
          onValueChange={handleNotificationToggle}
        />
      )}
    />
    // ... rest of JSX ...
  );
} 
